+++
title = "Creating a Private Cargo Registry"
weight = 710
description = "Find the default Cargo repository, create more, locate the sparse index address and get a deploy token."
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. A Cargo repository is your registry. A private repository needs a token to be read or written, and a public repository can be read without one. This page shows how to find or create a Cargo repository and where to get the token that `cargo` needs.

### The Default Repository

When the first user of an instance is created, Repsy creates a private Cargo repository named `cargo` (and one private repository of every other type). If you only need one Cargo registry, you can use it right away.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** tab.
2. Click **Create Repository**.
3. Select the type **Cargo**.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused.
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to download crates from the repository without a token. You can change it later in the repository settings. Publishing always needs a token, also in a public repository.
6. Optionally add a description and click **Create**.

### Find the index address

The address that Cargo needs is the **index** of the registry. It is made of `sparse+`, the repository address of your instance and the repository name, and it ends with a slash:

```text
sparse+{{% repo-url %}}/<repo-name>/
```

`https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). Cargo refuses an index address without the closing slash.

Open the repository in the web UI and click **Configure** to see the `config.toml` snippet with your address and the name of the repository already in it. The address in the dialog comes from the `REPO_BASE_URL` setting of your instance.

### Get your token

Cargo does not send a username and a password. It sends one token, and for Repsy that token is a **deploy token**:

1. Open **Settings** of the repository (the more options menu (⋮) of the repository in the **Repositories** tab).
2. Go to **Deploy Tokens** and click **Create Token**.
3. Fill in the form and copy the token when Repsy shows it. It is shown only once.

A token belongs to one repository and can be **Read/Write** or **Read Only**. A **Read Only** token is enough to resolve, download and install crates, and publishing and yanking need **Read/Write**. A token expires after at most 365 days. You need the `ADMIN` role to create deploy tokens. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).

The password of a user account does not work as a Cargo token. A repository that is **Public** can be read without a token, but you still need a **Read/Write** token to publish.
{{< /steps >}}

You can now publish to and install from your repository: see [Publishing a Cargo Crate](../publishing-a-cargo-crate/) and [Installing a Cargo Crate from Registry](../installing-a-cargo-crate/), or the tutorial [Publishing and Using Crates with Cargo](../publishing-and-using-crates-with-cargo/).
