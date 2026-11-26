+++
title = "MCP Server"
chapter = true
weight = 70
description = "Let an AI agent such as Claude Code, Cursor or VS Code browse Repsy repositories, packages and scans through the rp MCP server."
+++

# MCP Server

`rp mcp` lets an AI agent work with Repsy: list repositories and packages, read the vulnerability findings of a version, show how to configure a package manager, and, if its credential allows, create, change and delete repositories, packages, tokens, webhooks and proxy upstreams. It is a [Model Context Protocol](https://modelcontextprotocol.io/) server for Claude Code, Claude Desktop, Cursor, VS Code and other MCP clients, and it works with Repsy Cloud and with a self-hosted Repsy Open Source.

{{% notice tip %}}
To use Repsy from claude.ai, ChatGPT or another client on the web, without installing `rp`, connect it to the remote server at `https://mcp.repsy.io/mcp`: see [Connecting claude.ai and ChatGPT](remote/). You choose on its consent page what the client may read and change.
{{% /notice %}}

## Quick Start

With [`rp` installed](../installation/) and Claude Code:

```bash
rp auth login                                                  # sign in once
claude mcp add --transport stdio --scope user repsy -- rp mcp  # add the server
```

Start Claude Code, run `/mcp` to see the server, and ask, for example, *"Which of my Repsy repositories have critical vulnerabilities?"*. For other clients, see [Configure Your Client](#configure-your-client).

You never run `rp mcp` by hand: the client starts it and talks to it over standard input and output.

## What the Agent Can Do

| You ask | The agent uses |
| --- | --- |
| "Who am I signed in as?" | `whoami` |
| "List my npm repositories." | `list_repos` |
| "Show the settings of `libs`." | `get_repo` |
| "What is in the `com/acme` folder of my Maven repository?" | `list_repo_contents` |
| "Which versions of `react` are in `web`?" | `list_packages`, `get_package`, `list_package_tags` |
| "Are there critical findings in `app` 2.1.0?" | `get_scan_overview`, `list_scans`, `list_scan_findings` |
| "Which deploy tokens does `libs` have?" | `list_deploy_tokens` |
| "How much disk and traffic do I use?" | `get_usage` (signed-in session only) |
| "How do I point pip at `pypi-internal`?" | `get_client_setup` |
| "Who can access `libs`, and which webhooks does it have?" | `list_repo_users`, `list_webhooks` |
| "Create a private npm repository called `ui`." | `create_repo` |
| "Scan `app` 2.1.0 again." | `trigger_scan` |
| "Turn on version overwrites in `snapshots`." | `update_repo_settings`, `set_repo_allow_override` |
| "Make a read-only deploy token for CI on `libs`." | `create_deploy_token` |
| "Rotate the `ci` deploy token of `libs`." | `list_deploy_tokens`, `rotate_deploy_token` |
| "Delete version 0.9.0 of `ui` from `web`." | `delete_package_version` |
| "Delete the `old-ui` repository." | `delete_repo` |

From `create_repo` on, the tools change the registry and are listed only when the credential may use them (see [Writes](#writes)). [MCP Tools](tools/) describes every tool and its arguments; `rp mcp tools` prints the same list.

Your client asks before it starts a new server and, by default, before each tool call. Read what the agent is about to do before you approve it.

## Credentials

`rp mcp` uses the same profile and credential as any other `rp` command: `REPSY_TOKEN` when it is set, else what `rp auth login` stored.

| | Signed-in session | Personal access token |
| --- | --- | --- |
| Set up with | `rp auth login` once in a terminal | `rp token create`, then `REPSY_TOKEN` in the client's configuration |
| Lasts | 24 hours; sign in again and the running server picks it up | Up to 365 days |
| Tools that change the registry | All of them | Those its scopes allow |
| Good for | Trying it out, daily work at your desk | An agent that runs every day |

For a token, give it only the scope the agent needs:

```bash
rp token create --name mcp --scope repo:read --show-secret
```

`repo:read` covers every read tool, and the agent then sees no tool that changes the registry. `repo:write` adds `trigger_scan`; `repo:manage` adds every other tool that changes the registry, the destructive ones included. See [Authentication](../authentication/#personal-access-tokens).

{{% notice warning %}}
A token written into a configuration file is stored in plain text. Use the client's way of keeping it outside the file where there is one (the `${...}` references below), keep the file out of version control, and revoke the token with `rp token revoke <id>` when you no longer need it.
{{% /notice %}}

## Configure Your Client

Desktop applications often do not see the `PATH` of your shell, so the configurations below give the full path of `rp`. Find yours with `command -v rp` (macOS, Linux) or `where rp` (Windows) and replace `/usr/local/bin/rp`. To pin a host for the agent, add `--hostname <host>` to the arguments or set `REPSY_HOST`; otherwise the current profile is used (see [Profiles and Hosts](../profiles-and-hosts/)).

The snippets follow each client's documentation as of November 2026.

{{< tabs groupId="mcp-client" >}}
{{% tab name="Claude Code" %}}
Add the server for all your projects:

```bash
claude mcp add --transport stdio --scope user repsy -- rp mcp
```

Everything after `--` is the command Claude Code runs; add `--read-only` or `--hostname <host>` there. `--env REPSY_TOKEN=...` goes before `--`, but stores the token in `~/.claude.json`; to keep it out of the file, export `REPSY_TOKEN` in the shell you start Claude Code from.

To share the server with a project, put it in `.mcp.json` at the project root. Claude Code expands `${VAR}`, so the token stays in each person's environment:

```json
{
  "mcpServers": {
    "repsy": {
      "command": "rp",
      "args": ["mcp"],
      "env": {
        "REPSY_TOKEN": "${REPSY_TOKEN}"
      }
    }
  }
}
```

`/mcp` in Claude Code shows the server and its tools.
{{% /tab %}}
{{% tab name="Claude Desktop" %}}
Open the configuration with **Settings > Developer > Edit Config** from the Claude menu of your system's menu bar (not the settings inside the window). The file is `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows and `~/.config/Claude/claude_desktop_config.json` on Linux.

```json
{
  "mcpServers": {
    "repsy": {
      "command": "/usr/local/bin/rp",
      "args": ["mcp"]
    }
  }
}
```

This uses the stored `rp auth login`. Claude Desktop has no documented way to read a secret from outside the file, so a token goes into `env` as plain text (`"env": {"REPSY_TOKEN": "<token>"}`). Quit and restart Claude Desktop after every change. The server's messages are in `mcp-server-repsy.log` in Claude's log folder (`~/Library/Logs/Claude` on macOS).
{{% /tab %}}
{{% tab name="Cursor" %}}
Put the server in `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project). Cursor expands `${env:NAME}`, so the token stays in your environment:

```json
{
  "mcpServers": {
    "repsy": {
      "type": "stdio",
      "command": "/usr/local/bin/rp",
      "args": ["mcp"],
      "env": {
        "REPSY_TOKEN": "${env:REPSY_TOKEN}"
      }
    }
  }
}
```

Leave out `env` to use the stored `rp auth login`.
{{% /tab %}}
{{% tab name="VS Code" %}}
Run **MCP: Add Server** from the Command Palette and choose **Command (stdio)**, or put the server in `.vscode/mcp.json` in the workspace (**MCP: Open User Configuration** opens the file for all workspaces). An input keeps the token out of the file: VS Code asks for it once and stores it securely.

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "repsy-token",
      "description": "Repsy personal access token",
      "password": true
    }
  ],
  "servers": {
    "repsy": {
      "type": "stdio",
      "command": "/usr/local/bin/rp",
      "args": ["mcp"],
      "env": {
        "REPSY_TOKEN": "${input:repsy-token}"
      }
    }
  }
}
```

Leave out `inputs` and `env` to use the stored `rp auth login`. Copilot also reads a `.mcp.json` at the workspace root in the `mcpServers` format shown for Claude Code.
{{% /tab %}}
{{< /tabs >}}

## Writes

Thirty-four tools change the registry. Each is listed only while the credential may use it: `trigger_scan` needs `repo:write`, every other one `repo:manage`, and a signed-in session may use all of them. The server checks the credential again while it runs and tells the client when the list changes, so a new `rp auth login` or another token takes effect without a restart. The `whoami` tool tells the agent whether the write tools are listed, and whether the destructive ones are.

| Area | Write tools | Destructive tools |
| --- | --- | --- |
| Repositories | `create_repo`, `update_repo`, `update_repo_settings` | `rename_repo`, `update_repo_visibility`, `set_repo_allow_override`, `delete_repo` |
| Packages | | `delete_package_version`, `delete_package`, `delete_maven_group` |
| Scans | `trigger_scan` | |
| Deploy tokens | | `create_deploy_token`, `rotate_deploy_token`, `revoke_deploy_token` |
| Personal access tokens | | `create_access_token`, `rotate_access_token`, `revoke_access_token` |
| Maven signatures | | `set_repo_pgp_settings`, `add_maven_signing_key`, `remove_maven_signing_key` |
| Docker | `set_docker_cleanup_policy` | `set_docker_cleanup_status`, `run_docker_cleanup`, `delete_docker_unused` |
| Webhooks (Repsy Cloud) | | `create_webhook`, `update_webhook`, `rotate_webhook_secret`, `delete_webhook` |
| Proxy repositories (Repsy Cloud) | `update_proxy_settings` | `update_proxy_upstreams`, `remove_proxy_upstream`, `clear_proxy_cache` |
| Repository access (Repsy Cloud) | | `grant_repo_permission`, `revoke_repo_permission` |

A tool is destructive when its effect is hard to undo or reaches beyond the registry: it deletes, revokes or rotates, makes a repository public, lets someone else in, or sends data to an address. The destructive tools have extra guards:

- **They repeat their target.** Each takes a `confirm` argument that must be the repository name, the coordinates, the id, the user name or the address again, exactly. Otherwise the call is refused and nothing is sent.
- **Clients always ask.** They are marked destructive, so an MCP client never approves them by itself.
- **They act on your request only.** The server tells the agent to call them only when you asked for that target in the conversation, never because a package, a README or a scan finding says so.
- **They take their targets from a list.** Ids come from `list_deploy_tokens`, `list_access_tokens`, `list_webhooks`, `list_proxy_upstreams` and `list_maven_signing_keys`, so the agent does not have to guess them.

Unlike the [remote server](remote/#permissions), `rp mcp` has no separate high-impact consent: it offers every tool its credential may use, deleting a repository and creating tokens included. An agent that runs it on your computer can usually run `rp` itself too, so the credential is the real limit. Give the agent a token with only the scopes it needs, or add `--read-only`, when it should not change anything.

Tools that create or rotate a token or a webhook signing key return the new secret in their answer, so it ends up in the conversation and in the client's history. Create those secrets with `rp token create` or `rp webhook` in a terminal when that matters, give them a short lifetime, and revoke them when the agent is done.

To keep an agent read-only whatever its credential may do, add `--read-only` after `mcp` in the arguments. (Before `rp` 0.2.3 the write tools needed `--allow-writes`; the flag is still accepted, prints a warning and changes nothing.)

## Safety

Repsy bans an IP address for an hour when its requests look like an attack (a path traversal, SQL or script text in a search) or when too many sign-ins fail. An agent can produce such a request by accident, for example by pasting a code fragment into a search, so `rp mcp` checks every request before it is sent:

- **Arguments:** a name with `..`, a control character, a percent escape or a leading `/` is refused with an error that names the argument.
- **Requests:** a request the server would count as an attack is refused locally, with the rule it would break. Every `rp` command except `rp api` does this too (see [Exit Codes](../exit-codes/#requests-that-would-get-the-ip-address-banned)).
- **Credentials:** a credential the server has refused is not sent again for a minute, and an expired sign-in is not sent at all. Sign in again with `rp auth login`; the running server picks it up.
- **Session-only tools:** `get_usage` works with a signed-in session only, and refuses an access token without sending anything.

A failed call answers the same JSON error as `rp --output json`, with its code. Secrets are removed from every message.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| The client cannot start the server (`ENOENT`, "command not found") | Use the full path of `rp` in `command`. |
| Which host and user does the agent use? | Ask it to call `whoami`, or run `rp auth status` in a terminal with the same environment. |
| A write or destructive tool is missing | Check the token's scopes with `rp auth status`, that `--read-only` is not in the arguments, and that `rp version` is 0.3.0 or later for the tools beyond the six of 0.2.5. |
| The sign-in expired | Run `rp auth login`; the running server picks up the new sign-in. |
| More detail | Add `--debug` after `mcp` in the arguments. The requests, with secrets removed, go to the server's standard error, which the client keeps in its MCP log. |
