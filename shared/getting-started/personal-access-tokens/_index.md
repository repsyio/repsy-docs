+++
title = "Personal Access Tokens"
weight = 142
chapter = true
description = "Create, rotate and revoke a personal access token, choose its scopes, and use it as the password of every package client and the rp CLI."
+++


### Personal Access Tokens

A personal access token belongs to **your user**. It signs package clients, scripts, CI jobs and the `rp` command line
client in with your rights, narrowed to the scopes you pick, so you do not have to hand your password to
them. Use it wherever a client asks for your Repsy password.

| | Personal access token | [Deploy token](../creating-a-deploy-token/) |
| --- | --- | --- |
| Belongs to | Your user | One repository |
| Reaches | Every repository you can reach | That repository only |
| Narrowed by | Its scopes (`repo:read`, `repo:write`, `repo:manage`) | Read/Write or Read Only |
| Works with | Package clients, the panel API and `rp` | Package clients only |
| Lifetime | At most 365 days | At most 365 days |

Pick a deploy token when a job or an outside party should reach one repository and nothing else. Pick a personal access
token when a script or a tool works across your repositories, or calls the panel API.

### What a Token May Do

A token can only narrow what you may do yourself, never widen it. On every request Repsy takes what you may do on the
repository and keeps the part that the token's scopes allow.

| Scope | Allows |
| --- | --- |
| `repo:read` | Download packages, read metadata and lists, and read scan results. |
| `repo:write` | Also publish and push packages, and start scans. |
| `repo:manage` | Also delete packages and versions, change repository settings and manage deploy tokens. |
| `profile:read` | Read who the token belongs to. Every token has it; you do not choose it. |

`repo:write` includes `repo:read`, and `repo:manage` includes both. No other scope includes `repo:manage`: a token without
it never deletes, even if you may.

`scan:read` is deprecated: `repo:read` reads scan results too, and the panel no longer offers it. A token that already has it
keeps working, and reads scan results only, not the repository itself.

{{< product "cloud" >}}
What you may do on a repository is what you may do as its owner or as a collaborator with read, write or manage rights. A
`repo:manage` token of a collaborator who only writes to a repository cannot delete there.
{{< /product >}}

{{< product "os" >}}
Every user of the instance can read and write every repository; only the `ADMIN` role manages (see
[Managing Users](../../administration/managing-users/)). So for a `USER`, `repo:read` and `repo:write` are what limit a
token, and `repo:manage` does nothing. The panel offers `repo:manage` to administrators only. Because the role is read
again on every request, a token of a user who is made an administrator later starts to manage at once.
{{< /product >}}

### Creating a Token

1. Open the user menu in the header of the panel and click **Settings**.
2. In the **Access Tokens** section, click **Create Token**.
3. Fill in the form and click **Create**:

| Field | Details |
| --- | --- |
| Name | Required. It must differ, ignoring case, from your other tokens that are not revoked and have not expired. |
| Scopes | At least one of **Read repositories** (`repo:read`), **Publish packages** (`repo:write`) and **Manage repositories** (`repo:manage`). |
| Expiration Date | Up to 365 days from today; the form starts there. A token never lives longer. |

Repsy shows the token once, right after you create it, and keeps only a hash of it. Copy it into your CI system's secret
store or a password manager straight away. If you lose it, rotate the token to get a new one. A token starts with
`rut-`, which secret scanners can match.

You can hold at most 50 tokens that have not expired. Expired tokens stay in the list until you revoke them, but they
do not count.

### Rotating and Revoking

The **Access Tokens** section lists each token with its name, scopes, creation date, last use and expiry date.

{{< product "cloud" >}}
- **Rotate** replaces the secret. The token keeps its name, scopes and expiry date (an expired token gets 365 days
  again) and gets a new id. The old secret stops working at once, so update every place that uses it. Repsy shows the
  new secret once.
{{< /product >}}
- **Revoke** ends the token at once. Clients that still use it are refused with `401`.
- **Revoke all** revokes every token in the list.

{{< product "os" >}}
The web UI has no **Rotate** button. Rotate a token with `rp token rotate <token-id>` or
the panel API (`POST /api/profile/access-tokens/{tokenId}/actions/rotate`); the token keeps its name and scopes and gets a
new secret and a new id.
{{< /product >}}

Changing your password does not revoke your tokens. If a token may have leaked, revoke or rotate it.

### Using a Token in a Package Client

Send the token as the **password**. Repsy checks only the token: the username is not checked, so use your username or
any other value; some clients insist on a non-empty one. Where a client takes a bare token instead (an npm
`_authToken`, Cargo), the token alone is enough. The examples read the token from the environment variable
`REPSY_TOKEN`, as a CI job would; put it in your CI system's secrets, never in a file you commit.

{{< product "cloud" >}}
Replace `<username>` with your Repsy username and `<repo-name>` with the name of the repository.
{{< /product >}}
{{< product "os" >}}
`<your-repsy-host>` stands for the host and port of the repository port of your instance, see
[Ports and Repository URLs](../ports-and-repository-urls/). The address of a repository has no username, so `<username>`
below is only the Basic username and can be any value.
{{< /product >}}

#### Maven

In `~/.m2/settings.xml`, with the same `id` as the repository in your `pom.xml`:

```xml
<settings>
  <servers>
    <server>
      <id>repsy</id>
      <username>MY REPSY USERNAME</username>
      <password>${env.REPSY_TOKEN}</password>
    </server>
  </servers>
</settings>
```

Gradle takes the same pair in the `credentials` block of the repository. See [Using a Private Maven Repository](../../maven/using-private-maven-repository/).

#### npm

In the `.npmrc` of the project or of your user:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=${REPSY_TOKEN}
```

`npm login --registry {{% repo-url %}}/<repo-name>/` with the token as the password works too. See [Publishing an npm Package](../../npm/publishing-an-npm-package/).

#### PyPI

```bash
pip install <package-name> \
  --index-url "https://<username>:${REPSY_TOKEN}@{{% repo-url scheme="false" %}}/<repo-name>/simple"
twine upload --repository-url {{% repo-url %}}/<repo-name> \
  -u <username> -p "$REPSY_TOKEN" dist/*
```

See [Publishing a PyPI Package](../../pypi/publishing-a-pypi-package/).

#### Docker

```bash
echo "$REPSY_TOKEN" | docker login {{% repo-url scheme="false" account="false" %}} -u <username> --password-stdin
```

See [Publishing a Docker Image](../../docker/publishing-a-docker-image/) and [Docker and the Token Exchange](#docker-and-the-token-exchange) below.

#### Cargo

Cargo sends the token alone. With the registry `repsy` in `~/.cargo/config.toml`:

```bash
export CARGO_REGISTRIES_REPSY_TOKEN="$REPSY_TOKEN"
cargo publish --registry repsy
```

Or run `cargo login --registry repsy` and paste the token. See [Publishing a Cargo Crate](../../cargo/publishing-a-cargo-crate/).

#### Go

In `~/.netrc`:

```text
machine {{% repo-url scheme="false" account="false" %}}
login <username>
password <token>
```

See [Installing a Go Module](../../go/installing-a-go-module/).

#### Helm

```bash
echo "$REPSY_TOKEN" | helm repo add <repo-name> {{% repo-url path="helm" %}}/<repo-name> \
  --username <username> --password-stdin
echo "$REPSY_TOKEN" | helm registry login {{% repo-url scheme="false" account="false" %}} \
  --username <username> --password-stdin
```

The first is the classic protocol, the second OCI. See [Publishing a Helm Chart](../../helm/publishing-a-helm-chart/).

#### NuGet

```bash
dotnet nuget add source {{% repo-url %}}/<repo-name>/v3/index.json --name repsy \
  --username <username> --password "$REPSY_TOKEN" --store-password-in-clear-text
```

This writes the `ClearTextPassword` entry to your user-level `NuGet.Config`. See [Publishing a NuGet Package](../../nuget/publishing-a-nuget-package/).

#### Ruby

`gem push` reads a Basic value from `~/.gem/credentials`:

```bash
mkdir -p ~/.gem
echo ":repsy: Basic $(echo -n "<username>:${REPSY_TOKEN}" | base64)" >> ~/.gem/credentials
chmod 0600 ~/.gem/credentials
gem push my_gem-1.0.0.gem --host {{% repo-url %}}/<repo-name> --key repsy
```

See [Publishing a Ruby Gem](../../ruby/publishing-a-ruby-gem/).

### Docker and the Token Exchange

Docker does not send the password with every request. `docker login`, `docker pull` and `docker push` first exchange
the username and password at the registry's `/v2/token` endpoint for a short-lived registry token, and send that token to
`/v2`. With a personal access token as the password:

- The registry token carries what the client asked for, narrowed to the token's scopes and to what you may do on the
  repository: `pull` needs `repo:read`, `push` needs `repo:write`, and deleting a manifest needs `repo:manage`.
- If nothing of what was asked for is left, the answer is a registry token with an empty access list, not a `401`. So
  `docker login` succeeds, and the registry refuses the pull or push that follows.
- The registry token never outlives the personal access token. Repsy checks the personal access token again on every
  request, so revoking it ends the registry token at once.
- Send the token as the password of the exchange only: a personal access token sent straight to `/v2` as a Bearer value is
  refused.

Helm's OCI commands (`helm registry login`, `helm push`, `helm pull oci://`) use the same exchange.

### Using a Token with the CLI

The `rp` command line client signs in with a personal access token. On your own machine, `rp auth login` opens
the panel in your browser and creates a short-lived token for you, so you paste nothing. In CI, create a token as
described above, store it as a secret and expose it as `REPSY_TOKEN`:

```bash
export REPSY_TOKEN=<token>
rp repo list
```

`rp token create` creates a token from the command line.{{< product "cloud" >}} See [Authentication](../../cli/authentication/) for every way
to sign in, and [Installation](../../cli/installation/) to install `rp`.{{< /product >}}
