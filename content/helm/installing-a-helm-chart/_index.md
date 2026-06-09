+++
title = "Installing a Helm Chart from Registry"
weight = 83
+++

When you create a repository, it will be private by default. Before you install a chart from a private repository, you first need to authenticate. If your repository is public, you can skip the authentication steps, but you must still add or reference the repository.

Repsy supports two protocols for installing charts. Choose the one that matches how you published your chart.

## Classic Protocol

{{< steps >}}

### Add the repository

Register your Repsy Helm repository as a named source and update the local index:

```bash
helm repo add <repo-name> https://repo.repsy.io/helm/<username>/<repo-name> \
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
helm registry login repo.repsy.io \
  --username <username> \
  --password <password-or-token>
```

Authentication is only required for private repositories. Omit the credentials flags if your repository is public.

### Pull the chart

Download a specific chart version from your OCI repository:

```bash
helm pull oci://repo.repsy.io/helm/<username>/<repo-name>/<chart-name> \
  --version <version>
```

### Install the chart

Install directly from the OCI reference without pulling first:

```bash
helm install <release-name> \
  oci://repo.repsy.io/helm/<username>/<repo-name>/<chart-name> \
  --version <version>
```

That is all! If you have completed all required steps as described, Helm will download and install your chart from your Repsy registry successfully.

{{< /steps >}}
