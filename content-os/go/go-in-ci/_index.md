+++
title = "Go in CI"
weight = 880
description = "Use a deploy token in CI to install Go modules and publish module versions, and reach the instance over HTTPS."
+++

A CI job that builds a Go project with modules from your Repsy Open Source instance, or publishes a version of a module to it, needs three things: a credential that is safe to keep in the CI system, an address that the `go` command accepts, and a way to hand the credential to `go` and `curl` without writing it into your repository. This page covers them, with a GitHub Actions and a GitLab CI example. The steps are shell commands, so they work the same in any other CI system.

### Use a Deploy Token

Give the job a [deploy token](../../getting-started/creating-a-deploy-token/) instead of a user account:

- A token belongs to one repository, so a leaked token exposes that repository only, not every repository of the instance.
- A **Read Only** token can install modules. Use it for jobs that only build and test. A job that publishes needs a **Read/Write** token, and it is better to have a token of its own for it.
- A token expires at most 365 days after you create it. Rotate or replace it before then, and update the secret of the CI system.
- A deploy token is cheap to check, and a job that downloads many modules sends its credential with every request. See [Authenticating from CI](../../administration/authenticating-from-ci/).

Store the token as a secret of your CI system, for example `REPSY_DEPLOY_TOKEN`, and never write it into a file that you commit. The username is not checked; use a fixed label such as `ci`.

### Reach the Instance over HTTPS

A private Go repository can only be used over HTTPS, because the `go` command does not send credentials over plain HTTP, see [HTTPS for Private Repositories](../using-go-modules-from-repsy/#https-for-private-repositories). The runner has to reach the address, and it has to trust the certificate. With a certificate of a public CA, there is nothing to set up. With a self-signed or company certificate, give the job the certificate as a file and set `SSL_CERT_FILE` to its path, for the `go` command, and pass it to `curl` with `--cacert`. A runner that is not on the network of your instance, such as a hosted runner of a CI service, cannot reach an instance that is only reachable from the inside.

### Install Modules in a Job

The `go` command reads its settings from the environment, and its credentials from a `.netrc` file. Write that file from the secret at the start of the job, keep it outside of your project, and point the environment variable `NETRC` at it. These variables are used below:

| Variable | Example | Meaning |
| --- | --- | --- |
| `REPSY_HOST` | `repo.example.com` | The host of the package protocols, with the port if it is not 443. It has to be spelled the same way in the `GOPROXY` address and in the `.netrc` entry, port included. |
| `REPSY_REPO` | `<repo-name>` | The name of the Go repository. |
| `REPSY_TOKEN` | *(secret)* | The deploy token. |

A GitHub Actions job:

```yaml
name: build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      REPSY_HOST: repo.example.com
      REPSY_REPO: <repo-name>
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
      - name: Configure access to Repsy
        env:
          REPSY_TOKEN: ${{ secrets.REPSY_DEPLOY_TOKEN }}
        run: |
          umask 077
          cat > "$RUNNER_TEMP/netrc" <<EOF
          machine ${REPSY_HOST}
          login ci
          password ${REPSY_TOKEN}
          EOF
          echo "NETRC=$RUNNER_TEMP/netrc" >> "$GITHUB_ENV"
          echo "GOPROXY=https://${REPSY_HOST}/${REPSY_REPO},off" >> "$GITHUB_ENV"
          echo "GONOSUMDB=example.com" >> "$GITHUB_ENV"
      - run: go build ./...
      - run: go test ./...
```

`GONOSUMDB` names the module paths of your modules, see [Skip the Checksum Database for Your Modules](../using-go-modules-from-repsy/#skip-the-checksum-database-for-your-modules). With `,off` the job only finds modules that are in the repository. For a project that also uses public modules, use a `GOPROXY` with a fallback, see [Using Your Modules Next to Public Ones](../using-go-modules-from-repsy/#using-your-modules-next-to-public-ones).

The same in GitLab CI. Add `REPSY_DEPLOY_TOKEN` under **Settings > CI/CD > Variables** and mask it:

```yaml
build:
  image: golang:1
  variables:
    REPSY_HOST: repo.example.com
    REPSY_REPO: <repo-name>
    GOPROXY: "https://$REPSY_HOST/$REPSY_REPO,off"
    GONOSUMDB: example.com
    NETRC: /tmp/netrc
  before_script:
    - umask 077
    - printf 'machine %s\nlogin ci\npassword %s\n' "$REPSY_HOST" "$REPSY_DEPLOY_TOKEN" > "$NETRC"
  script:
    - go build ./...
    - go test ./...
```

The `go` command prints a wrong or missing credential as `401 Unauthorized` and the address it asked. A job that keeps sending a revoked or rotated token counts as failed logins, and Repsy answers `429` after too many of them, see [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit).

### Publish a Version from a Job

A Go module is published by a tag, so run the job when a tag such as `v1.0.0` is pushed. The job builds the module zip and uploads it, see [Publishing a Go Module with curl](../publishing-a-go-module-with-curl/). This job builds the zip with `git archive`, which needs nothing but `git`, `tar` and `zip`, and takes the version from the name of the tag:

```yaml
name: publish
on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      REPSY_HOST: repo.example.com
      REPSY_REPO: <repo-name>
      MODULE_PATH: example.com/hello
      VERSION: ${{ github.ref_name }}
    steps:
      - uses: actions/checkout@v4
      - name: Build the module zip
        run: |
          STAGING=$(mktemp -d)
          mkdir -p "${STAGING}/${MODULE_PATH}@${VERSION}"
          git archive HEAD | tar -x -C "${STAGING}/${MODULE_PATH}@${VERSION}"
          (cd "${STAGING}" && zip -q -r -D "${RUNNER_TEMP}/module.zip" "${MODULE_PATH}@${VERSION}")
      - name: Upload the module to Repsy
        env:
          REPSY_TOKEN: ${{ secrets.REPSY_DEPLOY_TOKEN }}
        run: |
          printf 'user = "ci:%s"\n' "$REPSY_TOKEN" | curl -K - --fail-with-body -sS \
            -T "${RUNNER_TEMP}/module.zip" \
            -H "Content-Sha256: $(sha256sum "${RUNNER_TEMP}/module.zip" | cut -d' ' -f1)" \
            "https://${REPSY_HOST}/${REPSY_REPO}/${MODULE_PATH}/@v/${VERSION}.zip"
```

`curl -K -` reads the credential from its standard input, so the token appears neither in the command line nor in the job log. A successful upload prints nothing. When Repsy refuses it, `curl` prints the answer and the job fails, see [Troubleshooting](../publishing-a-go-module-with-curl/#troubleshooting) of the tutorial.

- **Run the tests first.** A version cannot be replaced, so a release that fails after the upload has to become a new version. Publish from a job that runs after the tests.
- **A re-run fails.** Running the publish job again for a tag that is already published is refused with `409` and `goModuleVersionAlreadyExists`. That is the intended behaviour: the version exists and is not changed. Fix your project and push a new tag.
- **Use the same tag and module path.** The version is the tag, and the `module` line of the `go.mod` has to be `MODULE_PATH`. Repsy refuses the upload otherwise.
- **Use the program of the tutorial** instead of `git archive` when the repository holds nested modules or vendored code, and give it a `GOPROXY` that can reach `golang.org/x/mod`, since `,off` cannot.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `401 Unauthorized` when the job installs modules | The secret is empty or wrong, or the token is expired, revoked or rotated. Check that `REPSY_HOST` in the `.netrc` entry has the same host and port as the `GOPROXY`. |
| `refusing to pass credentials to insecure URL` | The `GOPROXY` address is `http://`. Use `https://`. |
| `x509: certificate signed by unknown authority` | The runner does not trust the certificate of the instance, see [Reach the Instance over HTTPS](#reach-the-instance-over-https). |
| `verifying module: ...: 404 Not Found` from `sum.golang.org` | `GONOSUMDB` does not cover the module path. |
| `module lookup disabled by GOPROXY=off` | The repository does not have the module or version, or a public module is needed and the `GOPROXY` has no fallback. |
| `401` when the job uploads | The token is **Read Only**, or belongs to another repository. |
| `409`, `goModuleVersionAlreadyExists` when the job uploads | The tag was published before. |
| `429` | Wrong credentials were sent too often from the address of the runner, see [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit). |
