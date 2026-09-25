+++
title = "Publishing and Pulling Charts over OCI"
weight = 970
+++

This tutorial publishes a Helm chart to your Repsy Open Source Helm repository with the OCI protocol (`helm push`) and pulls and installs it again (`helm pull oci://`, `helm install oci://`). It also explains how charts published over OCI and charts published the classic way see each other. It complements [Publishing a Helm Chart](../publishing-a-helm-chart/) and [Installing a Helm Chart from Registry](../installing-a-helm-chart/), which show the same setup in short. For the classic protocol, see [Publishing and Installing Charts the Classic Way](../publishing-and-installing-charts-the-classic-way/).

### Prerequisites

- A Helm repository on your Repsy Open Source instance, see [Creating a Private Helm Registry](../creating-a-private-helm-registry/). The OCI address of the repository is `oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start. The OCI address has no `http://` or `https://`: for that example it is `oci://localhost:9090/<repo-name>`.
- Helm 3.8 or later, where OCI support is generally available. Check it with `helm version`.
- A credential: your username and password, or a [deploy token](../creating-a-private-helm-registry/#get-your-credentials). A deploy token goes into the password field and needs the **Read/Write** access type to publish; the username can be any non-empty value.

{{% notice note %}}
Repsy takes the password over HTTP Basic authentication, so it is sent with every request. Serve a shared instance over HTTPS. On plain HTTP, the credentials cross the network unencrypted, and Helm refuses to talk to a plain HTTP registry unless you add `--plain-http` to `helm registry login`, `helm push`, `helm pull`, `helm install` and `helm show`. Some Helm versions skip the flag for `localhost`. For an HTTPS instance with a certificate that Helm does not trust, `--ca-file <file>` adds your certificate authority. To turn the certificate check off, which is for a trial only, `helm registry login` takes `--insecure` and the other commands take `--insecure-skip-tls-verify`.
{{% /notice %}}

{{< steps >}}
### Create and package a chart

```bash
helm create my-chart
helm package ./my-chart
```

`helm package` writes `my-chart-0.1.0.tgz` to the current directory. The `name` and the `version` in `my-chart/Chart.yaml` identify the chart in Repsy: the name has to be lower case letters, digits and `-`, and the version has to be a [semantic version](https://semver.org/) without a `v` in front, see [Managing Chart Versions](../managing-chart-versions/#what-repsy-checks-on-upload).

### Log in to the registry

```bash
helm registry login {{% repo-url scheme="false" account="false" %}} \
  --username <username> \
  --password-stdin
```

`--password-stdin` makes Helm read the password from the standard input, so it does not show up in your shell history or in the list of processes: pipe it in from a file or a secret. `helm registry login` takes the host of your instance, with the port if it has one, and no repository name. Repsy checks the credentials when you log in, so a wrong password fails here with `401 Unauthorized`. A **Read Only** deploy token logs in successfully and is refused later, when you push.

Helm keeps the login in its registry configuration file, and `helm push`, `helm pull` and `helm install` use it for this host until you run `helm registry logout <host>`.

### Push the chart

```bash
helm push my-chart-0.1.0.tgz oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>
```

```text
Pushed: <your-repsy-host>/<repo-name>/my-chart:0.1.0
Digest: sha256:b9dcc0249ae5b00b8b02ead42d58dfc7f7f809dd97702ae952c57d336a13bb19
```

Give `helm push` the address of the repository, without the name of the chart. Helm adds the chart name and the version from `Chart.yaml` itself: the chart is stored as `my-chart` under the tag `0.1.0`. If you add the chart name to the address, the request goes to `<repo-name>/my-chart/my-chart` and Repsy answers `404` with `unknownPath`.

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. The list has one row per chart, with its latest version, its description and when it was updated. Open the chart to see its versions, and open a version to see its details.
3. The details show the digest and the size of the chart, the `Chart.yaml` metadata, and the ready-made `helm install` command for the classic protocol and `helm pull` command for OCI.

To check what an OCI client will see, request the tags of the chart:

```bash
curl -u <username>:<password-or-token> {{% repo-url %}}/v2/<repo-name>/my-chart/tags/list
```

```json
{"name":"my-chart","tags":["0.1.0"]}
```

The address of the OCI API starts with `/v2/` directly after the host, and the repository name follows it.

### Pull and install

Download the chart, or install it into your cluster:

```bash
helm pull oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>/my-chart --version 0.1.0
helm install my-release oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>/my-chart --version 0.1.0
```

This time the address contains the chart name after the repository name. `helm pull` writes `my-chart-0.1.0.tgz` to the current directory, and `--destination <directory>` puts it into a directory that already exists. Without `--version`, and with a version range such as `--version ">=0.1.0"`, Helm asks Repsy for the tags of the chart and takes the newest matching version.

To look into a chart without downloading it, use `helm show chart`, `helm show values` or `helm template` with the same address.

A public repository needs no `helm registry login` to pull or install. A **Read Only** deploy token is enough for a private repository.
{{< /steps >}}

### How the Two Protocols See Each Other's Charts

A Helm repository of Repsy has one list of charts, and both protocols read and write it. The rules differ by the protocol that published the chart:

| Published with | Installable over OCI (`helm pull oci://`) | Installable the classic way (`helm repo add`, `helm pull <repo>/<chart>`) |
| --- | --- | --- |
| `helm push` (OCI) | Yes | Yes. The chart is listed in `index.yaml`, and the download address in it works. |
| `helm cm-push` or `curl` (classic) | No. There is no OCI manifest for the chart, so `helm pull oci://` answers `not found`. | Yes |

So a chart that is published over OCI can be used by classic clients too, but not the other way round. If some of your consumers can only use one protocol, publish over OCI.

Both protocols share the name and the version of a chart. The web UI lists the charts of both protocols together, and the versions of one chart published through both protocols appear in one list. With **Package Override** on **Deny**, a version that exists is refused when you publish it again over either protocol, see [Managing Chart Versions](../managing-chart-versions/#uploading-a-version-again). To keep one source of truth for a chart, publish it through one protocol only. When you override a version over OCI, Repsy updates the digest that `index.yaml` lists for it, so classic clients get the new chart too.

Deleting a version in the web UI removes it for both protocols, see [Managing Chart Versions](../managing-chart-versions/#deleting-versions-and-charts).

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `http: server gave HTTP response to HTTPS client` | The instance serves plain HTTP. Add `--plain-http`, or serve the instance over HTTPS. |
| `authenticating to "<host>": ... response status code 401: Unauthorized` | `helm registry login` with a wrong password, an expired or revoked deploy token, or a token of another repository. |
| `basic credential not found` | You have not logged in to this host, and the repository is private. Run `helm registry login`. |
| `response status code 401: unauthorized: The user has logged in but has no permissions.` | The credentials are known, but they cannot publish: the deploy token is **Read Only**, or it belongs to another repository. |
| `response status code 409: denied: This chart version already exists in the repository.: chartAlreadyExists` | The version exists and **Package Override** is **Deny**. Publish a new version, or ask an administrator to allow overriding. |
| `response status code 404: name unknown: unknownPath` on `helm push` | The address of `helm push` contains the chart name. Use `oci://<host>/<repo-name>`. Or the repository name is wrong, or the repository has another type. |
| `not found` on `helm pull` | The chart or the version does not exist in that repository, or it was published the classic way and has no OCI manifest. |
| `invalid reference: invalid repository "<repo-name>/<Chart>"` | Helm refuses a chart name with upper case letters before it sends anything. Repsy needs a lower case name in `Chart.yaml` too. |
| `400`, `chartNameInvalid`, `chartVersionInvalid` or `chartYamlNotFound` | The chart does not pass the checks in [What Repsy Checks on Upload](../managing-chart-versions/#what-repsy-checks-on-upload). |

The next step is to [manage the versions of your charts](../managing-chart-versions/).
