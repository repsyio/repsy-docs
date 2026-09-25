+++
title = "Using Bun"
weight = 580
description = "Configure Bun with bunfig.toml or .npmrc to install packages from the registry and publish to it with a deploy token."
+++

# Using Bun

Bun installs from Repsy with the settings of `bunfig.toml`, or with an `.npmrc` file, and it publishes with its own `bun publish`. It authenticates in a way that differs from npm in one respect that matters: `bun publish` sends only a token, never a password. This page was checked with Bun 1.3.14.

## Before You Start

- An npm repository on your Repsy Open Source instance, see [Creating a Private npm Registry](../creating-a-private-npm-registry/). Its address is `{{% repo-url %}}/<repo-name>/`, with the slash at the end. `<your-repsy-host>` stands for the host and port of your instance.
- A [deploy token](../../getting-started/creating-a-deploy-token/) of the repository: **Read/Write** to publish, **Read Only** is enough to install.

## Configure

Bun reads its registries from `bunfig.toml`, in the project or as `~/.bunfig.toml`. Route a scope to Repsy in `[install.scopes]` (the scope is written with the `@`):

```toml
[install.scopes]
"@foo" = { url = "{{% repo-url %}}/<repo-name>/", token = "<deploy-token>" }
```

To use the registry for every package, set `registry` in `[install]` instead, but keep in mind that Repsy does not proxy npmjs.org:

```toml
[install]
registry = { url = "{{% repo-url %}}/<repo-name>/", token = "<deploy-token>" }
```

Bun sends `token` as a `Bearer` credential. For a user account, write `username` and `password` in place of `token`, which Bun sends as `Basic`. In CI, refer to an environment variable in place of the token: `token = "$NPM_TOKEN"`.

Bun also reads `.npmrc` (`registry=`, `@foo:registry=` and the `_authToken` lines from [Authenticating with npm](../authenticating-with-npm/)) and sends each token only to its own repository. `.npmrc` alone is enough for every command on this page.

{{% notice warning %}}
`bun publish` sends only a token. A `username` and `password` in `bunfig.toml`, or an `_auth` line in `.npmrc`, stop it with `missing authentication (run bunx npm login)` before it sends anything, while `bun add` accepts the same settings. For publishing, put a deploy token or a login token into `.npmrc`:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=<deploy-token>
```

If you only have a password, run `bunx npm login --scope foo --registry {{% repo-url %}}/<repo-name>/` once: it saves a login token in `.npmrc`. Do not enter your password as `_authToken`: Repsy refuses it with `401`.
{{% /notice %}}

## Install

```bash
bun add @foo/<package-name>
bun install --frozen-lockfile
```

`bun.lock` records the address of the tarball and its checksum. Bun sends the credential of the registry to whatever host the tarball address names, also to another one. Repsy always names its own address there, taken from `REPO_BASE_URL`, so set it to the address that your clients use, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/#repository-urls).

## Publish

```bash
bun publish
```

`bun publish` packs the current directory and publishes it. Useful options:

- `--tag <tag>` publishes under a tag.
- `--access public` is accepted for a scoped package, and so is leaving it out: whether a package is public is decided by the visibility of the repository.
- `--tolerate-republish` makes Bun ask the registry first and skip a version that already exists ("Registry already knows about version ...; skipping"). Without it Bun sends the version again, which Repsy accepts while **Package Override** of the repository is on and refuses with `403` otherwise.
- In a workspace, run `bun install` first: without a lockfile Bun cannot resolve `workspace:` ranges and refuses to publish. Bun then replaces `workspace:` and `catalog:` ranges with real versions.

## Other Commands

- `bun pm whoami` prints the name of your credential. It needs a `package.json` in the directory and a credential for the default registry: with only a scope configured in `bunfig.toml`, it stops with `missing authentication`, and it never asks without a credential, not even on a public registry.
- `bun info <package-name>` shows the metadata of a package. `bun info <package-name> dist-tags` shows the dist-tags, and `bun info <package-name>@<version> deprecated` the deprecation message of a version. `bun add` prints nothing about a deprecated version.
- `bun audit` audits the installed packages, see [Managing npm Packages](../managing-npm-packages/#auditing-an-installation). It prints `{}` with `--json` when nothing is found.
- Bun has no `dist-tag`, `deprecate`, `unpublish`, `ping`, `search` and `logout` command. Use npm for them, see [Managing npm Packages](../managing-npm-packages/).

## Check the Result

Open the repository in the web UI: the package is listed under its scope, with its versions and dist-tags.
