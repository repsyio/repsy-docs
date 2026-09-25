+++
title = "Publishing and Installing Charts the Classic Way"
weight = 960
description = "Publish a chart with the classic protocol using helm cm-push or curl, then search, pull and install it from the repository."
+++

This tutorial takes a small Helm chart from `helm create` to an install from your Repsy Open Source Helm repository with the classic (ChartMuseum-compatible) protocol: you upload the chart with the `helm cm-push` plugin or with `curl`, and you install it with `helm repo add`, `helm search repo`, `helm pull` and `helm install`. It complements [Publishing a Helm Chart](../publishing-a-helm-chart/) and [Installing a Helm Chart from Registry](../installing-a-helm-chart/), which show the same setup in short. To publish over OCI instead, see [Publishing and Pulling Charts over OCI](../publishing-and-pulling-charts-over-oci/).

### Prerequisites

- A Helm repository on your Repsy Open Source instance, see [Creating a Private Helm Registry](../creating-a-private-helm-registry/). The examples use the classic address `{{% repo-url path="helm" %}}/<repo-name>`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start.
- [Helm](https://helm.sh/docs/intro/install/) on your machine. Check it with `helm version`.
- A credential: your username and password, or a [deploy token](../creating-a-private-helm-registry/#get-your-credentials). A deploy token goes into the password field and needs the **Read/Write** access type to publish; the username can be any non-empty value.

{{% notice note %}}
Repsy takes the password over HTTP Basic authentication, so it is sent with every request. Serve a shared instance over HTTPS. On plain HTTP, the credentials cross the network unencrypted. Helm accepts a plain `http://` address for a classic repository without an extra flag.
{{% /notice %}}

{{< steps >}}
### Create and package a chart

Create a chart and package it:

```bash
helm create my-chart
helm package ./my-chart
```

`helm package` writes `my-chart-0.1.0.tgz` to the current directory. The `name` and the `version` in `my-chart/Chart.yaml` identify the chart in Repsy: the name has to be lower case letters, digits and `-`, and the version has to be a [semantic version](https://semver.org/) without a `v` in front, see [Managing Chart Versions](../managing-chart-versions/#what-repsy-checks-on-upload).

### Install the helm-push plugin

`helm cm-push` comes from the ChartMuseum `helm-push` plugin. Install it once:

```bash
helm plugin install https://github.com/chartmuseum/helm-push
```

Helm 4 refuses to install a plugin that has no signature, and this plugin publishes none. With Helm 4, add `--verify=false` to the command. Check the result with `helm plugin list`: it lists `cm-push`.

### Add the repository

Register your repository under a name of your choice, here `repsy-charts`:

```bash
helm repo add repsy-charts {{% repo-url path="helm" %}}/<repo-name> \
  --username <username> \
  --password <password-or-token>
```

The name is only a local alias, it does not have to match the name of the repository. Helm stores the credentials in its repositories file, and `helm cm-push` and `helm install` use them later. To keep the secret out of your shell history, use `--password-stdin` instead of `--password` and pipe the secret in.

Helm reads the index of the repository while it adds it, so a failed `helm repo add` already tells you that the address or the credentials are wrong, see [Troubleshooting](#troubleshooting).

### Push the chart

```bash
helm cm-push my-chart-0.1.0.tgz repsy-charts
```

The command ends with `Done.` when Repsy has accepted the chart. You can also give the chart directory instead of the archive, and `helm cm-push` packages it for you. Note that `helm cm-push` builds a fresh package from the chart before it uploads it, so the stored archive can differ byte for byte from the file `helm package` wrote, although it has the same content.

Instead of the repository name you can pass the address and the credentials:

```bash
helm cm-push my-chart-0.1.0.tgz {{% repo-url path="helm" %}}/<repo-name> \
  --username <username> \
  --password <password-or-token>
```

With a deploy token you can also use `--access-token <token>`, which sends the token as a Bearer credential.

### Or upload with curl

The upload is a multipart `POST` with the archive in a part named `chart`, so any HTTP client can do it:

```bash
curl -u <username>:<password-or-token> \
  -F "chart=@my-chart-0.1.0.tgz" \
  {{% repo-url path="helm" %}}/<repo-name>/api/charts
```

Repsy answers `201` with an empty body when it has accepted the chart. `helm cm-push` posts to `<repo-base-url>/api/<repo-name>/charts`, and Repsy accepts both addresses.

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. The list has one row per chart, with its latest version, its description and when it was updated. Open the chart to see its versions, and open a version to see its details.
3. The details show the digest and the size of the chart, the `Chart.yaml` metadata, and the ready-made `helm install` command for the classic protocol and `helm pull` command for OCI.

To check what Helm will see, request the index of the repository:

```bash
curl -u <username>:<password-or-token> {{% repo-url path="helm" %}}/<repo-name>/index.yaml
```

```yaml
apiVersion: v1
entries:
  my-chart:
  - name: my-chart
    version: 0.1.0
    description: A Helm chart for Kubernetes
    appVersion: 1.16.0
    type: application
    digest: sha256:5b968fb6e03f6769561f6c1bf54762217443e3069756b77842b07eda7b77224e
    urls:
    - charts/my-chart-0.1.0.tgz
    created: '2026-09-25T12:18:56.328987Z'
generated: '2026-09-25T12:18:56.375253852Z'
```

Every version of every chart of the repository is one entry, and the chart is downloaded from the relative URL in `urls`, here `{{% repo-url path="helm" %}}/<repo-name>/charts/my-chart-0.1.0.tgz`. This is the same for a chart that was published over OCI, see [Publishing and Pulling Charts over OCI](../publishing-and-pulling-charts-over-oci/#how-the-two-protocols-see-each-others-charts).

### Search, pull and install

Update your local copy of the index, then look for the chart:

```bash
helm repo update
helm search repo repsy-charts
```

`helm search repo` lists the newest version of each chart. Add `--versions` to list every version. Helm searches its local copy of the index, so run `helm repo update` again after somebody has published a new version, otherwise it is not found yet.

Download the chart, or install it into your cluster:

```bash
helm pull repsy-charts/my-chart --version 0.1.0
helm install my-release repsy-charts/my-chart --version 0.1.0
```

Without `--version`, Helm picks the newest version. `helm pull` writes `my-chart-0.1.0.tgz` to the current directory, and `--destination <directory>` puts it into a directory that already exists.

If you do not want to add the repository, pass its address and the credentials to the command instead:

```bash
helm pull my-chart --repo {{% repo-url path="helm" %}}/<repo-name> \
  --version 0.1.0 \
  --username <username> \
  --password <password-or-token>
```

A public repository needs no credentials to add, search, pull or install. A **Read Only** deploy token is enough for a private repository.
{{< /steps >}}

### Troubleshooting

`helm cm-push` prints `could not properly parse response JSON` in front of every refusal. That is Helm's wording, not an error of Repsy: what follows is the answer of Repsy, and `curl` shows the same body.

| What you see | Cause |
| --- | --- |
| `Error: 401: ...`, no body | The credentials are missing or wrong, or the deploy token is expired, revoked or belongs to another repository. |
| `Error: 401: ...` with `The user has logged in but has no permissions.` | The credentials are known, but the deploy token is **Read Only**. Publishing needs a **Read/Write** token. |
| `looks like "<address>" is not a valid chart repository or cannot be reached: failed to fetch <address>/index.yaml : 401` | `helm repo add` on a private repository without credentials, or with wrong ones. |
| `... failed to fetch <address>/index.yaml : 404` | The address is not a Helm repository of your instance: the repository name is wrong or the repository has another type. |
| `409`, `chartAlreadyExists`: `This chart version already exists in the repository.` | The version exists and **Package Override** is **Deny**. `helm cm-push --force` does not change that. Publish a new version, or ask an administrator to allow overriding, see [Managing Chart Versions](../managing-chart-versions/#uploading-a-version-again). |
| `400`, `chartNameInvalid`: `Invalid chart name.` | The `name` in `Chart.yaml` is not lower case letters, digits and `-`, or it starts with `-`. |
| `400`, `chartVersionInvalid`: `Invalid chart version.` | The `version` in `Chart.yaml` is not a semantic version, for example because of a leading `v`. |
| `400`, `chartYamlNotFound`: `Chart.yaml not found in the chart archive.` | The archive has no `Chart.yaml`, so it is not a chart package. |
| `400`, `Missing 'chart' part` | A `curl` upload with another form field than `chart`. |
| `413`: `The uploaded content is too large.` | The chart is larger than the upload limit of the instance, 500 MB by default. An administrator changes it with `MULTIPART_MAX_FILE_SIZE` and `MULTIPART_MAX_REQUEST_SIZE`, see the [Configuration Reference](../../installation/configuration-reference/). |
| `chart "my-chart" matching 0.2.0 not found in repsy-charts index. (try 'helm repo update')` | Your local copy of the index is older than the version. Run `helm repo update`. |

The next step is to [manage the versions of your charts](../managing-chart-versions/).
