+++
title = "Installing a Cargo Crate from Registry"
weight = 730
description = "Install a Cargo crate from a registry by adding the registry to your Cargo configuration and authenticating when it is private."
+++

When you create a registry, it will be private by default. Before you install a crate from a private registry, you first need to authenticate as seen in the previous page. If your registry is public, you can skip the authentication part, but you must still indicate the registry that you want to use.

Therefore, you need to set Cargo configuration as follows:

Create or edit `$HOME/.cargo/config.toml` file

```toml
[registries.repsy]
index = "sparse+{{% repo-url %}}/<repo-name>/"

[registry]
global-credential-providers = ["cargo:token"]
```

**Note:** `global-credential-providers` only tells Cargo how to send a token, which a private repository needs. If your repository is **public**, and you are **only downloading packages**, you do not need it and can leave it out. Your `$HOME/.cargo/config.toml` can then look like this:

```toml
[registries.repsy]
index = "sparse+{{% repo-url %}}/<repo-name>/"
```

**Tip:** Cargo caches registry index and crate data locally. If you encounter stale index data or unexpected resolution errors after publishing a new version to Repsy, you may need to clear the cache manually.

**Clear the Repsy registry cache only:**

{{< product "cloud" >}}
```bash
rm -rf ~/.cargo/registry/index/*repsy*
rm -rf ~/.cargo/registry/cache/*repsy*
```
{{< /product >}}

{{< product "os" >}}
```bash
rm -rf ~/.cargo/registry/index/<your-repsy-host>-*
rm -rf ~/.cargo/registry/cache/<your-repsy-host>-*
```

Cargo names these folders after the host name of the registry followed by a hash, for example `localhost-ee18c9976d7b27b3`. `<your-repsy-host>` is the host name of your Repsy Open Source instance, without the scheme and the port.
{{< /product >}}

**Or clear the entire Cargo registry cache:**

```bash
rm -rf ~/.cargo/registry/
```

After clearing, the next `cargo install` or `cargo build` will re-fetch the index from Repsy automatically.

If you do authenticate, you do not have to repeat token setup on every command, but `$HOME/.cargo/config.toml` is still required for registry resolution.

You can now install any crate from the registry. Please run:

```bash
cargo add <crate-name> --registry repsy
```

Or define the dependency directly in `Cargo.toml`:

```toml
[dependencies]
<crate-name> = { version = "<version>", registry = "repsy" }
```

That is all! If you have completed all required steps as described, Cargo will install your crate from your registry successfully.

{{< product "os" >}}
A crate with a binary target is installed with `cargo install`:

```bash
cargo install <crate-name> --registry repsy
```

`https://<your-repsy-host>` stands for the address of the package protocol port of your Repsy Open Source instance, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). A deploy token with the **Read Only** access type is enough to install: see [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/). The tutorial [Publishing and Using Crates with Cargo](../publishing-and-using-crates-with-cargo/) covers dependencies, `cargo install`, `cargo search` and the errors you may meet.
{{< /product >}}
