+++
title = "Publishing a Helm Chart"
weight = 920
description = "Package a Helm chart and publish it to a repository with the helm cm-push plugin, or with helm push over OCI."
+++

{{< product "cloud" >}}You have registered and created a repository on [Repsy](https://repsy.io).{{< /product >}}{{< product "os" >}}You have created a repository on your Repsy Open Source instance.{{< /product >}} You are now ready to publish Helm charts to your registry.

Repsy supports two protocols for publishing charts. Use the **Classic** protocol if you work with the `helm cm-push` plugin, or the **OCI** protocol if you prefer the native `helm push` command available in Helm 3.8+.

{{< product "os" >}}
Both protocols serve the same repository and use the same address on your instance: `{{% repo-url path="helm" %}}/<repo-name>` for the classic protocol and `oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>` for OCI. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). Publishing always needs credentials, also to a public repository: use your username and password, or a [deploy token](../../getting-started/creating-a-deploy-token/) with the **Read/Write** access type in place of the password.

For complete walk-throughs, including the rules Repsy applies to an upload and what each refusal looks like, see [Publishing and Installing Charts the Classic Way](../publishing-and-installing-charts-the-classic-way/) and [Publishing and Pulling Charts over OCI](../publishing-and-pulling-charts-over-oci/).
{{< /product >}}

## Classic Protocol

{{< steps >}}

### Install the helm-push plugin

The classic protocol requires the `helm-push` plugin from ChartMuseum. Install it once with:

```bash
helm plugin install https://github.com/chartmuseum/helm-push
```

{{< product "os" >}}Helm 4 refuses to install a plugin that has no signature, and the plugin publishes none. With Helm 4, add `--verify=false` to the command above.{{< /product >}}

### Package your chart

Run `helm package` from the directory that contains your chart. Helm will produce a `.tgz` archive named after your chart and its version:

```bash
helm package ./my-chart
```

### Add your Repsy Helm repository

Register your Repsy repository as a named Helm repository so the plugin knows where to push:

```bash
helm repo add <repo-name> {{% repo-url path="helm" %}}/<repo-name> \
  --username <username> \
  --password <password-or-token>
```

{{< product "cloud" >}}Authentication is only required for private repositories. Omit `--username` and `--password` if your repository is public.{{< /product >}}{{< product "os" >}}The credentials are needed to push, also when the repository is public. `helm cm-push` uses the ones stored by `helm repo add`, and a deploy token goes where the password goes: the username can be any value.{{< /product >}}

### Push the chart

Use `helm cm-push` to upload the packaged archive to your registry:

```bash
helm cm-push my-chart-1.0.0.tgz <repo-name>
```

If the upload is successful, the chart will be available in your Repsy repository immediately.

{{< /steps >}}

## OCI Protocol

{{< steps >}}

### Log in to the Repsy OCI registry

Authenticate with the Repsy container registry endpoint using the `helm registry login` command:

```bash
helm registry login {{% repo-url scheme="false" account="false" %}} \
  --username <username> \
  --password <password-or-token>
```

{{< product "cloud" >}}Authentication is only required for private repositories. Omit the credentials flags if your repository is public.{{< /product >}}{{< product "os" >}}The credentials are needed to push, also when the repository is public. A deploy token goes where the password goes: the username can be any value. `helm registry login` takes the host only, without the repository name. If your instance serves plain HTTP, add `--plain-http` to `helm registry login` and to the other OCI commands below.{{< /product >}}

### Package your chart

Run `helm package` to create a `.tgz` archive from your chart directory:

```bash
helm package ./my-chart
```

### Push the chart

Push the packaged archive to your Repsy OCI repository:

```bash
helm push my-chart-1.0.0.tgz \
  oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>
```

Congratulations, you have published a Helm chart to your registry! You can now install it into any Kubernetes cluster.

{{< /steps >}}
