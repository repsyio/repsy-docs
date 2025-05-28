+++
title = "Installing a Docker Image from Registry"
weight = 53
+++

When you create a registry, it will be private by default. Before you install an image from a private registry, you first need to authenticate as seen in the previous page. If your registry is public, you can skip the authentication part.

You can now install any image from the registry. Please run:

```bash
docker pull repo.repsy.io/<username>/<registryName>/<imageName>:<imageTag>
```

Or

```bash
docker pull repo.repsy.io/<username>/<registryName>/<imageName>@<digest>
```

That’s all! If you have completed all required steps as described, docker CLI will install your image from your registry successfully.

