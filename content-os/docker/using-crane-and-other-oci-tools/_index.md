+++
title = "Using crane and Other OCI Tools"
weight = 270
description = "Use crane, which needs no Docker daemon, to push and pull images, work with digests, add tags and build multi-platform images."
+++

[crane](https://github.com/google/go-containerregistry/tree/main/cmd/crane) is a command-line tool for container registries, part of the go-containerregistry project. It needs no Docker daemon, which makes it a good fit for scripts and CI jobs, and for looking at digests and manifests. This page shows the crane commands that work against a Docker repository of Repsy Open Source. They are the commands that the automated tests of Repsy run against every change, with crane v0.22.1.

### Prerequisites

- A Docker repository on your Repsy Open Source instance, see [Creating a Private Docker Registry](../creating-a-private-docker-registry/).
- crane installed, see its project page.
- A credential: your username and password, or a [deploy token](../creating-a-private-docker-registry/#get-your-credentials). A deploy token needs the **Read/Write** access type to push; the username can be any value.

`<your-repsy-host>` stands for the host and port of the repository address of your instance without `http://` or `https://`, for example `localhost:9090`. Image references are formed as described in [Pushing and Pulling Images with Docker](../pushing-and-pulling-images-with-docker/#how-images-are-named): `{{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>`.

### Log In

```bash
echo "$REPSY_DEPLOY_TOKEN" | crane auth login {{% repo-url scheme="false" account="false" %}} -u <username> --password-stdin
```

`crane auth login` only writes the credential into `~/.docker/config.json` (or into the directory named by `DOCKER_CONFIG`), in the same format as `docker login`. It does not contact Repsy, so a wrong password is not noticed here: the first `crane push` or `crane pull` that needs it fails. crane reads this file for every command.

### HTTP and HTTPS

crane tries HTTPS first. For `localhost` and other loopback and private-network addresses it falls back to plain HTTP by itself, so `localhost:9090` works without an option. For any other host that serves plain HTTP, add `--insecure` to the command; do this for an evaluation only, and prefer HTTPS as described in [Pushing and Pulling Images with Docker](../pushing-and-pulling-images-with-docker/#http-and-https).

### Push and Pull an Image

`crane push` takes a local image in the OCI layout format, a directory, and pushes it. `crane pull --format=oci` writes a directory in that format, so you can copy an image from any registry into Repsy in two steps:

```bash
crane pull --format=oci <source-image> ./image
crane push ./image {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

Pull an image from Repsy the same way, by tag or by digest:

```bash
crane pull --format=oci {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag> ./image
crane pull --format=oci {{% repo-url scheme="false" %}}/<repo-name>/<image-name>@<digest> ./image
```

`index.json` in the directory names the manifest that was pulled, and `blobs/` holds the manifest, the config and the layers, each in a file named after its digest. What Repsy does with the layers and the manifest of a push is described in [What a Push Stores](../pushing-and-pulling-images-with-docker/#what-a-push-stores). Pushing an image with the OCI media types works the same as pushing one with the Docker media types; Repsy serves each back with the media type it was pushed with.

### Digests and Manifests

```bash
crane digest {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
crane manifest {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

`crane digest` prints the `sha256` digest of what a tag points at, and `crane manifest` prints the manifest itself. Both also work with a digest reference (`<image-name>@<digest>`), for example to check that an image can still be pulled after its tag moved. Repsy stores every manifest under its `sha256` digest and also records the `sha512` digest, see [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/#manifests-are-content-addressed).

### Add a Tag to an Image

```bash
crane tag {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag> <new-tag>
```

The new tag points at the same manifest. Both tags then resolve to the same digest, and no image data is stored twice.

### Build a Multi-Platform Image

To publish one tag for several platforms, push each platform image under its own tag, then combine them into an index:

```bash
crane index append \
  -m {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<amd64-tag> \
  -m {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<arm64-tag> \
  -t {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

The images that the index lists have to be in the same image of the same repository, because Repsy refuses an index that names a manifest the image does not have. crane pushes each of them by its digest first. The index is an OCI image index by default; add `--docker-empty-base` to create a Docker manifest list instead. Repsy serves either with the media type it was pushed with.

Pull one platform of the index, or read the index itself:

```bash
crane pull --platform=linux/arm64 --format=oci {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag> ./image
crane manifest {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

`crane manifest` lists the platforms of the index with the digest of each. The web UI shows a multi-platform tag with the platform `Multiplatform`, and its manifests page lists the images that the index names.

### What Does Not Work

- `crane ls` and `crane catalog` list the tags of an image and the images of a registry. Repsy does not implement the registry API calls they need. See the web UI for the tags of an image, as described in [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/#seeing-the-tags-of-an-image).
- Repsy has no referrers API.

### Other OCI Tools

Repsy implements the Docker Registry HTTP API v2 with the OCI media types. A client authenticates with the usual token exchange: it sends its username and password (or deploy token) to the token endpoint that the `WWW-Authenticate` challenge of `/v2/` names, and then uses the bearer token it gets. The automated tests of Repsy use crane. Other tools, such as skopeo and podman, are not part of them, so this documentation makes no statement about them. A tool that works with registries that use this token exchange should work with Repsy under the rules described on these pages: image names of one path segment, no tag listing and no referrers.
