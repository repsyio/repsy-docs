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

In PowerShell, `rp` is a built-in alias of `Remove-ItemProperty`; see [Windows PowerShell: the `rp` Alias](#windows-powershell-the-rp-alias) before you run it there.

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

Run `rp update`. It downloads the latest release from `cli.repsy.io`, checks it the same way as the installer (the
SHA-256 always, the signature when cosign is installed) and replaces `rp` and `docker-credential-repsy` where they are
installed. Nothing is changed when a check fails.

```bash
rp update --check            # only show the installed and the latest version
rp update                    # install the latest version
rp update --version 0.3.1    # install a given version, also an older one
```

| Option | Effect |
| --- | --- |
| `--check` | Shows the installed and the latest version and the command that updates this installation. Changes nothing. |
| `--version <x.y.z>` | Installs that version instead of the latest. |
| `--require-signature` | Fails when the signature cannot be checked, instead of warning. |

If Homebrew, Scoop, a `.deb` or `.rpm` package, the Docker image or `go install` installed `rp`, `rp update` changes
nothing and prints the command to use instead, such as `brew upgrade repsy-cli`, `scoop update repsy-cli` or your
system package manager.

`rp` versions before `rp update` existed update by running the installer again with `--force`:

```bash
curl -fsSL https://cli.repsy.io/install.sh | sh -s -- --force
```

### Update Notice

When a newer version exists, `rp` prints one line after a command, at most once a day. It checks for new versions in
the background, at most once a day, and never slows a command down. The line appears only in a terminal: never in CI,
never when the output goes to a pipe or a file, and never with `--no-input`, `--output json`, `--output yaml` or `--jq`.

Turn it off with either of these:

```bash
export REPSY_NO_UPDATE_NOTICE=1
rp config set update_notice false
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

## Windows PowerShell: the `rp` Alias

PowerShell has a built-in alias `rp` for `Remove-ItemProperty`, and an alias wins over a program on the `PATH`. So in PowerShell `rp version` runs `Remove-ItemProperty`, not Repsy's `rp`. Remove the alias in your PowerShell profile:

```powershell
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
Add-Content -Path $PROFILE -Value 'Remove-Item Alias:rp -Force -ErrorAction SilentlyContinue'
```

Open a new PowerShell window afterwards. Until then, call the program as `rp.exe`. The Command Prompt (`cmd.exe`) has no such alias.

## Shell Completion

`rp completion <shell>` prints a completion script for bash, zsh, fish or PowerShell (see [rp completion](../reference/rp-completion/)). Save it where your shell looks for completions, then open a new shell and press Tab after `rp `.

{{< tabs groupId="shell" >}}
{{% tab name="bash" %}}
Needs the `bash-completion` package (`apt install bash-completion`, `dnf install bash-completion`, or `brew install bash-completion@2` on macOS, set up as Homebrew describes). It loads the file from your user directory by itself:

```bash
mkdir -p ~/.local/share/bash-completion/completions
rp completion bash > ~/.local/share/bash-completion/completions/rp
```
{{% /tab %}}
{{% tab name="zsh" %}}
Save the script as `_rp` in a directory of your own:

```bash
mkdir -p ~/.zsh/completions
rp completion zsh > ~/.zsh/completions/_rp
```

Then add the directory to `fpath` and load the completion system in `~/.zshrc`:

```bash
fpath=(~/.zsh/completions $fpath)
autoload -U compinit
compinit
```

If your `~/.zshrc` already runs `compinit` (Oh My Zsh and other frameworks do), only add the `fpath` line, and put it before that call. If completion does not show up in a new shell, remove the cache with `rm -f ~/.zcompdump*` and open a new shell again.
{{% /tab %}}
{{% tab name="fish" %}}
fish loads the file from its completions directory by itself:

```bash
mkdir -p ~/.config/fish/completions
rp completion fish > ~/.config/fish/completions/rp.fish
```
{{% /tab %}}
{{% tab name="PowerShell" %}}
Load the script from your PowerShell profile, after removing the built-in `rp` alias (see [above](#windows-powershell-the-rp-alias)):

```powershell
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
Add-Content -Path $PROFILE -Value @'
Remove-Item Alias:rp -Force -ErrorAction SilentlyContinue
rp completion powershell | Out-String | Invoke-Expression
'@
```

If your profile already removes the alias, leave out the `Remove-Item` line.
{{% /tab %}}
{{< /tabs >}}

To try completion in the current session only, without saving anything, run `source <(rp completion bash)` in bash or `rp completion fish | source` in fish.

### Packages

The `.deb` and `.rpm` packages of the releases after 0.3.0 install the bash, zsh and fish completion files system-wide, so with them there is nothing to do: open a new shell. For bash, the `bash-completion` package must be installed. The packages of 0.3.0 and earlier, the archives and the install scripts do not install completion; use the steps above.
