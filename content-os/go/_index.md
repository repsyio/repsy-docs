+++
title = "Go"
chapter = true
weight = 800
description = "Guides for hosting Go module repositories: create one, publish and install modules, use it in CI and delete module versions."
+++

# Go

This documentation contains a user guide and samples regarding the use of private and public Go module repositories in Repsy Open Source. A Go repository implements the [Go module proxy protocol](https://go.dev/ref/mod#goproxy-protocol): the `go` command installs from it when `GOPROXY` points at it. It is a push registry, so you upload modules to it yourself, with a single `curl` request. There is no `go publish` command.

The address of a Go repository is the address of your instance's repository port followed by the name of the repository, `{{% repo-url %}}/<repo-name>`. There is no username in the address. You use it as the `GOPROXY`, and you upload to `{{% repo-url %}}/<repo-name>/<module-path>/@v/<version>.zip`.

Repsy does not fetch modules from other proxies, and it does not run a checksum database. A private Go repository needs HTTPS, because the `go` command refuses to send credentials over plain HTTP.

### Getting Started

- [Creating a Private Go Module Registry](creating-a-private-go-module-registry/): create a repository and get your credentials.
- [Publishing a Go Module](publishing-a-go-module/) and [Installing a Go Module from Registry](installing-a-go-module/): a short setup for publishing and installing.

### Tutorials

- [Publishing a Go Module with curl](publishing-a-go-module-with-curl/): build the module zip, upload it, the rules Repsy applies to an upload, versions that cannot be overwritten, and what each refusal looks like.
- [Using Go Modules from Repsy](using-go-modules-from-repsy/): `GOPROXY`, credentials, the checksum database, `GOPRIVATE`, mixing your modules with public ones, HTTPS for a local test, and troubleshooting.
- [Go in CI](go-in-ci/): install and publish from a pipeline with a deploy token.

### Managing Modules

- [Deleting Go Module Versions](deleting-go-module-versions/): what deleting a version or a module does in the web UI, and what `go` clients see afterwards.
