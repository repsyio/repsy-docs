+++
title = "Creating a Private Maven Repository"
weight = 310
description = "Find the default Maven repository, create more, and get the repository URL and your credentials."
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. A private repository needs a login to be read or written, and a public repository can be read without one. This page shows how to find or create a Maven repository and where to get the credentials your build tool needs.

### The Default Repository

When the first user of an instance is created, Repsy creates a private Maven repository named `maven` (and one private repository of every other type). If you only need one Maven repository, you can use it right away: its URL is `{{% repo-url %}}/maven`.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** tab.
2. Click **Create Repository**.
3. Select the type **Maven**.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused.
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to download from the repository without credentials. You can change it later in the repository settings.
6. Optionally add a description and click **Create**.

### Find the repository URL

The URL of the repository is the repository address of your instance followed by the repository name:

```
{{% repo-url %}}/<repo-name>
```

Open the repository in the web UI and click **Configure** to see `settings.xml` and `pom.xml` snippets that already contain the URL and the name of the repository.

### Get your credentials

Build tools authenticate with HTTP Basic credentials, and there are two choices:

- **A user account.** Use the username and the password you sign in to the web UI with.
- **A deploy token.** Open **Settings** of the repository (the more options menu (⋮) of the repository in the **Repositories** tab), go to **Deploy Tokens**, click **Create Token**, fill in the form and copy the token when Repsy shows it. It is shown only once. A token belongs to one repository and can be **Read/Write** or **Read Only**. Put the token where the build tool asks for the password. Repsy checks only the token, so the username can be any value.

Use a deploy token in CI jobs and whenever you give somebody access to one repository only. You need the `ADMIN` role to create deploy tokens.
{{< /steps >}}

{{< figure src="os/maven/publishing-a-maven-package/configure-dialog.png" alt="The Maven Configuration dialog with a settings.xml snippet that has a server entry and a pom.xml snippet that has a distributionManagement entry." caption="The **Configure** dialog of a Maven repository. The address and the name of the repository are filled in; your instance shows its own address instead of the demo address `repsy.example.com`." >}}

You can now publish to and download from your repository: see [Using a Private Maven Repository](../using-private-maven-repository/) or the tutorials for [Maven](../publishing-and-consuming-with-maven/) and Gradle ([Kotlin DSL](../publishing-and-consuming-with-gradle-kotlin-dsl/), [Groovy DSL](../publishing-and-consuming-with-gradle-groovy-dsl/)).
