+++
title = "Pushing and Pulling Images with Docker"
weight = 260
description = "Log in, tag, push and pull a container image with the Docker CLI, and check the result in the web UI."
+++

This tutorial takes a container image from your machine into a Docker repository of your Repsy Open Source instance and back. It complements [Publishing a Docker Image](../publishing-a-docker-image/) and [Installing a Docker Image from Registry](../installing-a-docker-image/), which show the same commands in short.

### Prerequisites

- A Docker repository on your Repsy Open Source instance, see [Creating a Private Docker Registry](../creating-a-private-docker-registry/).
- The Docker CLI, and an image to push. The examples use `hello-world`.
- A credential: your username and password, or a [deploy token](../creating-a-private-docker-registry/#get-your-credentials). A deploy token goes into the password prompt and needs the **Read/Write** access type to push; the username can be any value.
- A way for Docker to reach the instance, see [HTTP and HTTPS](#http-and-https). On the machine that runs Repsy, `localhost:9090` works without further setup.

### How Images Are Named

An image reference in Repsy has this form:

```
{{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

| Part | Meaning |
| --- | --- |
| `<your-repsy-host>` | The host and port of the repository port of your instance, without `http://` or `https://`, for example `localhost:9090` or `repo.example.com`. There is no username segment. |
| `<repo-name>` | The name of the Docker repository. |
| `<image-name>` | The name of the image. Repsy accepts one path segment of letters, digits, `_` and `-`, up to 255 characters. A name with a `/` in it, such as `team/app`, or with a `.` does not match, so put the grouping into the repository names instead. |
| `<image-tag>` | The tag. It starts with a letter, a digit or `_`, then letters, digits, `_`, `.` and `-`, up to 128 characters. |

An image is created by the first push to its name; you do not create it beforehand. Docker only accepts lower-case references, so use lower-case names.

{{< steps >}}
### Log in

```bash
docker login {{% repo-url scheme="false" account="false" %}}
```

Docker asks for a username and a password. Enter your account, or any username and a deploy token as the password. `docker login` contacts the registry, so a wrong password is refused right here. In a script, do not put the password on the command line; pass it on standard input instead:

```bash
echo "$REPSY_DEPLOY_TOKEN" | docker login {{% repo-url scheme="false" account="false" %}} -u <username> --password-stdin
```

Docker keeps the credentials in `~/.docker/config.json` until you run `docker logout`.

### Tag the image

Give a local image the name it will have in Repsy:

```bash
docker pull hello-world
docker tag hello-world {{% repo-url scheme="false" %}}/<repo-name>/hello-world:1.0
```

### Push the image

```bash
docker push {{% repo-url scheme="false" %}}/<repo-name>/hello-world:1.0
```

Docker uploads the layers that the repository does not have yet and then the manifest. See [What a Push Stores](#what-a-push-stores).

### Pull the image

On another machine, log in with a credential that may read the repository (a private repository needs one, a public repository does not) and pull by tag or by digest:

```bash
docker pull {{% repo-url scheme="false" %}}/<repo-name>/hello-world:1.0
docker pull {{% repo-url scheme="false" %}}/<repo-name>/hello-world@<digest>
```

A digest reference (`sha256:...`) always names exactly the same image, also after the tag moves. `docker push` prints the digest of what it pushed. If the image is a multi-platform image, pull one platform with the `--platform` option of `docker pull`:

```bash
docker pull --platform <platform> {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

`docker buildx imagetools inspect {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>` lists the platforms of a tag and the digest of each.

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your Docker repository.
2. The list has one row per image, with the digest of its most recently moved tag, the last update and the size. Open the image to see its tags with their platform.
3. Open a tag to see its manifests, and the tag detail to see the manifest and the config of the image and the `docker pull` command.

There is no `docker search` and no tag listing over the registry API on Repsy; the web UI is where you see the tags. See [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/).
{{< /steps >}}

### Private and Public Repositories

| Caller | Public repository | Private repository |
| --- | --- | --- |
| Not logged in | Pull | Nothing: the request is refused with `401` |
| Logged in with a user account | Pull and push | Pull and push |
| Logged in with a Read/Write deploy token of the repository | Pull and push | Pull and push |
| Logged in with a Read Only deploy token of the repository | Pull | Pull |
| Logged in with a deploy token of another repository | Pull | Refused with `401` |

Pushing always needs credentials, also for a public repository. Deleting a manifest or a tag through the registry API needs the `ADMIN` role, and a deploy token is never allowed to do it. See [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/#deleting-through-the-registry-api). A deploy token is checked when Docker logs in and again for every request; a token of another repository or a Read Only token is therefore accepted by `docker login` and refused at the first `docker push` or `docker pull` it cannot do. See [Understanding Public vs Private](../../getting-started/understanding-public-vs-private/).

### What a Push Stores

A push is a sequence of requests, and it helps to know what Repsy does with them:

- **Layers are stored per repository and by digest.** Before it uploads a layer, the client asks Repsy whether it has it, and uploads only the layers that are missing. Uploading a layer that the repository already has is accepted and stores nothing twice. Repsy checks the digest of every layer against the bytes it received and refuses a layer that does not match with `400` (`DIGEST_INVALID`). Repsy does not implement cross-repository blob mounts, so the same layer pushed to two repositories is uploaded to both.
- **The manifest comes last.** The manifest names the layers and the config of the image. Repsy refuses a manifest that names a layer it does not have with `404` (`MANIFEST_BLOB_UNKNOWN`), and an image config without an `os` or an `architecture` with `400` (`MANIFEST_INVALID`). It accepts Docker image manifests, Docker manifest lists, OCI image manifests and OCI image indexes.
- **A refused or failed push leaves no image behind, but it can leave layers.** If the manifest is refused, the layers that were already uploaded stay in the repository without any manifest that uses them. They are the *orphan layers* that [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/#clean-up-actions) explains how to delete. An upload that was started and never finished is deleted by Repsy after 24 hours by default (`ABANDONED_UPLOAD_TTL`, see the [Configuration Reference](../../installation/configuration-reference/#background-jobs)).
- **A tag moves when you push it again.** A repository has the setting **Package Override**, **Allow** by default. With **Allow**, pushing an existing tag with a different image moves the tag to the new image, and the old image stays pullable by its digest. With **Deny**, Repsy refuses that push with `403` (`DENIED`, message `You cannot override a version.`) and the tag is unchanged. Pushing the image a tag already points at changes nothing and is accepted in both cases, and so is pushing a new tag.
- **Digests.** Every image is stored under its `sha256` digest, and Repsy also records its `sha512` digest, so a client can reference it by either.

### HTTP and HTTPS

Docker talks to a registry over HTTPS. The one exception is a registry on `localhost` (and the other loopback addresses), where Docker accepts plain HTTP without configuration. Repsy listens on plain HTTP on port `9090` by default, so:

- **On the machine that runs Repsy**, `localhost:9090` works as it is. This is what [Quick Start](../../getting-started/quick-start/) uses.
- **From any other machine, use HTTPS.** Either turn on the HTTPS port of the repository port of Repsy (`REPO_SSL_ENABLED`, port `9443`, see [Configuration Reference](../../installation/configuration-reference/#https)), or put a reverse proxy with a certificate in front of it and set `REPO_BASE_URL` to its address. Docker must trust the certificate: a certificate from a public authority works, and for one from your own authority you place its CA certificate in `/etc/docker/certs.d/<your-repsy-host>/ca.crt` on the Docker host (see the [Docker documentation on certificates](https://docs.docker.com/engine/security/certificates/)). The name of the directory has to include the port, for example `/etc/docker/certs.d/repo.example.com:9443/ca.crt`: a directory named `repo.example.com` is not used for `repo.example.com:9443`. Docker reads the file with the next command, so the daemon needs no restart.
- **Behind a reverse proxy**, the proxy has to forward the `Host`, `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-Port` headers. Repsy builds the address of its token endpoint, which `docker login` is sent to, from the request it received. Without these headers the address names the internal scheme and port, and `docker login` fails.

{{% notice warning %}}
To try Repsy on a remote host without HTTPS, you can list the address in the `insecure-registries` setting of the Docker daemon (in `/etc/docker/daemon.json`, then restart Docker; in Docker Desktop under **Settings**, **Docker Engine**): `{"insecure-registries": ["<your-repsy-host>"]}`. Docker then sends your credentials and your layers unencrypted. Use this for an evaluation only, and never over an untrusted network. See the [Docker documentation on insecure registries](https://docs.docker.com/reference/cli/dockerd/#insecure-registries).
{{% /notice %}}

The ports of a default installation are described in [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `Get "https://<your-repsy-host>/v2/": http: server gave HTTP response to HTTPS client` | Docker tried HTTPS, and the address answers with plain HTTP. Serve the repository port over HTTPS, or, for a trial only, list the address in `insecure-registries`. |
| `Get "https://<your-repsy-host>/v2/": tls: failed to verify certificate: x509: certificate signed by unknown authority` (or a similar certificate error) | The Docker host does not trust the certificate of the HTTPS address. Install the CA certificate as shown in [HTTP and HTTPS](#http-and-https). |
| `Get "http://<your-repsy-host>/v2/": unauthorized:` at `docker login`, with nothing after the colon | The username and password are wrong, or the deploy token is expired, revoked or rotated. |
| `unauthorized: The user has logged in but has no permissions.` at `docker push` or `docker pull`, after a successful login | The credential may not do that: a Read Only deploy token cannot push, and a deploy token of another repository cannot do anything with this one. |
| `Head "http://<your-repsy-host>/v2/<repo-name>/<image-name>/manifests/<image-tag>": unauthorized:` at `docker pull`, or `unauthorized:` at `docker push` | Nobody is logged in. Nobody can pull from a private repository without logging in, and anonymous callers cannot push, not even to a public repository. |
| `denied: You cannot override a version.` at `docker push` of an existing tag | **Package Override** of the repository is **Deny** and the tag points at another image. Push a new tag, or ask an administrator to allow overriding. |
| `toomanyrequests: Too many failed authentication attempts. Please try again later.` | Too many wrong passwords from one address: Repsy refuses further password checks for a while, by default after 20 failures within 60 seconds (`429`). Fix the credential in the job and wait. Valid deploy tokens keep working. |
| `name invalid: The image name must be at most 255 characters and match [A-Za-z0-9_-]+.` or `name unknown: unknownPath` | The image name has a character outside letters, digits, `_` and `-` (a `.`, for example), or a `/`. A tag that is not valid is refused with `400`. |

Repsy also sends the identifier of the error in the JSON body that the registry API defines (`errors`, with a `code`, a `message` and a `detail`). Docker prints the message.
