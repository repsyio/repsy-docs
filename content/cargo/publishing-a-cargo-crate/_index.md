+++
title = "Publishing a Cargo Crate"
weight = 62
+++

You have registered and created a registry on [Repsy](https://repsy.io/). You are now ready to publish crates to your registry.

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
index = "sparse+https://repo.repsy.io/<username>/<registryName>/"

[registry]
global-credential-providers = ["cargo:token"]
```

This configuration defines your Repsy registry for Cargo operations.

### Authenticate and publish

In order to successfully publish crates to your `cargo` registry, you must authenticate.
To authenticate, run:

You cannot use your repsy password. You should use Deploy Token or JWT.

```bash
cargo login --registry repsy <your_deploy_token>
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
