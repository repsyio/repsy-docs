+++
title = "Cargo in CI"
weight = 780
description = "Use a deploy token in CI to build with crates from the registry and to publish crates, without an interactive cargo login."
+++

A CI job that builds against your Repsy Open Source Cargo repository, or publishes a crate to it, needs two things: a token that is safe to keep in the CI system, and a way to tell `cargo` about the registry without an interactive `cargo login`. This page covers both, with a GitHub Actions example that works the same in any CI system that runs shell commands.

### Use a Deploy Token

Give the job a [deploy token](../creating-a-private-cargo-registry/#get-your-token) instead of anything that belongs to a person:

- A token belongs to one repository, so a leaked token exposes that repository only, not every repository of the instance.
- A **Read Only** token is enough for jobs that build, test or lint projects which depend on your crates. Use a **Read/Write** token only in the job that publishes or yanks.
- A token expires at most 365 days after you create it. Replace it before then, and update the secret of the CI system.
- Cargo sends the token as it is. It has no username, and the password of a user account does not work in its place.

Store the token as a secret of your CI system, for example `REPSY_DEPLOY_TOKEN`, and never write it into a file that you commit.

### Pass the Token in the Environment

Cargo reads the token of a registry from the environment variable `CARGO_REGISTRIES_<registry-name>_TOKEN`, where the registry name is written in upper case, with `-` as `_`. For a registry called `repsy` it is `CARGO_REGISTRIES_REPSY_TOKEN`, and for `my-repsy` it is `CARGO_REGISTRIES_MY_REPSY_TOKEN`. With the variable set, no `cargo login` is needed, and the token is not written to disk. The variable wins over a token saved by `cargo login`.

The registry itself can come from a `.cargo/config.toml` that you commit to the repository. It holds an address and no secret:

```toml
[registries.repsy]
index = "sparse+{{% repo-url %}}/<repo-name>/"

[registry]
global-credential-providers = ["cargo:token"]
```

`https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).

If you would rather keep the configuration out of the repository, Cargo reads the same settings from environment variables, and a job needs nothing else:

| Variable | Value |
| --- | --- |
| `CARGO_REGISTRIES_REPSY_INDEX` | `sparse+{{% repo-url %}}/<repo-name>/` |
| `CARGO_REGISTRIES_REPSY_TOKEN` | the deploy token |
| `CARGO_REGISTRY_GLOBAL_CREDENTIAL_PROVIDERS` | `cargo:token` |

The `repsy` in the names of the first two is the name that the project uses in `registry = "repsy"` and `--registry repsy`.

### Build with Crates from the Repository

Set the variables and run Cargo as usual. Cargo downloads the crates from Repsy, and the other dependencies from crates.io. If you commit `Cargo.lock`, use `--locked` to make the job fail when it is out of date, instead of resolving new versions:

```bash
export CARGO_REGISTRIES_REPSY_TOKEN="$REPSY_DEPLOY_TOKEN"
cargo build --locked
```

A locked build keeps working when a version in `Cargo.lock` was [yanked](../yanking-and-un-yanking-crates/).

### Publish from a Pipeline

A complete GitHub Actions job that publishes the crate when you push a version tag. It uses a **Read/Write** token and assumes that the runner has a Rust toolchain, as the hosted Ubuntu runners of GitHub do:

```yaml
name: publish-crate
on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      CARGO_REGISTRIES_REPSY_INDEX: "sparse+{{% repo-url %}}/<repo-name>/"
      CARGO_REGISTRIES_REPSY_TOKEN: ${{ secrets.REPSY_DEPLOY_TOKEN }}
      CARGO_REGISTRY_GLOBAL_CREDENTIAL_PROVIDERS: cargo:token
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: cargo test
      - name: Publish
        run: cargo publish --registry repsy
```

The checkout is clean, so `cargo publish` does not need `--allow-dirty`. The job runs on the tag, so raise the `version` in `Cargo.toml` before you tag: a version can be published only once, and `cargo publish` fails the job (exit code `101`) with `crate <crate-name>@<version> already exists on repsy index` if you forget. The same exit code and a `401` in the message tell you that the token is wrong, expired, or **Read Only**.

A workspace with several crates has to publish the crates that others depend on first. Publish the members one by one, in that order, with `cargo publish --registry repsy --package <crate-name>`. `cargo publish` waits until the registry lists a crate, so the next member can depend on it right away.

The runner reaches the instance over the network, so the address must be one that the runner can reach. Use HTTPS on a shared instance: the token is sent in the `Authorization` header.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `no token found for repsy` | The variable is empty or has another name. The name follows the registry name: upper case, `-` as `_`. |
| `authenticated registries require a credential-provider to be configured` | The registry is private and the job has no `global-credential-providers = ["cargo:token"]`, neither in a configuration file nor in `CARGO_REGISTRY_GLOBAL_CREDENTIAL_PROVIDERS`. |
| `401` in a build or a publish | The token is wrong, expired, revoked or rotated, it belongs to another repository, or it is **Read Only** and the job publishes. |
| `crate <crate-name>@<version> already exists` | The version was published before. Publish a new version. |
| A dependency is not found although it is in the repository | The `Cargo.toml` that names it has no `registry = "repsy"`, so Cargo asked crates.io. |
