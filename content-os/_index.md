+++
title = "Repsy Open Source"
chapter = true
weight = 1
+++

# Repsy Open Source

Repsy Open Source is the open-source, self-hosted edition of Repsy, a universal package repository. It hosts Maven, npm,
PyPI, Docker, Cargo, Go, Helm, NuGet and Ruby packages from a single Docker image, with a web UI to manage them.
You run it on your own infrastructure, and the source code is available on [GitHub](https://github.com/repsyio/repsy).

New here? Read [What is Repsy Open Source?](getting-started/what-is-repsy/), then run it with the
[Quick Start](getting-started/quick-start/).

# Set Up and Run Your Instance

- [Getting Started](getting-started/): what Repsy Open Source is and how to try it.
  - [What is Repsy Open Source?](getting-started/what-is-repsy/): what it does and how it is put together.
  - [Quick Start](getting-started/quick-start/): run it with one Docker command and publish a first package.
  - [Ports and Repository URLs](getting-started/ports-and-repository-urls/): which port serves what, and the address of a
    repository.
  - [Navigating the Web UI](getting-started/navigating-the-web-ui/): the pages of the web UI and what each role can do.
  - [Creating Your First Repository](getting-started/creating-your-first-repository/)
  - [Understanding Public vs Private](getting-started/understanding-public-vs-private/)
  - [Creating a Deploy Token](getting-started/creating-a-deploy-token/)
  - [Managing Your Account](getting-started/managing-your-account/)
- [Installation](installation/): install with Docker, with Docker and PostgreSQL, with Docker Compose or from source, and
  look up every setting in the configuration reference.
- [Administration](administration/): serve Repsy over HTTPS or behind a reverse proxy, manage users and recover a lost
  password, back up your data, clean up storage and upgrade.
- [Repositories](repositories/): change the settings of a repository, browse its packages and delete them.

# Package Formats

- [Docker](docker/): registries for container images, for the Docker CLI and for OCI tools such as crane.
- [Maven](maven/): Maven and Gradle repositories, including Gradle plugins, upload rules and signed artifacts.
- [NuGet](nuget/): NuGet repositories for `dotnet nuget push` and `dotnet restore`, with unlisting and relisting of versions.
- [npm](npm/): npm registries for npm, Yarn, pnpm and Bun.
- [PyPI](pypi/): PyPI repositories for uploading with `twine` and installing with `pip`.
- [Cargo](cargo/): registries for Rust crates.
- [Go](go/): Go module repositories that `go` installs from through `GOPROXY`, with modules uploaded with `curl`.
- [Helm](helm/): chart repositories over the classic protocol and over OCI.
- [Ruby](ruby/): RubyGems repositories for `gem` and Bundler, including yanking of gems.
