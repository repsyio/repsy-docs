+++
title = "Creating a Private Ruby Registry"
weight = 1010
description = "Find the default Ruby repository, create more, and get the repository URL and your credentials."
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. A private repository needs a login to be read or written, and a public repository can be read without one. This page shows how to find or create a Ruby repository and where to get the credentials that `gem` and Bundler need.

### The Default Repository

When the first user of an instance is created, Repsy creates a private Ruby repository named `ruby` (and one private repository of every other type). If you only need one Ruby repository, you can use it right away.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** tab.
2. Click **Create Repository**.
3. Select the type **Ruby**.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused.
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to install from the repository without credentials. You can change it later in the repository settings. Publishing always needs credentials, also in a public repository.
6. Optionally add a description and click **Create**.

### Find the repository URL

A Ruby repository has one address, made of the repository address of your instance and the repository name:

```text
{{% repo-url %}}/<repo-name>
```

You give this address to `gem push --host`, to `gem install --source` and to the `source` line of a `Gemfile`. `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).

Open the repository in the web UI and click **Configure** to see the commands with the address of the repository filled in, see [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/#copy-the-commands-from-the-web-ui).

### Get your credentials

`gem` and Bundler send HTTP Basic credentials, and there are two choices:

- **A user account.** Use the username and the password you sign in to the web UI with.
- **A deploy token.** Open **Settings** of the repository (the more options menu (⋮) of the repository in the **Repositories** tab), go to **Deploy Tokens**, click **Create Token**, fill in the form and copy the token when Repsy shows it. It is shown only once. A token belongs to one repository and can be **Read/Write** or **Read Only**. Put the token where the client asks for the password. Repsy checks only the token, so the username can be any non-empty value.

Use a deploy token in CI jobs and whenever you give somebody access to one repository only. A **Read Only** token is enough to install, and publishing needs **Read/Write**. You need the `ADMIN` role to create deploy tokens. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).

Yanking a gem is a management operation: it needs the password of a user with the `ADMIN` role or a **Read/Write** deploy token. The password of a user with the `USER` role can publish but cannot yank, see [Yanking Gems](../yanking-gems/).
{{< /steps >}}

You can now publish to and install from your repository: see [Publishing a Ruby Gem](../publishing-a-ruby-gem/) and [Installing a Ruby Gem](../installing-a-ruby-gem/), or the tutorials for [gem](../publishing-and-installing-gems-with-gem/) and [Bundler](../using-repsy-with-bundler/).
