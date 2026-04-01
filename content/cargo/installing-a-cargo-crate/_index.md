+++
title = "Installing a Cargo Crate from Registry"
weight = 63
+++

When you create a registry, it will be private by default. Before you install a crate from a private registry, you first need to authenticate as seen in the previous page. If your registry is public, you can skip the authentication part, but you must still indicate the registry that you want to use.

Therefore, you need to set Cargo configuration as follows:

```toml
[registries.repsy]
index = "sparse+https://repo.repsy.io/<username>/<registryName>/index/"
```

If you do authenticate, you do not have to repeat token setup on every command, but `.cargo/config.toml` is still required for registry resolution.

You can now install any crate from the registry. Please run:

```bash
cargo add <crate_name> --registry repsy
```

Or define the dependency directly in `Cargo.toml`:

```toml
[dependencies]
<crate_name> = { version = "<version>", registry = "repsy" }
```

That is all! If you have completed all required steps as described, Cargo will install your crate from your registry successfully.
