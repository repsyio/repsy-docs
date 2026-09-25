+++
title = "Installing a Go Module from Registry"
weight = 830
+++

Repsy acts as a [Go Module Proxy](https://go.dev/ref/mod#module-proxy) and implements the standard GOPROXY protocol. To install modules from your Repsy registry, point the `GOPROXY` environment variable to your registry URL.

{{< steps >}}

### Authentication

When you create a registry, it will be private by default. Go uses the `.netrc` file for authenticating to module proxies. Add an entry for `{{% repo-url scheme="false" account="false" %}}` to your `~/.netrc` file:

```text
machine {{% repo-url scheme="false" account="false" %}}
login <username>
password <password>
```

Make sure the file has restricted permissions:

```bash
chmod 600 ~/.netrc
```

Alternatively, you can embed credentials directly in the `GOPROXY` URL, though this is not recommended for production environments:

```bash
GOPROXY=https://<username>:<password>@{{% repo-url scheme="false" %}}/<repo-name>
```

 **Note:** Authentication is only required for private registries. If your registry is public, you can skip `.netrc` configuration and omit credentials from the `GOPROXY` URL.

### Configure GOPROXY

Set the `GOPROXY` environment variable to point to your Repsy registry:

```bash
export GOPROXY={{% repo-url %}}/<repo-name>,off
```

Use `,off` to fail loudly if the module is not found in your registry. Use `,direct` instead if you also want to fall back to fetching public modules directly from their source.

To make this permanent, add the export to your shell profile (e.g. `~/.bashrc` or `~/.zshrc`), or configure it per-project using a `.env` file or your CI/CD environment.

### Configure GONOSUMDB

Since Repsy does not act as a checksum database, Go will attempt to verify private modules against the public `sum.golang.org`. For private module paths, disable sum database verification using `GONOSUMDB`:

```bash
export GONOSUMDB=<your-module-prefix>
```

Replace `<your-module-prefix>` with the domain or path prefix you used in `go mod init` (e.g. `example.com`, `github.com/yourorg`).

### Install a module

Once `GOPROXY` and authentication are configured, use `go get` to install your module:

```bash
go get <your-module-path>@v1.0.0
```

To install the latest available version:

```bash
go get <your-module-path>@latest
```

That's all! If you have completed all required steps as described, the Go toolchain will download your module from your Repsy registry and add it to your project's `go.mod` and `go.sum` files.

{{< /steps >}}

{{< product "os" >}}
A few things are specific to Repsy Open Source:

- **A private repository needs HTTPS.** The `go` command refuses to send credentials to an `http://` address: it stops with `refusing to pass credentials to insecure URL` when they are part of the `GOPROXY` address, and it does not send the entry of `~/.netrc`, so Repsy answers `401`. Serve your instance over HTTPS, see [Enabling HTTPS](../../administration/enabling-https/) and [Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/). A public repository can be read over plain HTTP.
- **Write the port into the `machine` line** when the address of your instance has one, for example `machine repo.example.com:9443`. The `go` command matches the entry against the host and the port of the `GOPROXY` address.
- **A deploy token** goes where the password goes, in the `.netrc` file as well as in the `GOPROXY` address, and the username can be any value. A **Read Only** token is enough to install. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).
- `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).

[Using Go Modules from Repsy](../using-go-modules-from-repsy/) covers `GOPRIVATE`, mixing modules of your repository with public ones, and troubleshooting.
{{< /product >}}
