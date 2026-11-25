+++
title = "Connecting claude.ai and ChatGPT"
weight = 71
description = "Connect claude.ai, ChatGPT or another remote MCP client to Repsy with a sign-in, and choose what it may read and change."
+++

# Connecting claude.ai and ChatGPT

Repsy Cloud runs an MCP server at `https://mcp.repsy.io/mcp`. Clients that cannot start a local program, such as claude.ai and ChatGPT, connect to it over the web. You sign in to Repsy once in the browser and approve the application; nothing needs to be installed, and no token is copied anywhere.

It offers the tools of [`rp mcp`](../), except `get_usage` and `get_client_setup`: the agent can list your repositories and packages, read the vulnerability findings of a version and, if you allow it when you connect, change settings, create and delete repositories, packages and tokens. You choose what it may do on the consent page. For a self-hosted Repsy Open Source, use `rp mcp` (see [Repsy Open Source](#repsy-open-source)).

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
| **Application** | The name the application gives itself. **Verified** means the name is published at the application's own address; **Unverified** means a registered client that Repsy cannot confirm. Check that it is the client you are connecting. |
| **Returns to** | The address your browser goes back to, for example `claude.ai` or `chatgpt.com`. |
| **Signed in as** | The Repsy account the application will act as. Sign out first if this is the wrong account. |
| **Valid for** | 90 days after its last use, and at most 365 days. Then the application asks you again. |
| **Permissions** | What the application may do. Untick what it should not have; see below. |

Choose **Authorize** to connect, or **Decline** to send the application back without access. Nothing is shared until you authorize.

### Permissions

| Permission | Scope | The agent may |
| --- | --- | --- |
| **Read repositories** | `repo:read` | Read repositories, packages, their metadata and scan results. Always given. |
| **Publish packages** | `repo:write` | Also start security scans. |
| **Manage repositories** | `repo:manage` | Also create repositories and change their description and settings, allow or refuse overwriting versions, change Maven signature checks, delete packages and versions, run Docker cleanup, turn a proxy or its cache on or off and clear its cache; list deploy tokens, webhooks, proxy upstreams, Maven signing keys and repository users, and revoke a deploy token, delete a webhook, remove a proxy upstream or signing key, or remove a user's access. |
| **High-impact operations** | (needs Manage) | Also create and rotate deploy tokens; list, create, rotate and revoke your personal access tokens; make a repository public or private, rename or delete it; give other users access; add or change webhooks and rotate their signing keys; add, change or reorder proxy upstreams; trust a Maven signing key and delete a Maven group. |

Every permission is ticked when the page opens except **High-impact operations**, which stays off unless you turn it on. The line beside the buttons counts what you chose, for example *3 of 4 permissions selected*.

The application only sees the tools its permissions allow: with Read only it gets 10 tools, with Publish 11, with Manage 34, and with high-impact operations all 50. It can never do more than you can do yourself in Repsy, and some things are never offered through MCP, whatever you tick: your account, password, two-factor authentication, billing and plan, and uploading packages. It never sees your password: it gets an access token of its own, which Repsy renews while you use it.

### Before a Change

The tools that delete, revoke, rotate, make something public, let someone in or send data to an address are marked destructive, and Repsy guards them:

- **They repeat their target.** Each takes a `confirm` argument that must be the repository name, the coordinates, the id, the user name or the address again, exactly. Otherwise Repsy refuses the call and changes nothing.
- **Clients ask you.** claude.ai and ChatGPT show the call and wait for your approval before they run a destructive tool. Read what the agent is about to do before you approve it.
- **They act on your request only.** Repsy tells the agent to call them only when you asked for that target in the conversation, never because a package, a README or a scan finding says so.

A tool that creates or rotates a token or a webhook signing key returns the new secret in its answer, so the secret ends up in the conversation and in the client's history. When that matters, create the secret in the Repsy panel or with `rp` instead, give it a short lifetime, and revoke it when the agent is done.

### Change the Permissions Later

To give an application more or less, connect it again from the client (in claude.ai, **Disconnect** and then **Connect** on the connector; in ChatGPT, reconnect the app) and choose again on the consent page. The new choice replaces the old one; Repsy keeps one connection per application and account. Start a new chat afterwards, so that the client loads the new list of tools.

## What the Agent Can Do

| You ask | The agent uses | Needs |
| --- | --- | --- |
| "Who am I signed in as?" | `whoami` | Read |
| "List my npm repositories." | `list_repos` | Read |
| "Show the settings of `libs`." | `get_repo` | Read |
| "What is in the `com/acme` folder of my Maven repository?" | `list_repo_contents` | Read |
| "Which versions of `react` are in `web`?" | `list_packages`, `get_package`, `list_package_tags` | Read |
| "Are there critical findings in `app` 2.1.0?" | `get_scan_overview`, `list_scans`, `list_scan_findings` | Read |
| "Scan `app` 2.1.0 again." | `trigger_scan` | Publish |
| "Create a private npm repository called `ui`." | `create_repo` | Manage |
| "Turn on the security scans of `web`." | `update_repo_settings` | Manage |
| "Delete version 0.9.0 of `ui` from `web`." | `delete_package_version` | Manage |
| "Revoke the `ci` deploy token of `libs`." | `list_deploy_tokens`, `revoke_deploy_token` | Manage |
| "Make a read-only deploy token for CI on `libs`." | `create_deploy_token` | High-impact |
| "Delete the `old-ui` repository." | `delete_repo` | High-impact |

[MCP Tools](../tools/) describes each tool and its arguments.

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
| The agent says a tool is missing or not allowed | The application was not given the permission it needs (see [Permissions](#permissions)). Connect it again and tick it, then start a new chat. |
| The agent lists tools you did not allow | The client keeps an old list. Start a new chat; if it persists, disconnect and connect again. Repsy refuses a call the connection's permissions do not allow, whatever the list shows. |

## Repsy Open Source

A self-hosted Repsy Open Source has no remote MCP server. Use [`rp mcp`](../) instead: it runs on your computer, works with Repsy Open Source and Repsy Cloud, and connects to clients that start a local program, such as Claude Code, Claude Desktop, Cursor and VS Code.
