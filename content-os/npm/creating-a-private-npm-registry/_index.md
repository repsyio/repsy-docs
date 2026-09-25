+++
title = "Creating a Private npm Registry"
weight = 510
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. An npm registry is a repository of the type npm. A private registry needs a login to be read or written, and a public registry can be read without one; publishing needs credentials in both cases. This page shows how to find or create an npm registry and where to get the credentials that npm needs.

## The Default Registry

When Repsy creates the first administrator on its first start, it also creates a private npm repository named `npm` (and one private repository for every other package format). If you only need one registry, use it right away: its address is `{{% repo-url %}}/npm/`. `<your-repsy-host>` stands for the host and port of your instance; on a local instance with the default settings the address is `http://localhost:9090/npm/`.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** page.
2. Click **Create Repository**.
3. Select the type **npm**.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused, see [Creating Your First Repository](../../getting-started/creating-your-first-repository/).
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to download from the registry without credentials. You can change it later in the repository settings.
6. Optionally add a description and click **Create**.

### Find the registry address

The address of the registry is the repository address of your instance followed by the name of the repository and a slash:

```text
{{% repo-url %}}/<repo-name>/
```

Write the slash at the end wherever the address goes into an npm command or a configuration file. npm uses the address to find the credentials that belong to the registry, and an address without the slash can miss them, see [Authenticating with npm](../authenticating-with-npm/#scoped-registries-and-the-main-registry).

Open the repository in the web UI and click **Configure**. The dialog shows the login command and the commands that set the registry, with the address of the repository already filled in.

### Get your credentials

npm authenticates with one of these:

- **A user account.** Use the username and the password you sign in to the web UI with, in `npm login`.
- **A deploy token.** Open **Settings** of the repository (the more options menu (⋮) of the repository on the **Repositories** page), go to **Deploy Tokens**, click **Create Token**, fill in the form and copy the token when Repsy shows it. It is shown only once. A token belongs to one repository and is **Read/Write** or **Read Only**. Enter it where npm asks for the password, or put it into your `.npmrc` file. Repsy checks only the token, so the username can be any value.

Use a deploy token in CI jobs and whenever you give somebody access to one registry only. You need the `ADMIN` role to create deploy tokens, see [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).
{{< /steps >}}

You can now publish to and install from your registry: see [Creating and Publishing an npm Package](../publishing-an-npm-package/) and [Installing an npm Package from Registry](../installing-an-npm-package/).
