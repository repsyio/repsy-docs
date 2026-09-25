+++
title = "Docker in CI"
weight = 290
description = "Build and push images from CI with a deploy token, let the job trust the address of the instance and choose tags."
+++

A CI job that builds an image and pushes it to your Repsy Open Source instance needs three things: a credential that is safe to keep in the CI system, a way for the job to trust the address of the instance, and tags that do not fight the settings of the repository. This page covers them, with a GitHub Actions example that works the same in any CI system that runs shell commands.

### Use a Deploy Token

Give the job a [deploy token](../../getting-started/creating-a-deploy-token/) instead of a user account:

- A token belongs to one repository, so a leaked token exposes that repository only, not every repository of the instance.
- A **Read/Write** token can push and pull. A **Read Only** token can pull; use it for jobs that only run or deploy images.
- A token expires at most 365 days after you create it. Rotate or replace it before then, and update the secret of the CI system.
- Repsy checks a deploy token with one fast hash. Every check of a user password is slow on purpose, and Repsy only softens that by remembering a correct password for five minutes by default (see the [Configuration Reference](../../installation/configuration-reference/#authentication)). A job that logs in and pulls many layers is cheaper with a token.
- A deploy token cannot delete manifests or tags through the registry API, so a job cannot remove what it pushed.

Store the token as a secret of your CI system, for example `REPSY_DEPLOY_TOKEN`, and never write it into a file that you commit. The username is not checked; use a fixed label such as `ci`.

### Log In and Push

Pass the secret on standard input, so that it appears neither in the command line nor in the job log:

```bash
echo "$REPSY_DEPLOY_TOKEN" | docker login {{% repo-url scheme="false" account="false" %}} -u ci --password-stdin
```

A complete GitHub Actions job that builds an image and pushes it with a tag that names the commit:

```yaml
name: publish-image
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      IMAGE: {{% repo-url scheme="false" %}}/<repo-name>/<image-name>
    steps:
      - uses: actions/checkout@v4
      - name: Log in to Repsy
        run: echo "${{ secrets.REPSY_DEPLOY_TOKEN }}" | docker login {{% repo-url scheme="false" account="false" %}} -u ci --password-stdin
      - name: Build
        run: docker build -t "$IMAGE:$GITHUB_SHA" .
      - name: Push
        run: docker push "$IMAGE:$GITHUB_SHA"
```

The runner reaches the instance over the network, so the address has to be one that the runner can reach and that Docker accepts: an HTTPS address with a certificate that the runner trusts. See [HTTP and HTTPS](../pushing-and-pulling-images-with-docker/#http-and-https). A runner on the same machine as Repsy can use `localhost:9090`.

If the job has no Docker daemon, use crane with an image in the OCI layout format that an earlier step produced, see [Using crane and Other OCI Tools](../using-crane-and-other-oci-tools/):

```bash
echo "$REPSY_DEPLOY_TOKEN" | crane auth login {{% repo-url scheme="false" account="false" %}} -u ci --password-stdin
crane push ./image-oci "$IMAGE:$GITHUB_SHA"
crane digest "$IMAGE:$GITHUB_SHA"
```

`crane digest` prints the digest of what you pushed. Use it to deploy exactly that image, by `<image-name>@<digest>`.

### Choose Tags

- **A tag that names the build** (a commit hash, a build number or a version) never has to move, so it works with every setting. Deploy by digest, or by that tag.
- **A tag that moves**, such as `latest` or `main`, is overridden with every build. This needs the repository setting **Package Override** to be **Allow**, which is the default. With **Deny**, Repsy refuses to move an existing tag with `403`, and the job fails.
- Every time a tag moves to a new image, the previous manifest stays stored and can be pulled by its digest, and its layers stay on disk. A repository that CI pushes to all day grows accordingly. An administrator can free the space in the web UI, see [Managing Docker Tags and Manifests](../managing-docker-tags-and-manifests/#clean-up-actions). Do it when no job is pushing.

Layers that the repository already has are not uploaded again: the client asks first, and uploads only the missing ones, so a build that changes only the top layer uploads only that layer. This is per repository; Repsy does not share layers between repositories.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `unauthorized` at login | The secret is empty or wrong, or the token is expired, revoked or rotated. |
| `unauthorized` at push | The token is **Read Only**, or belongs to another repository. |
| `denied` at push | **Package Override** is **Deny** and the tag already points at another image. |
| `toomanyrequests` | Wrong credentials were sent too often from the address of the runner. By default Repsy refuses further password checks after 20 failures in 60 seconds. Fix the secret. A valid deploy token keeps working while the address is blocked. |
| A certificate or `HTTP response to HTTPS client` error | The address is not served over HTTPS with a certificate that the runner trusts, see [Pushing and Pulling Images with Docker](../pushing-and-pulling-images-with-docker/#troubleshooting). |
