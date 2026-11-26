+++
title = "Installation"
weight = 10
description = "Install the rp command line client with the install script, a .deb or .rpm package, or a manual download, and verify what you downloaded."
+++

# Installation

`rp` is one file with no dependencies, for Linux, macOS and Windows on x86_64 and ARM64. Install it with the script for your system:

{{< tabs groupId="install" >}}
{{% tab name="Linux and macOS" %}}
```bash
curl -fsSL https://cli.repsy.io/install.sh | sh
```
{{% /tab %}}
{{% tab name="Windows (PowerShell)" %}}
```powershell
irm https://cli.repsy.io/install.ps1 | iex
```
{{% /tab %}}
{{< /tabs >}}

Then check it:

```bash
rp version
```

`rp version --output json` prints `version`, `commit`, `date` and `goVersion`.

## Supported Servers

`rp` works with Repsy Cloud and with Repsy Open Source **26.11.0 or newer**. Before its first panel API request to a Repsy Open Source host, `rp` asks the server for its version (`GET /api/info`, no credential sent) and refuses an older server, or one that does not answer that route, with exit code 2 (see [Exit Codes](../exit-codes/)). The answer is kept in the profile for a day, so a supported server is asked at most once a day. A development or snapshot build cannot be compared; `rp` warns once and goes on.

## What the Installer Does

1. Downloads the archive for your platform and the list of checksums from `cli.repsy.io`.
2. Checks the archive's SHA-256 against the list. With [cosign](https://docs.sigstore.dev/cosign/) installed, it also verifies the list's signature; without it, it says so and goes on.
3. Installs `rp` and `docker-credential-repsy` (the Docker credential helper). It does not change your `PATH`; it tells you what to add if the directory is not on it.

| Option | Effect |
| --- | --- |
| `--version <x.y.z>` (or `RP_VERSION`) | Installs that version instead of the latest. |
| `--force` | Replaces an existing `rp`. Without it the installer stops and says where the current one is. Use it to update. |
| `--require-signature` | Fails when the signature cannot be checked, instead of warning. |

Pass options to the script after `sh -s --`, for example `curl -fsSL https://cli.repsy.io/install.sh | sh -s -- --force`.

You can read the scripts before running them: [install.sh](https://cli.repsy.io/install.sh), [install.ps1](https://cli.repsy.io/install.ps1).

## Update

Run the installer again with `--force`:

```bash
curl -fsSL https://cli.repsy.io/install.sh | sh -s -- --force
```

## Packages and Manual Download

[cli.repsy.io](https://cli.repsy.io) lists every file of the latest release: `.tar.gz` archives for Linux and macOS, `.zip` for Windows, and `.deb` and `.rpm` packages for Linux. Use them on a machine without internet access, or to install with your package manager:

```bash
sudo dpkg -i repsy-cli_<version>_linux_amd64.deb   # Debian, Ubuntu
sudo rpm -i repsy-cli_<version>_linux_amd64.rpm    # Fedora, RHEL and compatible
```

## Verify a Download

The installers verify for you. By hand, put the archive, `repsy-cli_<version>_checksums.txt` and its signature `repsy-cli_<version>_checksums.txt.sigstore.json` in one directory, then:

```bash
sha256sum --check --ignore-missing repsy-cli_<version>_checksums.txt
cosign verify-blob \
  --bundle repsy-cli_<version>_checksums.txt.sigstore.json \
  --certificate-identity https://github.com/repsyio/repsy-cli/.github/workflows/release.yml@refs/tags/v<version> \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  repsy-cli_<version>_checksums.txt
```

On Windows, compare `(Get-FileHash .\repsy-cli_<version>_windows_amd64.zip -Algorithm SHA256).Hash` with the line for that file in the checksum list.

## Shell Completion

`rp completion` prints a completion script for bash, zsh, fish and PowerShell. See [rp completion](../reference/rp-completion/).
