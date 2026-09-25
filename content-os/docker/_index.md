+++
title = "Docker"
chapter = true
weight = 200
description = "Guides for hosting Docker registries: create one, push and pull images, use CI and OCI tools, and manage tags and manifests."
+++

# Docker

This documentation contains a user guide and samples regarding the use of private and public Docker repositories in Repsy Open Source. A Docker repository is a registry for container images. It serves every client that speaks the Docker Registry HTTP API v2 and the OCI distribution API: the Docker CLI, and tools such as crane.

The reference of an image is the address of your instance's repository port, the name of the repository, the name of the image and a tag: `{{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>`. There is no username in it.

### Getting Started

- [Creating a Private Docker Registry](creating-a-private-docker-registry/): create a repository and get your credentials.
- [Publishing a Docker Image](publishing-a-docker-image/) and [Installing a Docker Image from Registry](installing-a-docker-image/): log in, push and pull in short.

### Tutorials

- [Pushing and Pulling Images with Docker](pushing-and-pulling-images-with-docker/): image names, private and public repositories, what a push stores, HTTPS, and troubleshooting.
- [Using crane and Other OCI Tools](using-crane-and-other-oci-tools/): the daemon-free crane client, digests, retagging and multi-platform images.
- [Docker in CI](docker-in-ci/): log in from a pipeline with a deploy token.

### Managing Images

- [Managing Docker Tags and Manifests](managing-docker-tags-and-manifests/): what a tag and a manifest are, what deleting each does, images without tags, and the clean-up actions.
