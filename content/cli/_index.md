+++
title = "CLI"
chapter = true
weight = 1200
description = "Use rp, the Repsy command line client: install it, sign in, set up package managers, push and download packages, and run it in CI."
+++

# CLI

`rp` is the command line client for Repsy. One binary works with Repsy Cloud and with a self-hosted Repsy Open Source.

## Quick Start

```bash
curl -fsSL https://cli.repsy.io/install.sh | sh   # Windows: irm https://cli.repsy.io/install.ps1 | iex
rp profile add repsy.io                           # or the address of your self-hosted server
rp auth login                                     # sign in with your browser
rp repo list                                      # your repositories
rp npm setup --repo <repo-name>                   # point npm at a repository
```

The first profile you add becomes the default, so the commands after it need no `--hostname`. See [Profiles and Hosts](profiles-and-hosts/).

## What You Can Do

| Task | Commands |
| --- | --- |
| Sign in, check who you are | [`rp auth login`](reference/rp-auth-login/), [`rp auth status`](reference/rp-auth-status/) |
| Configure a package manager for a repository | `rp <format> setup`: [`maven`](reference/rp-maven-setup/), [`npm`](reference/rp-npm-setup/), [`pypi`](reference/rp-pypi-setup/), [`docker`](reference/rp-docker-setup/), [`cargo`](reference/rp-cargo-setup/), [`nuget`](reference/rp-nuget-setup/), [`go`](reference/rp-go-setup/), [`helm`](reference/rp-helm-setup/), [`ruby`](reference/rp-ruby-setup/) |
| Upload and download packages | [`rp push`](reference/rp-push/), [`rp download`](reference/rp-download/) |
| Manage repositories | [`rp repo`](reference/rp-repo/) `list`, `get`, `create`, `delete` |
| Browse packages | [`rp package`](reference/rp-package/) `list`, `show`, `tags`, `delete` |
| Vulnerability scans | [`rp scan`](reference/rp-scan/) `trigger`, `list`, `show` |
| Personal access tokens and deploy tokens | [`rp token`](reference/rp-token/) `create`, `list`, `rotate`, `revoke` |
| Call any panel API route | [`rp api`](reference/rp-api/) |
| Let an AI agent use Repsy | [`rp mcp`](mcp/) |

Every command takes `--output json` (or `yaml`) and `--jq <expression>` for scripts, and `--help` for its options.

## In This Section

- [Installation](installation/): install scripts, packages and manual downloads.
- [Authentication](authentication/): signing in, `REPSY_TOKEN` for CI, personal access tokens.
- [Profiles and Hosts](profiles-and-hosts/): Repsy Cloud, a self-hosted server, custom domains.
- [Configuration](configuration/): where `rp` keeps its files.
- [Environment Variables](environment-variables/): the variables `rp` reads.
- [Exit Codes](exit-codes/): what a failure returns, for scripts.
- [MCP Server](mcp/): Claude Code, Cursor, VS Code and other AI agents.
- [Command Reference](reference/): every command and flag.
