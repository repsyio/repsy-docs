+++
title = "Creating a Private Helm Registry"
weight = 910
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. A private repository needs a login to be read or written, and a public repository can be read without one. This page shows how to find or create a Helm repository and where to get the credentials that Helm needs.

### The Default Repository

When the first user of an instance is created, Repsy creates a private Helm repository named `helm` (and one private repository of every other type). If you only need one Helm repository, you can use it right away.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** tab.
2. Click **Create Repository**.
3. Select the type **Helm**.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused.
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to install from the repository without credentials. You can change it later in the repository settings. Publishing always needs credentials, also in a public repository.
6. Optionally add a description and click **Create**.

### Find the repository URLs

One Helm repository serves both protocols, so it has two addresses, both made of the repository address of your instance and the repository name:

| Use | Address |
| --- | --- |
| Classic (ChartMuseum-compatible): `helm repo add`, `helm cm-push`, `helm pull <repo>/<chart>` | `{{% repo-url path="helm" %}}/<repo-name>` |
| OCI: `helm push`, `helm pull oci://`, `helm install oci://` | `oci://{{% repo-url path="helm" scheme="false" %}}/<repo-name>` |

`https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). For the OCI address, leave out `http://` or `https://`. `helm registry login` takes the host without the repository name.

Open the repository in the web UI and click **Configure** to see the commands for both protocols filled in with the name of the repository.

### Get your credentials

Helm authenticates with HTTP Basic credentials, and there are two choices:

- **A user account.** Use the username and the password you sign in to the web UI with.
- **A deploy token.** Open **Settings** of the repository (the more options menu (⋮) of the repository in the **Repositories** tab), go to **Deploy Tokens**, click **Create Token**, fill in the form and copy the token when Repsy shows it. It is shown only once. A token belongs to one repository and can be **Read/Write** or **Read Only**. Put the token where Helm asks for the password. Repsy checks only the token, so the username can be any non-empty value.

Use a deploy token in CI jobs and whenever you give somebody access to one repository only. A **Read Only** token is enough to install, and publishing needs **Read/Write**. You need the `ADMIN` role to create deploy tokens. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).
{{< /steps >}}

You can now publish to and install from your repository: see [Publishing a Helm Chart](../publishing-a-helm-chart/) and [Installing a Helm Chart from Registry](../installing-a-helm-chart/), or the tutorials for the [classic protocol](../publishing-and-installing-charts-the-classic-way/) and [OCI](../publishing-and-pulling-charts-over-oci/).
