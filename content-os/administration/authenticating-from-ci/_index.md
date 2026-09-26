+++
title = "Authenticating from CI"
weight = 166
description = "Choose a credential for CI jobs, pass a deploy token from GitHub Actions or GitLab CI, and avoid the failed-login limit."
+++

# Authenticating from CI

Build servers and CI jobs send credentials with every request: a Maven build resolves hundreds of dependencies and a
`docker pull` fetches many layers. This page explains which credential to give such a job, how to pass it from a CI
system, and how Repsy Open Source protects itself from wrong credentials.

## Choose a credential

| Credential | Scope | Use it for |
| --- | --- | --- |
| Deploy token | One repository | CI jobs, build servers and outside parties. **This is the one to use.** |
| Username and password of a user | Every repository | People, working on their own machine. |
| Access token of the web UI | The web UI only | Nothing else: the web UI gets it when you sign in, and package clients cannot use it. |

A user account can read and write every repository of the instance (see [Managing Users](../managing-users/)). A CI job
that holds an account password can therefore change every repository, and its password is the password of a person.
A deploy token opens one repository and nothing else, can be read-only, expires, and can be rotated or revoked
without touching any account.

## Deploy tokens

An administrator creates a deploy token in the settings of a repository, in the **Deploy Tokens** section. Repsy shows the
token once, right after you create it, and stores only a hash of it. Copy it into the secret store of your CI system
straight away. If you lose it, rotate the token to get a new one.

How Repsy treats a deploy token:

- **The token is the password.** Send it as the password of HTTP Basic authentication, or as a bearer token where the
  client's setting is a token (npm `_authToken`, a NuGet API key, a Cargo or RubyGems token). Repsy checks only the
  token. The username is a label and is not checked, so use any value; some clients insist on a non-empty one.
- **One repository.** A token works for the repository it was created in and is rejected everywhere else, and for the
  web UI.
- **Read/Write or Read Only.** A read-only token can download but is refused for anything that changes a repository. The
  refusal is a `401`, not a `403`.
- **It never deletes.** A token reads and, unless it is read-only, writes, but it can not remove stored files: a job that
  runs `npm unpublish`, deletes a Helm chart version or deletes a Docker manifest is refused with `401`, also with a
  Read/Write token. Those calls need the username and password of an administrator (a service account with the `ADMIN`
  role, kept out of routine jobs). Publishing, `npm deprecate`, `npm dist-tag`, `cargo yank`, NuGet unlist and
  `gem yank` need write access only.
- **It expires.** The web UI only accepts an expiry date within one year. An expired token is refused with
  `Deploy token expired.`
- **Rotate and revoke.** Rotating gives the token a new secret and the old one stops working at once. Revoking deletes
  the token. Update your CI secret as soon as you rotate or revoke: a job that keeps sending the old value counts as a
  [failed login](#the-failed-login-limit).
- **It is cheap to check.** A deploy token is looked up by its hash. A user password is stored with BCrypt, which is slow
  on purpose, so every check of a password costs CPU time, see [The Basic authentication cache](#the-basic-authentication-cache).

To test a token from a shell, use it as the password of a Maven upload or of a Docker login:

```bash
curl -u "ci:$REPSY_TOKEN" -T app-1.0.jar \
  https://repo.example.com/<repo-name>/com/example/app/1.0/app-1.0.jar

echo "$REPSY_TOKEN" | docker login repo.example.com -u ci --password-stdin
```

## Passing the token from a CI system

Keep the token in the secret store of your CI system and hand it to the job as an environment variable. Never write it
into a repository or a Dockerfile. The examples below use these variables, which you define in the CI system:

| Variable | Example | Meaning |
| --- | --- | --- |
| `REPSY_HOST` | `repo.example.com` | The host of the package protocols, without a scheme (with the port if it is not 443). |
| `REPSY_REPO` | `releases` | The name of the repository. |
| `REPSY_TOKEN` | *(secret)* | The deploy token. |

### GitHub Actions

Store the token as a repository secret named `REPSY_TOKEN`:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      REPSY_HOST: repo.example.com
      REPSY_REPO: releases
      REPSY_TOKEN: ${{ secrets.REPSY_TOKEN }}
    steps:
      - uses: actions/checkout@v4

      - name: Push the Docker image
        run: |
          echo "$REPSY_TOKEN" | docker login "$REPSY_HOST" -u ci --password-stdin
          docker build -t "$REPSY_HOST/$REPSY_REPO/app:${GITHUB_SHA::7}" .
          docker push "$REPSY_HOST/$REPSY_REPO/app:${GITHUB_SHA::7}"
```

### GitLab CI

Add `REPSY_TOKEN` under **Settings > CI/CD > Variables** and mask it:

```yaml
publish:
  variables:
    REPSY_HOST: repo.example.com
    REPSY_REPO: releases
  script:
    - echo "//$REPSY_HOST/$REPSY_REPO/:_authToken=$REPSY_TOKEN" > .npmrc
    - npm publish --registry "https://$REPSY_HOST/$REPSY_REPO/"
```

### Maven

Maven reads environment variables in `settings.xml`. Give the server the same `id` as the repository entry in your
`pom.xml`:

```xml
<settings>
  <servers>
    <server>
      <id>repsy</id>
      <username>ci</username>
      <password>${env.REPSY_TOKEN}</password>
    </server>
  </servers>
</settings>
```

The exact configuration of each package manager is described in the pages of that format, and the web UI shows a
ready-made snippet for every repository.

## The failed-login limit

BCrypt makes a failed login expensive, so a flood of wrong credentials could keep the CPU busy. Repsy therefore limits
the failed password checks of each client. A client may make `AUTH_THROTTLE_MAX_FAILURES` failed checks (20) in a window
of `AUTH_THROTTLE_WINDOW_SECONDS` seconds (60). After that, the client's next password check is answered with
`429 Too Many Requests` until the window ends, without a BCrypt check:

```text
HTTP/1.1 429
Retry-After: 59

{"msgId":"tooManyRequests","type":"ERROR", ..., "text":"Too many failed authentication attempts. Please try again later."}
```

`Retry-After` holds the seconds left in the window. Docker and Helm clients get the OCI error `TOOMANYREQUESTS` instead,
and no client is sent a challenge with the `429`, so none of them asks for credentials again in a loop. Fix the
credentials in the job and wait for the time in `Retry-After`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `AUTH_THROTTLE_ENABLED` | `true` | Turns the limit on. Set `false` if you already limit failed logins in your proxy. |
| `AUTH_THROTTLE_MAX_FAILURES` | `20` | Failed password checks a client may make per window. |
| `AUTH_THROTTLE_WINDOW_SECONDS` | `60` | Length of the window. When it ends, the client starts with a clean count. |
| `AUTH_THROTTLE_MAX_CLIENTS` | `10000` | How many clients are tracked at once. |

How it counts:

- **What counts.** A failed password check (a wrong password, or a username that does not exist, which are counted and
  answered the same way), and a bearer value that Repsy does not recognise: a deploy token that was revoked, rotated or
  belongs to another repository, or a forged token. The web UI sign-in and all package ports share one count per client.
- **What does not count.** A request that succeeds, a valid deploy token, a valid bearer token, a request without a
  username, and a token that Repsy recognises but refuses (read-only, or not an administrator for a management call). A
  token that has merely expired also does not count. A success does not reset the count: only the end of the window does.
- **Who is the client.** The client is the remote address of the request. Behind a reverse proxy that is the address the
  proxy puts in `X-Forwarded-For`, see [Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/). For IPv6,
  the client is the `/64` network of the address, not the full address.
- **It is per client, not per user.** A limit never reveals which usernames exist.

While a client is blocked, correct credentials are refused too, also for the web UI sign-in, with one exception: a valid
deploy token, a valid bearer token and a password that Repsy remembers (see below) still work. A CI job with a deploy
token is therefore not locked out by a neighbour that sends wrong passwords. A client that keeps guessing after it is
blocked, at ten times the limit, loses the exception for remembered passwords too, until its window ends.

### Common causes of a `429`

- **A stale token in a CI job.** A job that keeps sending a rotated or revoked token, such as an old `NPM_TOKEN`, spends
  the same budget as a wrong password. `npm install` sends many requests at once, so one stale token can use up all 20
  failures within a second and block the address for the rest of the window. Update the secret in the job.
- **Many users behind one address.** A company network or a shared CI egress address counts as one client. Raise
  `AUTH_THROTTLE_MAX_FAILURES` if a shared address regularly reaches the limit.
- **The proxy address is used as the client.** If Repsy does not trust your proxy, every request appears to come from
  the proxy, all clients share one count, and one client with wrong passwords can block everybody. Repsy logs the
  blocked client once per window at `WARN`:

  ```text
  Client 10.0.0.5 (network 10.0.0.5) made 20 failed password checks, refusing its password checks until its window ends
  ```

  If the address in that line is your proxy, see [Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#forward-the-clients-address-scheme-and-host).

## The Basic authentication cache

To avoid one BCrypt check for every request of a client that sends its username and password each time, Repsy remembers
each successful password check for a while. The cache is not a session:

- It remembers that this password matched this stored password hash. It holds a keyed digest, never the password.
- A changed password, a deleted user or a changed role takes effect on the next request.
- A wrong password, an unknown username and a failed check are never remembered.
- The cache lives in memory only. It is empty after a restart.

| Variable | Default | Meaning |
| --- | --- | --- |
| `BASIC_AUTH_CACHE_ENABLED` | `true` | Turns the cache on. |
| `BASIC_AUTH_CACHE_TTL_SECONDS` | `300` | How long a successful check is remembered. |
| `BASIC_AUTH_CACHE_MAX_ENTRIES` | `10000` | How many checks are remembered. |

The cache only helps requests that carry a user password. Deploy tokens need no cache.
