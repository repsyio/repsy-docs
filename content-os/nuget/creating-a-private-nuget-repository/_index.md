+++
title = "Creating a Private NuGet Repository"
weight = 410
description = "Find the default NuGet repository, create more, and get the service index address and your credentials."
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. A private repository needs a login to be read or written, and a public repository can be read without one. Pushing a package always needs credentials. This page shows how to find or create a NuGet repository and where to get the credentials that the .NET tools need.

### The Default Repository

When the first user of an instance is created, Repsy creates a private NuGet repository named `nuget` (and one private repository of every other type). If you only need one NuGet repository, you can use it right away.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** tab.
2. Click **Create Repository**.
3. Select the type **NuGet**.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused, see [Creating Your First Repository](../../getting-started/creating-your-first-repository/).
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to restore packages from the repository without credentials. You can change it later in the repository settings. Pushing always needs credentials, also to a public repository.
6. Optionally add a description and click **Create**.

### Find the service index

A NuGet repository has one address, the URL of its V3 service index. It is made of the repository address of your instance and the name of the repository:

```text
{{% repo-url %}}/<repo-name>/v3/index.json
```

`https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). You use this URL as the `value` of the source in your `NuGet.Config` and as `--source` for `dotnet nuget push`. The client reads the service index and finds the addresses of everything else from it: where to push, where to download, where to search.

Open the repository in the web UI and click **Configure** to see the configuration of the source and the push and install commands with the address of the repository already filled in.

### Get your credentials

The .NET tools authenticate with one of these:

- **A user account.** Use the username and the password you sign in to the web UI with. They go into the `packageSourceCredentials` of your `NuGet.Config`.
- **A deploy token.** Open **Settings** of the repository (the more options menu (⋮) of the repository in the **Repositories** tab), go to **Deploy Tokens**, click **Create Token**, fill in the form and copy the token when Repsy shows it. It is shown only once. A token belongs to one repository and can be **Read/Write** or **Read Only**. Put the token where the client asks for the password, or use it as the API key of `dotnet nuget push`. Repsy checks only the token, so the username can be any value.

The API key of `dotnet nuget push` has to be a deploy token: Repsy does not accept an account password there. If you do not put credentials into a `NuGet.Config`, the deploy token is the only credential that works for pushing.

Use a deploy token in CI jobs and whenever you give somebody access to one repository only. A **Read Only** token is enough to restore packages, and pushing, unlisting and relisting need **Read/Write**. You need the `ADMIN` role to create deploy tokens. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).

### Check the repository settings

Two settings in the **Settings** of the repository change what a push does, and an administrator can change them at any time:

- **Package Override** decides whether a version that already exists can be pushed again. It is **Allow** for a new repository.
- **Version Allowance** decides which versions the repository takes: **all packages** (the default), only **pre-release** versions or only **stable** versions. A pre-release version is one with a label after a hyphen, such as `1.0.0-beta.1`.

See [Configuring Repository Settings](../../repositories/configuring-repository-settings/) for all the settings, and [Publishing and Restoring NuGet Packages with the dotnet CLI](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#rules-repsy-applies-to-a-push) for what a refused push looks like.
{{< /steps >}}

### The Configure Dialog

The **Configure** button of a repository opens a dialog with the client configuration for the repository. Option A is a `NuGet.Config` with the source and the credentials, and the `dotnet` commands that push and install with it. Option B needs no configuration file: it names the service index with `--source` and passes a deploy token as `--api-key`.

{{< figure src="os/nuget/publishing-a-nuget-package/configure-dialog.png" alt="The Configure dialog of a NuGet repository with the NuGet.Config snippets and the dotnet commands." caption="The **Configure** dialog shows the `NuGet.Config` snippets and the `dotnet` commands for the repository." >}}

The install command in the dialog, `dotnet add package <PACKAGE_ID> --version <VERSION> --source repsy`, needs a change: the `--source` of `dotnet add package` takes a URL, not the name of a source. Leave `--source repsy` out, as [Installing a NuGet Package](../installing-a-nuget-package/) shows.

You can now publish to and restore from your repository: see [Publishing a NuGet Package](../publishing-a-nuget-package/) and [Installing a NuGet Package](../installing-a-nuget-package/), or the tutorial [Publishing and Restoring NuGet Packages with the dotnet CLI](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/).
