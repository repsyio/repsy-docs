+++
title = "Installation"
weight = 10
description = "How to install the rp command line client with the install script from cli.repsy.io, or from a .deb or .rpm package, and check the installed binary."
+++

`rp` is published on [cli.repsy.io](https://cli.repsy.io/), which lists the files of the latest release.

| Method | Platform | Status |
| --- | --- | --- |
| Install script | Linux, macOS | Available, see [Install script](#install-script) |
| PowerShell install script | Windows | Available, see [Windows](#windows) |
| `.deb` and `.rpm` packages | Debian, Ubuntu, Fedora, RHEL and compatible | Available as files, see [Debian and RPM packages](#debian-and-rpm-packages); there is no APT or RPM package repository |
| Homebrew | macOS, Linux | Not yet available |
| Scoop | Windows | Not yet available |
| Docker image | Any host with Docker | Not yet available |

## Install script

```bash
curl -fsSL https://cli.repsy.io/install.sh | sh
```

The script installs the latest release of `rp` and `docker-credential-repsy` into `~/.local/bin`, or into `/usr/local/bin` when it runs as root. It checks the SHA-256 of the archive against the published checksums, and verifies the signature of the checksums when [cosign](https://docs.sigstore.dev/) is installed. It does not change your `PATH`; it prints how to add the directory when it is not on it.

When `rp` is already installed, the script changes nothing and stops. To replace the existing `rp`, run it with `--force`:

```bash
curl -fsSL https://cli.repsy.io/install.sh | sh -s -- --force
```

Run it with `sh -s -- --help` for the other options: `--version` installs a given release, `--dir` another directory, and `--require-signature` fails when the signature cannot be verified.

## Windows

In PowerShell:

```powershell
irm https://cli.repsy.io/install.ps1 | iex
```

The script installs `rp.exe` and `docker-credential-repsy.exe` into `$env:LOCALAPPDATA\Programs\repsy-cli`, with the same checks as the install script. Set `RP_FORCE=1` to replace an existing `rp`, and `RP_ADD_TO_PATH=1` to add the directory to the `PATH` of the current user.

## Debian and RPM packages

[cli.repsy.io](https://cli.repsy.io/) lists a `.deb` and an `.rpm` package for Linux on `amd64` and `arm64`. Download the file for your system and install it with your package manager. These are single files, not a package repository, so the package manager does not update `rp`; install the new package to upgrade.

## Check the installation

```bash
rp version
```

`rp version --output json` prints the fields `version`, `commit`, `date` and `goVersion`.

## Shell completion

`rp completion` prints a completion script for bash, zsh, fish and PowerShell. See [rp completion](../reference/rp-completion/).
