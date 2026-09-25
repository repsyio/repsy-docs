+++
title = "Publishing a Cargo Crate"
weight = 720
description = "Create a Rust crate, configure an alternate Cargo registry, then authenticate and publish the crate with cargo publish."
+++

{{< product "cloud" >}}You have registered and created a registry on [Repsy](https://repsy.io/).{{< /product >}}{{< product "os" >}}You have created a registry on your Repsy Open Source instance.{{< /product >}} You are now ready to publish crates to your registry.

{{< steps >}}
### Create a Rust crate

To create a crate, you can use Cargo CLI's `new` command:

```bash
cargo new hello_repsy
cd hello_repsy
```

If this command is executed successfully, Cargo will generate a project directory with a `Cargo.toml` file and source files automatically. This file is required to publish your crates.

### Configure your alternate registry

You currently have a basic crate project. The only missing part is the registry configuration and authentication.
Create or update `$HOME/.cargo/config.toml` in your project as follows:

```toml
[registries.repsy]
index = "sparse+{{% repo-url %}}/<repo-name>/"

[registry]
global-credential-providers = ["cargo:token"]
```

This configuration defines your Repsy registry for Cargo operations.

### Authenticate and publish

In order to successfully publish crates to your `cargo` registry, you must authenticate.
To authenticate, run:

{{< product "cloud" >}}You cannot use your repsy password. You should use a [Deploy Token](../../getting-started/creating-a-deploy-token/) or JWT.{{< /product >}}{{< product "os" >}}Cargo sends a single token, not a username and a password. Use a [deploy token](../../getting-started/creating-a-deploy-token/) with the **Read/Write** access type: the password of a user account does not work as the token.{{< /product >}}

```bash
cargo login --registry repsy <your-deploy-token>
```

If this command is executed successfully, you will be authenticated and ready to publish your crate. As a final step, please run:

```bash
cargo publish --registry repsy
```

If you have uncommitted changes in your project but want to proceed with the publishing process,
you can use the `--allow-dirty` flag.

```bash
cargo publish --registry repsy --allow-dirty
```

With this command Cargo will package and publish your crate to your `cargo` registry.

Congratulations, you have created and published a crate to your registry! You can now install your crate into any project you want and use safely.
{{< /steps >}}

{{< product "os" >}}
`https://<your-repsy-host>` stands for the address of the package protocol port of your Repsy Open Source instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). There is no username in the address, and the index address must end with a `/`.

You can publish a version only once: Repsy refuses a second `cargo publish` of the same version, whatever the settings of the repository say. Publish a new version instead.

[Publishing and Using Crates with Cargo](../publishing-and-using-crates-with-cargo/) walks through a complete crate, the credentials, what the web UI shows and the errors you may meet.
{{< /product >}}

