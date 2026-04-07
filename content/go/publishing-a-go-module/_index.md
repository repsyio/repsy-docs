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
go mod init corp.internal/mymodule
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

### Package the module into a zip archive

Repsy expects modules to be uploaded as zip archives following the Go module proxy format. The zip must contain all module files under the path `<modulePath>@<version>/`.

Choose a version tag following semantic versioning (e.g. `v1.0.0`):

```bash
VERSION=v1.0.0
MODULE_PATH=corp.internal/mymodule
MODULE_VERSION_DIR="${MODULE_PATH}@${VERSION}"

mkdir -p "${MODULE_VERSION_DIR}"
cp -r . "${MODULE_VERSION_DIR}/"
find "${MODULE_VERSION_DIR}" -type f | xargs zip module.zip
```

### Upload the module to Repsy

Compute the SHA-256 hash of the zip file and upload it with a `PUT` request. Repsy uses HTTP Basic Auth for authentication.

```bash
SHA256=$(sha256sum module.zip | cut -d' ' -f1)

curl -u <username>:<password> \
  -T module.zip \
  -H "Content-Sha256: ${SHA256}" \
  "https://repo.repsy.io/<username>/<registryName>/${MODULE_PATH}/@v/${VERSION}"
```

Replace `<username>`, `<registryName>`, and the module path with your actual values.

If the upload is successful, you will receive an HTTP 200 response. You can now verify the module is available by querying the version list:

```bash
curl -u <username>:<password> \
  "https://repo.repsy.io/<username>/<registryName>/${MODULE_PATH}/@v/list"
```

Congratulations, you have published a Go module to your registry! You can now install it into any Go project.

{{< /steps >}}
