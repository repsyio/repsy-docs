+++
title = "Publishing a Go Module"
weight = 62
+++

You have registered and created a registry on [Repsy](https://repsy.io). You are now ready to publish Go modules to your registry.

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

### Package and upload the module

Repsy expects modules to be uploaded as zip archives following the Go module proxy format. The zip must contain all module files under the full module path, for example:

```
example.com/mymodule@v1.0.0/go.mod
example.com/mymodule@v1.0.0/mymodule.go
```

To achieve this, a temporary staging directory is used and the zip command runs from within it — this prevents any absolute path prefixes from being included in the archive.

Run these commands from inside your module directory. Replace `example.com/mymodule` with your actual module path and `<username>`, `<registryName>` with your Repsy credentials.

```bash
VERSION=v1.0.0
MODULE_PATH=example.com/mymodule
STAGING=$(mktemp -d)
MODULE_VERSION_DIR="${STAGING}/${MODULE_PATH}@${VERSION}"

mkdir -p "${MODULE_VERSION_DIR}"
cp -r . "${MODULE_VERSION_DIR}/"
(cd "${STAGING}" && find "${MODULE_PATH}@${VERSION}" -type f | xargs zip "${OLDPWD}/module.zip")

curl -u <username>:<password> \
  -T module.zip \
  -H "Content-Sha256: $(sha256sum module.zip | cut -d' ' -f1)" \
  "https://repo.repsy.io/<username>/<registryName>/${MODULE_PATH}/@v/${VERSION}.zip"
```

Authentication is only required for private registries. Omit the `-u` flag if your registry is public.

The `Content-Sha256` header is optional — remove the `-H` line if you prefer to skip integrity verification.

If the upload is successful, you will receive an HTTP 200 response.

### Verify the upload

Confirm the module is available by querying the version list:

```bash
curl -u <username>:<password> \
  "https://repo.repsy.io/<username>/<registryName>/${MODULE_PATH}/@v/list"
```

Congratulations, you have published a Go module to your registry! You can now install it into any Go project.

{{< /steps >}}
