+++
title = "Publishing a Helm Chart"
weight = 82
+++

You have registered and created a repository on [Repsy](https://repsy.io). You are now ready to publish Helm charts to your registry.

Repsy supports two protocols for publishing charts. Use the **Classic** protocol if you work with the `helm cm-push` plugin, or the **OCI** protocol if you prefer the native `helm push` command available in Helm 3.8+.

## Classic Protocol

{{< steps >}}

### Install the helm-push plugin

The classic protocol requires the `helm-push` plugin from ChartMuseum. Install it once with:

```bash
helm plugin install https://github.com/chartmuseum/helm-push
```

### Package your chart

Run `helm package` from the directory that contains your chart. Helm will produce a `.tgz` archive named after your chart and its version:

```bash
helm package ./my-chart
```

### Add your Repsy Helm repository

Register your Repsy repository as a named Helm repository so the plugin knows where to push:

```bash
helm repo add <repo-name> https://repo.repsy.io/helm/<username>/<repo-name> \
  --username <username> \
  --password <password-or-token>
```

Authentication is only required for private repositories. Omit `--username` and `--password` if your repository is public.

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
helm registry login repo.repsy.io \
  --username <username> \
  --password <password-or-token>
```

Authentication is only required for private repositories. Omit the credentials flags if your repository is public.

### Package your chart

Run `helm package` to create a `.tgz` archive from your chart directory:

```bash
helm package ./my-chart
```

### Push the chart

Push the packaged archive to your Repsy OCI repository:

```bash
helm push my-chart-1.0.0.tgz \
  oci://repo.repsy.io/helm/<username>/<repo-name>
```

Congratulations, you have published a Helm chart to your registry! You can now install it into any Kubernetes cluster.

{{< /steps >}}
