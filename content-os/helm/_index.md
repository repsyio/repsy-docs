+++
title = "Helm"
chapter = true
weight = 900
description = "Guides for hosting Helm chart repositories: create one, publish and install charts with the classic or OCI protocol, manage versions and use CI."
+++

# Helm

This documentation contains a user guide and samples regarding the use of private and public Helm chart repositories in Repsy Open Source. A Helm repository serves two protocols on the same address: the classic ChartMuseum-compatible protocol (`helm repo add`, `helm cm-push`) and the OCI registry protocol (`helm push`, `helm pull oci://`).

The address of a Helm repository is the address of your instance's repository port followed by the name of the repository. There is no username in the address. The classic address is `{{% repo-url path="helm" %}}/<repo-name>`, and the OCI address is `oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>`.

### Getting Started

- [Creating a Private Helm Registry](creating-a-private-helm-registry/): create a repository and get your credentials.
- [Publishing a Helm Chart](publishing-a-helm-chart/) and [Installing a Helm Chart from Registry](installing-a-helm-chart/): a short setup for both protocols.

### Tutorials

- [Publishing and Installing Charts the Classic Way](publishing-and-installing-charts-the-classic-way/): package a chart, upload it with `helm cm-push` or `curl`, then `helm repo add`, `helm search repo`, `helm pull` and `helm install`.
- [Publishing and Pulling Charts over OCI](publishing-and-pulling-charts-over-oci/): `helm registry login`, `helm push`, `helm pull oci://` and `helm install oci://`, and how the two protocols see each other's charts.
- [Managing Chart Versions](managing-chart-versions/): the rules Repsy applies to an upload, the Package Override setting, and deleting a version or a chart and what your clients see afterwards.
- [Using Helm in CI](using-helm-in-ci/): deploy tokens and secrets in a pipeline that publishes or installs charts.
