+++
title = "Installing a Docker Image from Registry"
weight = 230
+++

When you create a registry, it will be private by default. Before you install an image from a private registry, you first need to authenticate as seen in the previous page. If your registry is public, you can skip the authentication part.

You can now install any image from the registry. Please run:

```bash
docker pull {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

Or

```bash
docker pull {{% repo-url scheme="false" %}}/<repo-name>/<image-name>@<digest>
```

That’s all! If you have completed all required steps as described, docker CLI will install your image from your registry successfully.

{{< product "os" >}}
A public repository can be pulled without `docker login`.

[Pushing and Pulling Images with Docker](../pushing-and-pulling-images-with-docker/) shows how to pull by digest and how to pull a single platform of a multi-platform image. [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/) explains how to see which tags an image has.
{{< /product >}}
