+++
title = "Using Helm in CI"
weight = 990
+++

A pipeline that publishes a chart to your Repsy Open Source Helm repository, or installs one from it, needs a credential and the address of the repository. This page shows how to keep both out of your scripts: use a deploy token, store it as a secret of your CI system, and let the job read it from an environment variable. The commands are the ones from [Publishing and Pulling Charts over OCI](../publishing-and-pulling-charts-over-oci/) and [Publishing and Installing Charts the Classic Way](../publishing-and-installing-charts-the-classic-way/).

### Use a Deploy Token

Do not put the password of a user account into a pipeline. Create a [deploy token](../creating-a-private-helm-registry/#get-your-credentials) of the repository instead:

- A job that publishes charts needs a token with the **Read/Write** access type.
- A job that only installs or pulls charts needs a token with the **Read Only** access type.

Copy the token when Repsy shows it, because it is shown only once, and store it as a secret of your CI system. Repsy checks only the token, so the username can be any non-empty value. The job reads four values, which the examples below call `REPSY_HOST`, `REPSY_REPOSITORY`, `REPSY_USERNAME` and `REPSY_TOKEN`:

| Variable | Value |
| --- | --- |
| `REPSY_HOST` | The host of the package protocol port of your instance, with the port if it has one, for example `repsy.example.com` or `localhost:9090`. No `http://`, no `https://`. |
| `REPSY_REPOSITORY` | The name of the Helm repository. |
| `REPSY_USERNAME` | Any non-empty value with a deploy token. |
| `REPSY_TOKEN` | The deploy token. Store it as a secret. |

The token travels over HTTP Basic authentication with every request, so serve the instance over HTTPS. If it serves plain HTTP, add `--plain-http` to the Helm OCI commands below.

### Publish a Chart over OCI

```bash
set -eu

helm package ./my-chart --destination dist
printf '%s' "$REPSY_TOKEN" | helm registry login "$REPSY_HOST" \
  --username "$REPSY_USERNAME" --password-stdin
helm push dist/my-chart-*.tgz "oci://$REPSY_HOST/$REPSY_REPOSITORY"
helm registry logout "$REPSY_HOST"
```

`--password-stdin` keeps the token out of the command line, where other processes on the runner could read it. The logout at the end removes the stored login, which matters on a runner that later jobs share.

### Publish a Chart the Classic Way

`helm cm-push` reads its credentials from environment variables, so the token does not appear on the command line either:

```bash
set -eu

helm plugin install https://github.com/chartmuseum/helm-push
helm package ./my-chart --destination dist
export HELM_REPO_USERNAME="$REPSY_USERNAME"
export HELM_REPO_PASSWORD="$REPSY_TOKEN"
helm cm-push dist/my-chart-*.tgz "https://$REPSY_HOST/$REPSY_REPOSITORY"
```

With Helm 4, add `--verify=false` to the plugin installation, or install the plugin into your CI image once. `helm cm-push` also reads `HELM_REPO_ACCESS_TOKEN`, which sends the deploy token as a Bearer credential.

### Install or Deploy a Chart

A job that deploys a chart logs in or adds the repository with a **Read Only** token, and pins the version:

```bash
set -eu

printf '%s' "$REPSY_TOKEN" | helm registry login "$REPSY_HOST" \
  --username "$REPSY_USERNAME" --password-stdin
helm upgrade --install my-release "oci://$REPSY_HOST/$REPSY_REPOSITORY/my-chart" \
  --version "$CHART_VERSION"
```

For the classic protocol, add the repository with the secret read from the standard input, and install from it:

```bash
printf '%s' "$REPSY_TOKEN" | helm repo add repsy "https://$REPSY_HOST/$REPSY_REPOSITORY" \
  --username "$REPSY_USERNAME" --password-stdin
helm repo update
helm upgrade --install my-release repsy/my-chart --version "$CHART_VERSION"
```

### A GitHub Actions Example

The steps are the same in every CI system. In GitHub Actions the secret becomes an environment variable of the step:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Publish the chart
        env:
          REPSY_HOST: repsy.example.com
          REPSY_REPOSITORY: helm
          REPSY_USERNAME: ci
          REPSY_TOKEN: ${{ secrets.REPSY_TOKEN }}
        run: |
          helm package ./my-chart --destination dist
          printf '%s' "$REPSY_TOKEN" | helm registry login "$REPSY_HOST" \
            --username "$REPSY_USERNAME" --password-stdin
          helm push dist/my-chart-*.tgz "oci://$REPSY_HOST/$REPSY_REPOSITORY"
```

The runner needs Helm. Install it in an earlier step, or use an image that has it.

### Version Your Charts in the Pipeline

A publish job that runs again for a version that already exists fails with `409`, `chartAlreadyExists`, when the repository has **Package Override** on **Deny**, and it replaces the chart when it is on **Allow**, see [Managing Chart Versions](../managing-chart-versions/#uploading-a-version-again). Give every build its own version in `Chart.yaml`, or pass it to `helm package` with `--version <version>`, and pin that version in the jobs that install it.
