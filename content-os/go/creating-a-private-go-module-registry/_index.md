+++
title = "Creating a Private Go Module Registry"
weight = 810
description = "Find the default Go repository, create more, get the repository URL and credentials, and serve a private repository over HTTPS."
+++

There is no sign-up in Repsy Open Source: you use the repositories of your own instance. A private repository needs a login to be read or written, and a public repository can be read without one. This page shows how to find or create a Go repository and where to get the credentials that the `go` command and `curl` need.

### The Default Repository

When the first user of an instance is created, Repsy creates a private Go repository named `go` (and one private repository of every other type). If you only need one Go repository, you can use it right away.

{{< steps >}}
### Create a repository

You need the `ADMIN` role to create repositories. Other users can use every repository, but they cannot create, rename, change or delete one.

1. Sign in to the web UI of your instance and go to the **Repositories** tab.
2. Click **Create Repository**.
3. Select the type **Golang**. The web UI writes the type this way; the repository is a Go module proxy.
4. Enter a **Name**. It can have up to 25 characters: letters, digits, `_` and `-`, and it cannot start with `-`. Some names are reserved for the web UI and are refused.
5. Leave the visibility on **Private**, or switch it to **Public** if anyone should be able to install from the repository without credentials. You can change it later in the repository settings. Uploading always needs credentials, also in a public repository.
6. Optionally add a description and click **Create**.

### Find the repository URL

A Go repository has one address, made of the repository address of your instance and the repository name. It is the address you give to `GOPROXY`, and the address you upload to:

| Use | Address |
| --- | --- |
| Install (`go`), as the `GOPROXY` | `{{% repo-url %}}/<repo-name>` |
| Upload (`curl`) | `{{% repo-url %}}/<repo-name>/<module-path>/@v/<version>.zip` |

`https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). There is no username in the address.

Open the repository in the web UI and click **Configure** to see the commands for `GOPROXY`, `GONOSUMDB`, `go get` and the upload, with the address and the name of your repository already filled in.

### Get your credentials

The `go` command and `curl` authenticate with HTTP Basic credentials, and there are two choices:

- **A user account.** Use the username and the password you sign in to the web UI with.
- **A deploy token.** Open **Settings** of the repository (the more options menu (⋮) of the repository in the **Repositories** tab), go to **Deploy Tokens**, click **Create Token**, fill in the form and copy the token when Repsy shows it. It is shown only once. A token belongs to one repository and can be **Read/Write** or **Read Only**. Put the token where the client asks for the password. Repsy checks only the token, so the username can be any non-empty value.

Use a deploy token in CI jobs and whenever you give somebody access to one repository only. A **Read Only** token is enough to install, and publishing needs **Read/Write**. You need the `ADMIN` role to create deploy tokens. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).

### Serve a private repository over HTTPS

The `go` command refuses to send credentials to an `http://` address, and it has no setting that changes this. A private Go repository can therefore only be installed from over HTTPS. A public repository can be read over plain HTTP, but publishing needs credentials in any case, and `curl` would send them unencrypted. See [Enabling HTTPS](../../administration/enabling-https/) and [Using Go Modules from Repsy](../using-go-modules-from-repsy/#https-for-private-repositories).
{{< /steps >}}

A Go repository has no **Package Override** setting: Repsy never overwrites a version of a Go module, see [Publishing a Go Module with curl](../publishing-a-go-module-with-curl/#versions-cannot-be-overwritten).

You can now publish to and install from your repository: see [Publishing a Go Module](../publishing-a-go-module/) and [Installing a Go Module from Registry](../installing-a-go-module/), or the tutorials for [publishing](../publishing-a-go-module-with-curl/) and [using modules](../using-go-modules-from-repsy/).
