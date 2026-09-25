+++
title = "Installing a Helm Chart from Registry"
weight = 930
+++

When you create a repository, it will be private by default. Before you install a chart from a private repository, you first need to authenticate. If your repository is public, you can skip the authentication steps, but you must still add or reference the repository.

Repsy supports two protocols for installing charts. Choose the one that matches how you published your chart.

{{< product "os" >}}
Both protocols serve the same repository. A chart published over OCI can be installed with either protocol. A chart published the classic way, with `helm cm-push`, can only be installed the classic way: it has no OCI manifest, so `helm pull oci://` does not find it. Repository addresses have no username: `{{% repo-url path="helm" %}}/<repo-name>` for the classic protocol and `oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>` for OCI, where `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). A [deploy token](../../getting-started/creating-a-deploy-token/) goes where the password goes, and a **Read Only** token is enough to install.

For complete walk-throughs, see [Publishing and Installing Charts the Classic Way](../publishing-and-installing-charts-the-classic-way/) and [Publishing and Pulling Charts over OCI](../publishing-and-pulling-charts-over-oci/).
{{< /product >}}

## Classic Protocol

{{< steps >}}

### Add the repository

Register your Repsy Helm repository as a named source and update the local index:

```bash
helm repo add <repo-name> {{% repo-url path="helm" %}}/<repo-name> \
  --username <username> \
  --password <password-or-token>
helm repo update
```

Authentication is only required for private repositories. Omit `--username` and `--password` if your repository is public.

### Search available charts

List all charts available in your repository:

```bash
helm search repo <repo-name>
```

### Install the chart

Install a specific chart version into your cluster:

```bash
helm install <release-name> <repo-name>/<chart-name> --version <version>
```

That is all! If you have completed all required steps as described, Helm will download and install your chart from your Repsy registry successfully.

{{< /steps >}}

## OCI Protocol

{{< steps >}}

### Log in to the Repsy OCI registry

Authenticate with the Repsy container registry endpoint:

```bash
helm registry login {{% repo-url scheme="false" account="false" %}} \
  --username <username> \
  --password <password-or-token>
```

Authentication is only required for private repositories. Omit the credentials flags if your repository is public.{{< product "os" >}} `helm registry login` takes the host only, without the repository name. If your instance serves plain HTTP, add `--plain-http` to `helm registry login` and to the other OCI commands below.{{< /product >}}

### Pull the chart

Download a specific chart version from your OCI repository:

```bash
helm pull oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>/<chart-name> \
  --version <version>
```

### Install the chart

Install directly from the OCI reference without pulling first:

```bash
helm install <release-name> \
  oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>/<chart-name> \
  --version <version>
```

That is all! If you have completed all required steps as described, Helm will download and install your chart from your Repsy registry successfully.

{{< /steps >}}
