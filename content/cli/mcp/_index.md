+++
title = "MCP Server"
chapter = true
weight = 70
description = "Let an AI agent such as Claude Code, Cursor or VS Code browse Repsy repositories, packages and scans through the rp MCP server."
+++

# MCP Server

`rp mcp` runs a [Model Context Protocol](https://modelcontextprotocol.io/) server, so that an AI agent can work with Repsy: list repositories and packages, read the vulnerability findings of a version, or show how to configure a package client. It works with Repsy Cloud and with a self-hosted Repsy Open Source, through the same profile `rp` uses for every other command.

The MCP client (Claude Code, Claude Desktop, Cursor, VS Code and others) starts `rp mcp` itself and talks to it over standard input and output. You do not run it by hand; you add it to the client's configuration, as shown below.

- The server **only reads** unless it is started with `--allow-writes`, which adds three tools: create a repository, start a security scan and create a deploy token.
- No tool deletes, revokes or rotates anything.
- [MCP Tools](tools/) lists every tool and its arguments; `rp mcp tools` prints the same list.

## Before You Start

1. Install `rp` (see [Installation](../installation/)) and note where it is: `command -v rp` on macOS and Linux, `where rp` on Windows. Desktop applications often do not see the `PATH` of your shell, so the configurations below use the full path; replace `/usr/local/bin/rp` with yours.
2. Choose the Repsy host. `rp mcp` uses the current profile (see [Profiles and Hosts](../profiles-and-hosts/)). To pin a host for the agent, add `--hostname <host>` to the arguments or set `REPSY_HOST`.
3. Choose a credential (next section). `rp mcp` signs every request with `REPSY_TOKEN` when it is set, and with the credential `rp auth login` stored otherwise.

## Credentials

**Quick start: the stored sign-in.** Run `rp auth login` once in a terminal and configure the client without a token. The browser sign-in lasts 24 hours, and the next `rp auth login` (on any machine) replaces it. When it expires, run `rp auth login` again: the running server picks up the new sign-in without a restart.

**Durable setup: a personal access token.** For an agent that runs every day, create a personal access token with only the scope it needs and give it to the client in `REPSY_TOKEN`:

```bash
rp token create --name mcp --scope repo:read --show-secret
```

`repo:read` is enough for every read tool. With `--allow-writes`, creating a repository needs `repo:manage` and starting a scan needs `repo:write`; give the token those scopes only if you enable writes.

{{% notice warning %}}
A token written into a configuration file is stored in plain text. Prefer the client's way of keeping it outside the file where there is one (the `${...}` references below), keep the file out of version control, and revoke the token with `rp token revoke <id>` when you no longer need it.
{{% /notice %}}

## Configure Your Client

The snippets follow each client's documentation as of November 2026. The clients ask before they use a new server and, by default, before a tool call; read what the agent is about to do before you approve it.

### Claude Code

Add the server for all your projects:

```bash
claude mcp add --transport stdio --scope user repsy -- rp mcp
```

Everything after `--` is the command Claude Code runs; add `--allow-writes` or `--hostname <host>` there. Options such as `--env REPSY_TOKEN=...` go before `--`, but that stores the token in `~/.claude.json`; to keep it out of the file, export `REPSY_TOKEN` in the shell you start Claude Code from instead.

To share the server with a project, put it in `.mcp.json` at the project root. Claude Code expands `${VAR}` there, so the token stays in each person's environment:

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

### Claude Desktop

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

### Cursor

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

### VS Code

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

Leave out `inputs` and `env` to use the stored `rp auth login`. Copilot also reads a `.mcp.json` at the workspace root in the `mcpServers` format shown for Claude Code above.

## Writes

Start the server with `--allow-writes` (add it after `mcp` in the arguments) to add three tools:

| Tool | What it does |
| --- | --- |
| `create_repo` | Creates a repository, private unless the agent asks for a public one. A name that is taken is an error. |
| `trigger_scan` | Starts a security scan of a package version, or follows the one that is already running, and can wait up to five minutes for it. |
| `create_deploy_token` | Creates a deploy token for a repository. The token is in the tool's answer, so it ends up in the conversation and in the client's history. Create deploy tokens with `rp token create` in a terminal when that matters. |

The `whoami` tool tells the agent whether writes are enabled.

## Safety

Repsy bans an IP address for an hour when requests from it look like an attack (a path traversal, SQL or script text in a search, ...) or when too many sign-ins fail. An agent can produce such a request by accident, for example by pasting a code fragment into a search. `rp mcp` therefore checks every request before it is sent:

- Arguments are checked first: a name with `..`, a control character, a percent escape or a leading `/` is refused with an error that names the argument.
- Every request is checked against the same rules the server applies, and is refused locally, with the rule it would break, instead of being sent.
- A credential the server has refused is not sent again for a minute, and an expired browser sign-in is not sent at all. Sign in again with `rp auth login`; the server picks it up without a restart.
- A tool that the server answers only for a web panel session (`get_usage`) refuses an access token without sending the request.

A failed call answers the same JSON error as `rp --output json`, with its code, and secrets are removed from every message.

## Troubleshooting

- **The client cannot start the server** (`ENOENT`, "command not found"): use the full path of `rp` in `command`.
- **Which host and user does the agent use?** Ask it to call `whoami`, or run `rp auth status` in a terminal with the same environment.
- **The tool list:** `rp mcp tools` prints it; [MCP Tools](tools/) describes each tool.
- **More detail:** add `--debug` after `mcp` in the arguments. The requests (with secrets removed) go to the server's standard error, which the client keeps in its MCP log.
