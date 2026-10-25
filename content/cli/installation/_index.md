+++
title = "Installation"
weight = 10
description = "How to install the rp command line client: install script, Homebrew, Scoop, APT and RPM packages, and the Docker image. None of these are published yet."
+++

{{% notice warning %}}
**Not yet available.** The `rp` binary is not published yet, so none of the installation methods below works today. This page lists what is planned and will get the real commands when each method is released.
{{% /notice %}}

The planned installation methods are:

| Method | Platform | Status |
| --- | --- | --- |
| Install script | Linux, macOS | Planned |
| Homebrew | macOS, Linux | Planned |
| Scoop | Windows | Planned |
| APT and RPM packages | Debian, Ubuntu, Fedora, RHEL and compatible | Planned |
| Docker image | Any host with Docker | Planned |

After installing, check the binary with:

```bash
rp version
```

`rp version --output json` prints the fields `version`, `commit`, `date` and `goVersion`.

## Shell completion

`rp completion` prints a completion script for bash, zsh, fish and PowerShell. See [rp completion](../reference/rp-completion/).
