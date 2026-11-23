+++
title = "Connecting claude.ai and ChatGPT"
weight = 71
description = "Connect claude.ai, ChatGPT or another remote MCP client to Repsy with a sign-in, and let it read your repositories, packages and scans."
+++

# Connecting claude.ai and ChatGPT

Repsy Cloud runs an MCP server at `https://mcp.repsy.io/mcp`. Clients that cannot start a local program, such as claude.ai and ChatGPT, connect to it over the web. You sign in to Repsy once in the browser and approve the application; nothing needs to be installed, and no token is copied anywhere.

It offers the read tools of [`rp mcp`](../): the agent can list your repositories and packages and read the vulnerability findings of a version, but it cannot change anything. For tools that create repositories or deploy tokens, or for a self-hosted Repsy Open Source, use `rp mcp` (see [Repsy Open Source](#repsy-open-source)).

## Add the Server to Your Client

The menu names follow each client's documentation as of November 2026.

{{< tabs groupId="mcp-remote-client" >}}
{{% tab name="claude.ai" %}}
1. Open **Settings > Connectors** and choose **Add custom connector**.
2. Enter `Repsy` as the name and `https://mcp.repsy.io/mcp` as the URL, then choose **Add**.
3. Choose **Connect** next to the new connector. Your browser opens Repsy; sign in and approve the request (see [Approve the Connection](#approve-the-connection)).
4. In a chat, switch the Repsy tools on from the tools menu of the message box, and ask, for example, *"Which of my Repsy repositories have critical vulnerabilities?"*.

In a Team or Enterprise organization, an owner may have to add the connector for the organization first; each member then connects their own Repsy account. Claude Desktop and the Claude mobile apps use the connectors of your claude.ai account.
{{% /tab %}}
{{% tab name="ChatGPT" %}}
1. Open **Settings > Apps & Connectors > Advanced settings** and turn on **Developer mode**.
2. Back in **Apps & Connectors**, choose **Create**. Enter `Repsy` as the name and `https://mcp.repsy.io/mcp` as the MCP server URL, and choose OAuth as the authentication.
3. Create the app. Your browser opens Repsy; sign in and approve the request (see [Approve the Connection](#approve-the-connection)).
4. In a chat, add Repsy from the tools menu of the message box and ask your question.

In a Business or Enterprise workspace, an admin may have to allow custom apps first.
{{% /tab %}}
{{% tab name="Other Clients" %}}
Any MCP client that supports the Streamable HTTP transport and OAuth sign-in can connect. Give it `https://mcp.repsy.io/mcp` as the server URL; it finds the sign-in on its own. For example, with Claude Code:

```bash
claude mcp add --transport http repsy https://mcp.repsy.io/mcp
```

Then run `/mcp` in Claude Code and choose **Authenticate** for `repsy`.
{{% /tab %}}
{{< /tabs >}}

## Approve the Connection

When the client connects, Repsy asks you to sign in (with your password, a social sign-in or two-factor authentication, as usual) and then shows what the application asks for:

| The page shows | What it means |
| --- | --- |
| **Application** | The name the application gives itself and the address it returns to. Check that it is the client you are connecting, for example `claude.ai` or `chatgpt.com`. |
| **Signed in as** | The Repsy account the application will act as. Sign out first if this is the wrong account. |
| **The application will be able to** | **Read repositories** (`repo:read`): read repositories, packages, their metadata and scan results. |
| **Valid for** | 90 days after its last use, and at most 365 days. Then the application asks you again. |

Choose **Authorize** to connect, or **Decline** to send the application back without access. Nothing is shared until you authorize.

The application can only do what you can do yourself in Repsy, narrowed to reading. It cannot manage your tokens, change settings or upload, change or delete anything. It never sees your password: it gets an access token of its own, which Repsy renews while you use it.

## What the Agent Can Do

| You ask | The agent uses |
| --- | --- |
| "Who am I signed in as?" | `whoami` |
| "List my npm repositories." | `list_repos` |
| "Show the settings of `libs`." | `get_repo` |
| "What is in the `com/acme` folder of my Maven repository?" | `list_repo_contents` |
| "Which versions of `react` are in `web`?" | `list_packages`, `get_package`, `list_package_tags` |
| "Are there critical findings in `app` 2.1.0?" | `get_scan_overview`, `list_scans`, `list_scan_findings` |

[MCP Tools](../tools/) describes each tool and its arguments. A connected application cannot read deploy tokens, so `list_deploy_tokens` is not offered; use `rp mcp` for that.

A failed call answers the same JSON error as `rp --output json`, with its code, so the agent can tell you what went wrong.

## Disconnect

Disconnecting ends the connection at once: the application's tokens stop working on their next request.

- **In Repsy:** open **Settings**, scroll to **Connected Applications**, and choose **Disconnect** next to the application. The list shows when each application was connected and last used, and when it expires.
- **In the client:** remove or disconnect the connector there. A client that revokes its token ends the connection in Repsy too; check **Connected Applications** and disconnect it there if it is still listed.

An application you have not used for 90 days stops working by itself. To use it again, connect it again from the client.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| The client says the connection or sign-in failed | Connect again from the client. A sign-in request is valid for 10 minutes; if you took longer, start over. |
| The agent sees the wrong account | Disconnect the application, sign out of Repsy in the browser, and connect again with the right account. |
| The connection stopped working | It was disconnected, or unused for 90 days, or reached 365 days. Connect it again from the client. |
| The agent says a tool is not supported | The remote server only reads. Create repositories, deploy tokens and scans in the Repsy panel or with `rp`. |

## Repsy Open Source

A self-hosted Repsy Open Source has no remote MCP server. Use [`rp mcp`](../) instead: it runs on your computer, works with Repsy Open Source and Repsy Cloud, and connects to clients that start a local program, such as Claude Code, Claude Desktop, Cursor and VS Code.
