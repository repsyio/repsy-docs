+++
title = "Publishing a Go Module"
weight = 820
description = "Create a Go module, package it as a zip archive, upload it to a registry over HTTP and verify the upload."
+++

{{< product "cloud" >}}You have registered and created a registry on [Repsy](https://repsy.io).{{< /product >}}{{< product "os" >}}You have created a registry on your Repsy Open Source instance.{{< /product >}} You are now ready to publish Go modules to your registry.

Repsy implements the [Go Module Proxy Protocol](https://go.dev/ref/mod#goproxy-protocol). Publishing a module means uploading a properly structured zip archive to your registry using HTTP.

{{< steps >}}

### Create a Go module

Start by creating a directory for your module. The directory name must match the directory component of your module path.

```bash
mkdir mymodule && cd mymodule
```

Initialize the module with `go mod init`. The module path must be a valid identifier — for private or internal modules, use a domain you control:

```bash
go mod init example.com/mymodule
```

Add your Go source files. For example, create a simple file:

```go
// mymodule.go
package mymodule

const Version = "v1.0.0"
```

Run `go mod tidy` to ensure your `go.mod` and `go.sum` files are up to date:

```bash
go mod tidy
```

If the module is in a Git repository, commit it and tag the release. The tag is the version:

```bash
git init && git add . && git commit -m "First release"
git tag v1.0.0
```

### Package and upload the module

Repsy expects modules to be uploaded as zip archives following the Go module proxy format. The zip must contain all module files under the full module path, for example:

```
example.com/mymodule@v1.0.0/go.mod
example.com/mymodule@v1.0.0/mymodule.go
```

To achieve this, a temporary staging directory is used and the zip command runs from within it — this prevents any absolute path prefixes from being included in the archive. `git archive` puts only the files of the tag into the staging directory, so a `.git` directory and files that are not committed stay out of the archive. `rm -f module.zip` removes the archive of an earlier run, because `zip` adds to an existing archive instead of replacing it.

Run these commands from inside your module directory. Replace `example.com/mymodule` with your actual module path and `<username>`, `<repo-name>` with your Repsy credentials.

```bash
VERSION=v1.0.0
MODULE_PATH=example.com/mymodule
STAGING=$(mktemp -d)
MODULE_VERSION_DIR="${STAGING}/${MODULE_PATH}@${VERSION}"

mkdir -p "${MODULE_VERSION_DIR}"
git archive "${VERSION}" | tar -x -C "${MODULE_VERSION_DIR}"
rm -f module.zip
(cd "${STAGING}" && zip -q -r -D "${OLDPWD}/module.zip" "${MODULE_PATH}@${VERSION}")

curl -u <username>:<password> \
  -T module.zip \
  -H "Content-Sha256: $(sha256sum module.zip | cut -d' ' -f1)" \
  "{{% repo-url %}}/<repo-name>/${MODULE_PATH}/@v/${VERSION}.zip"
```

{{< product "cloud" >}}Authentication is only required for private registries. Omit the `-u` flag if your registry is public.{{< /product >}}{{< product "os" >}}Uploading always needs credentials, also to a public repository, so keep the `-u` flag. Use your username and password, or a [deploy token](../../getting-started/creating-a-deploy-token/) with the **Read/Write** access type in place of the password: the username can be any value. `https://<your-repsy-host>` stands for the address of the package protocol port of your Repsy Open Source instance, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).{{< /product >}}

The `Content-Sha256` header is optional — remove the `-H` line if you prefer to skip integrity verification.

If the upload is successful, you will receive an HTTP 200 response.

### Verify the upload

Confirm the module is available by querying the version list:

```bash
curl -u <username>:<password> \
  "{{% repo-url %}}/<repo-name>/${MODULE_PATH}/@v/list"
```

Congratulations, you have published a Go module to your registry! You can now install it into any Go project.

{{< /steps >}}

{{< product "os" >}}
Repsy never overwrites a version of a Go module: uploading a version that already exists is refused with `409`, whatever the settings of the repository, so publish a new version instead. [Publishing a Go Module with curl](../publishing-a-go-module-with-curl/) shows a second way to build the zip, with the package `golang.org/x/mod/zip` that the `go` command uses, and lists what Repsy checks on an upload and what each refusal looks like.

The **Configure** button of a Go repository in the web UI shows the same commands with the address and the name of your repository filled in.
{{< /product >}}
