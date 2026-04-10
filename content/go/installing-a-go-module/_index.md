+++
title = "Installing a Go Module from Registry"
weight = 63
+++

Repsy acts as a [Go Module Proxy](https://go.dev/ref/mod#module-proxy) and implements the standard GOPROXY protocol. To install modules from your Repsy registry, point the `GOPROXY` environment variable to your registry URL.

### Authentication

When you create a registry, it will be private by default. Go uses the `.netrc` file for authenticating to module proxies. Add an entry for `repo.repsy.io` to your `~/.netrc` file:

```text
machine repo.repsy.io
login <username>
password <password>
```

Make sure the file has restricted permissions:

```bash
chmod 600 ~/.netrc
```

Alternatively, you can embed credentials directly in the `GOPROXY` URL, though this is not recommended for production environments:

```bash
GOPROXY=https://<username>:<password>@repo.repsy.io/<username>/<registryName>
```

### Configuring GOPROXY

Set the `GOPROXY` environment variable to point to your Repsy registry:

```bash
export GOPROXY=https://repo.repsy.io/<username>/<registryName>,off
```

Use `,off` to fail loudly if the module is not found in your registry. Use `,direct` instead if you also want to fall back to fetching public modules directly from their source.

To make this permanent, add the export to your shell profile (e.g. `~/.bashrc` or `~/.zshrc`), or configure it per-project using a `.env` file or your CI/CD environment.

### Configuring GONOSUMDB for private modules

Since Repsy does not act as a checksum database, Go will attempt to verify private modules against the public `sum.golang.org`. For private module paths, disable sum database verification using `GONOSUMDB`:

```bash
export GONOSUMDB=<your-module-prefix>
```

Replace `<your-module-prefix>` with the domain or path prefix you used in `go mod init` (e.g. `corp.internal`, `github.com/yourorg`).

### Installing a module

Once `GOPROXY` and authentication are configured, use `go get` to install your module:

```bash
go get <your-module-path>@v1.0.0
```

To install the latest available version:

```bash
go get <your-module-path>@latest
```

That's all! If you have completed all required steps as described, the Go toolchain will download your module from your Repsy registry and add it to your project's `go.mod` and `go.sum` files.
