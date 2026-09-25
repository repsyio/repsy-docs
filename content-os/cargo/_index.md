+++
title = "Cargo"
chapter = true
weight = 700
description = "Guides for hosting Cargo registries: create one, publish and install crates, yank versions and use the registry in CI."
+++

# Cargo

This documentation contains a user guide and samples regarding the use of private and public Cargo registries in Repsy Open Source. A Cargo repository is a registry for Rust crates. It serves the sparse registry protocol, so `cargo` publishes, resolves, downloads, yanks and searches crates without any extra tool.

The address of the registry index is the address of your instance's repository port followed by the name of the repository, prefixed with `sparse+` and ending with a slash: `sparse+{{% repo-url %}}/<repo-name>/`. There is no username in it. Cargo sends one token, which is a [deploy token](../getting-started/creating-a-deploy-token/).

### Getting Started

- [Creating a Private Cargo Registry](creating-a-private-cargo-registry/): find or create a repository and get your deploy token.
- [Publishing a Cargo Crate](publishing-a-cargo-crate/) and [Installing a Cargo Crate from Registry](installing-a-cargo-crate/): the configuration, `cargo login`, `cargo publish` and `cargo add` in short.

### Tutorials

- [Publishing and Using Crates with Cargo](publishing-and-using-crates-with-cargo/): a complete crate from `cargo new` to a dependency in another project, `cargo install`, `cargo search`, what the web UI shows and the errors you may meet.
- [Yanking and Un-yanking Crates](yanking-and-un-yanking-crates/): withdraw a version from new dependency resolution and bring it back.
- [Cargo in CI](cargo-in-ci/): give a pipeline a token through an environment variable and publish from it.
