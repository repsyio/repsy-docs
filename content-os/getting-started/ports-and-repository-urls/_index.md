+++
title = "Ports and Repository URLs"
weight = 114
description = "Learn which port serves the web UI and which serves package clients, and how repository URLs are formed for each package format."
+++

# Ports and Repository URLs

Repsy Open Source listens on two ports: one for people using the web UI, and one for package manager clients. This page
explains which is which, and how the address of a repository is formed.

## Ports

| Port | Serves | Setting |
| --- | --- | --- |
| `8080` | The web UI, and the API it uses | `API_PORT` |
| `9090` | All package protocols: Maven, npm, PyPI, Docker, Cargo, Go, Helm, NuGet and Ruby | `SERVER_PORT` |
| `8443` | The web UI over HTTPS, when `API_SSL_ENABLED=true` | `API_SSL_PORT` |
| `9443` | The package protocols over HTTPS, when `REPO_SSL_ENABLED=true` | `REPO_SSL_PORT` |

- Your browser talks to port `8080`. The web UI is served there, not on port `9090`.
- `docker`, `mvn`, `npm` and every other package manager talk to port `9090`.
- The two HTTPS ports are optional and off by default. Turning them on adds them next to the HTTP ports; it never
  switches the HTTP ports off.
- The Docker image declares all four ports. Publish the ones you use with `-p`, as in
  [Quick Start](../quick-start/).

## Repository URLs

The address of a repository is the address of the package protocol port followed by the name of the repository:

```text
<repo-base-url>/<repo-name>
```

There is no user name in the address. For a default local start, the `maven` repository is at
`http://localhost:9090/maven`.

`<repo-base-url>` is set with the `REPO_BASE_URL` environment variable of the container and defaults to
`http://localhost:9090`. Set it to the address your clients use to reach the package protocol port, for example
`https://repo.example.com`, when you start the container:

```bash
-e REPO_BASE_URL=https://repo.example.com
```

The [Configuration Reference](../../installation/configuration-reference/#network-and-addresses) lists the related settings.

Repsy uses it in two places:

- In the web UI: the client configuration behind the **Configure** button of a repository and the install
  commands on the package pages are built from it.
- In npm: when it is set, the registry writes this address into the download URL (`dist.tarball`) of every package
  version it serves. Without it, npm uses the address the request came in on.

`REPO_BASE_URL` does not change the ports Repsy listens on or the host names it answers to. It only tells the web UI and
npm what address to write down. If the snippets in the web UI show `localhost` while your clients reach Repsy under another
name, set it.

### URLs per package format

In the table, `<repo-base-url>` is the value described above, `<repo-name>` is the name of your repository, and
`<repo-host>` is the same address without `http://` or `https://`, for example `localhost:9090`.

| Package format | Address |
| --- | --- |
| Maven | `<repo-base-url>/<repo-name>` |
| npm | `<repo-base-url>/<repo-name>/` |
| PyPI, upload | `<repo-base-url>/<repo-name>` |
| PyPI, install | `<repo-base-url>/<repo-name>/simple`, as the index URL |
| Docker | `<repo-host>/<repo-name>/<image-name>:<image-tag>`, and `docker login <repo-host>` |
| Cargo | `sparse+<repo-base-url>/<repo-name>/` |
| Go | `<repo-base-url>/<repo-name>`, as the `GOPROXY` |
| Helm, classic repository | `<repo-base-url>/<repo-name>` |
| Helm, OCI registry | `oci://<repo-host>/<repo-name>` |
| NuGet | `<repo-base-url>/<repo-name>/v3/index.json` |
| Ruby | `<repo-base-url>/<repo-name>` |

These are the forms the web UI shows in the **Configure** dialog of each repository, which also has the complete client
configuration.

## Plain HTTP and HTTPS

The default setup uses plain HTTP, which is fine on your own machine. Package managers treat it differently once the
repository is on another host:

- The `go` command refuses to send credentials over plain HTTP, so a private Go repository needs an `https://` address.
- Docker accepts a plain-HTTP registry on `localhost` only; for another host it needs HTTPS, or the host has to be
  configured as an insecure registry in the Docker daemon.

For anything beyond a local trial, serve the repository port over HTTPS: either with the optional HTTPS port `9443`, see
[Enabling HTTPS](../../administration/enabling-https/), or with a reverse proxy in front of Repsy, see
[Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/).
