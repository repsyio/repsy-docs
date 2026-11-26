+++
title = "Authentication"
weight = 20
description = "Sign in to Repsy with the rp command line client, keep the credential safe, and create personal access tokens for CI and scripts."
+++

# Authentication

`rp` signs every request with one credential per profile. On your own machine, sign in once with the browser. In CI or a script, give `rp` a personal access token in `REPSY_TOKEN`.

| Where you run `rp` | Use | Lifetime |
| --- | --- | --- |
| Your laptop or workstation | `rp auth login` (browser sign-in) | 24 hours, then sign in again |
| CI, cron jobs and scripts | A personal access token in `REPSY_TOKEN` | Up to 365 days, until you revoke it |
| A remote machine over SSH | `rp auth login`, opening the printed address in a browser on that machine, or pasting a token | As above |

## Sign In With the Browser

```bash
rp auth login
```

In a terminal `rp` asks how to sign in. Press Enter for the default, **Sign in with a web browser**:

1. `rp` opens the panel's authorize screen in your browser.
2. You approve the sign-in there.
3. The panel hands a temporary token back to `rp` on `127.0.0.1`. You paste nothing.

The sign-in lasts 24 hours and is not renewed. When it runs out, commands answer that the sign-in expired; run `rp auth login` again. A new sign-in replaces the previous one, on this machine and on any other.

If the browser cannot be opened (for example over SSH), `rp` prints the address of the authorize screen and keeps waiting for 5 minutes. Open it in a browser on the same machine. If nothing arrives in time, the login fails and `rp` suggests entering a token instead.

## Sign In With a Token

Choose **Enter an access token** at the prompt, or skip the question:

```bash
rp auth login --no-browser
```

`rp` asks for the token and nothing else. In a script, pipe the token in:

```bash
echo "$TOKEN" | rp auth login --with-token
```

`rp` checks the token with the server before it stores it.

## Use REPSY_TOKEN in CI

When `REPSY_TOKEN` is set, it is the credential: `rp` neither reads nor writes a stored one, and `rp auth login` and `rp auth logout` refuse to run. Store the token as a secret of your CI system and expose it as `REPSY_TOKEN`:

```bash
export REPSY_TOKEN=<token>
rp repo list
```

Create the token as described in [Personal Access Tokens](#personal-access-tokens) below.

## Check and End a Sign-In

| Command | What it does |
| --- | --- |
| [`rp auth status`](../reference/rp-auth-status/) | Shows the user, the profile, where the credential comes from (`REPSY_TOKEN`, the keyring or the file), its kind, its scopes and when it expires. It never prints the token. |
| [`rp auth logout`](../reference/rp-auth-logout/) | Removes the stored credential. A browser sign-in is also ended on the server. A personal access token is only forgotten locally and stays valid until you revoke it. |
| [`rp auth token`](../reference/rp-auth-token/) | Prints the token `rp` would use, for scripts (`TOKEN=$(rp auth token)`). Anyone who sees it can act as you. |
| [`rp auth`](../reference/rp-auth/) | Signs in when the profile has no credential, and shows the status when it has one. |

A missing or rejected credential exits with code 4 (see [Exit Codes](../exit-codes/)).

## Where the Credential Is Stored

- **The OS keyring** (macOS Keychain, Windows Credential Manager, the Secret Service on Linux) keeps the credential of each profile.
- **A plain file** is the fallback when the keyring cannot be used, for example on a server without a desktop session. It is `credentials.json` in the configuration directory (see [Configuration](../configuration/)), with mode `0600`. `rp` warns once per command when it uses the file. `--insecure-storage` chooses the file on purpose.
- **Never in `config.yml` or `hosts.yml`.** A token written there by hand is ignored.

Tokens are removed from error messages and from `--debug` output.

## Personal Access Tokens

A personal access token belongs to your user and signs `rp` and panel API requests with the scopes you give it:

| Scope | Allows |
| --- | --- |
| `repo:read` | Download, list and read repositories, including scan results. The default. |
| `repo:write` | Also publish packages and start scans. |
| `repo:manage` | Also delete, change settings, manage deploy tokens and create repositories. |

Every token can also read who it belongs to (`profile:read`); you do not ask for it.

`scan:read` is deprecated: `repo:read` now reads scan results too. The panel and `rp` no longer offer it. A token that already has it keeps working as before, and `rp token create --scope scan:read` is still accepted, with a warning that `repo:read` covers scan results. A `scan:read` token reads scan results only, not the repository itself, so give new tokens `repo:read` instead.

A token never allows more than its owner may do. Create one with the scopes the job needs:

```bash
TOKEN=$(rp token create --name ci --scope repo:write --show-secret)
```

- **The secret is shown once.** `rp` prints it only with `--show-secret` or a structured output (`--output json`, `--jq`), and refuses to create a token otherwise, so a token is never created and lost.
- **It lives 365 days** unless `--expires-in` is shorter (for example `--expires-in 30d`).
- **Names are unique.** Two of your tokens that are not revoked and have not expired cannot have the same name, ignoring case. A taken name answers `409 accessTokenNameInUse`, and `rp` suggests another name or revoking the old token. The name of a revoked or expired token is free again.

Manage your tokens with [`rp token`](../reference/rp-token/):

| Command | What it does |
| --- | --- |
| `rp token list` | Lists your tokens: name, scopes and expiry, never a secret. |
| `rp token rotate <id>` | Replaces the secret; the token keeps its name and scopes and gets a new id. |
| `rp token revoke <id>` | Revokes the token at once. |

Managing personal access tokens takes a sign-in or a personal access token that holds the scopes involved.

## Deploy Tokens

A deploy token belongs to **one repository**. It is a username and token pair for package clients (npm, Maven, Docker and others) to push or pull in that repository only, and it cannot call the panel API. Manage them with the same commands and `--repo <repo-name>`:

```bash
rp token create --repo <repo-name> --name ci --read-only --output json
```

`--read-only` limits it to pulls; `--username` sets its username, otherwise the server generates one.
