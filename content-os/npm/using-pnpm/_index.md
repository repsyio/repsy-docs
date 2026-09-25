+++
title = "Using pnpm"
weight = 575
description = "Configure pnpm with .npmrc to install packages from the registry and publish to it with a deploy token."
+++

# Using pnpm

pnpm reads the same `.npmrc` file as npm for the address of the registry and for the credentials, so the configuration is the one from [Authenticating with npm](../authenticating-with-npm/). pnpm runs the registry commands itself. This page was checked with pnpm 12.6.

## Before You Start

- An npm repository on your Repsy Open Source instance, see [Creating a Private npm Registry](../creating-a-private-npm-registry/). Its address is `{{% repo-url %}}/<repo-name>/`, with the slash at the end. `<your-repsy-host>` stands for the host and port of your instance.
- A [deploy token](../../getting-started/creating-a-deploy-token/) of the repository: **Read/Write** to publish, **Read Only** is enough to install. The username that goes with it can be any value.

## Configure

Put this into `~/.npmrc`, or into the `.npmrc` of the project:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=<deploy-token>
```

`@foo:registry` sends the scope `@foo` to Repsy. To use the registry for every package, set `registry=` instead, but keep in mind that Repsy does not proxy npmjs.org. Since pnpm 11, `.npmrc` is only read for the registry and the credentials; the other settings of pnpm go into `pnpm-workspace.yaml` or into `PNPM_CONFIG_*` environment variables. In CI, put `${NPM_TOKEN}` in place of the token, see [Authenticating with npm](../authenticating-with-npm/#use-repsy-in-ci).

## Install

```bash
pnpm add @foo/<package-name>
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` records only the checksum of a package from Repsy, not its address: pnpm builds the address from the registry, the name and the version.

pnpm 11 and later do not install a version that is younger than one day (`minimumReleaseAge`). With `pnpm install --frozen-lockfile`, a version that you published minutes ago can be refused for this reason. This is a policy of pnpm and not of Repsy, which serves the true publish time. Wait, or lower `minimumReleaseAge` in `pnpm-workspace.yaml`.

## Publish

```bash
pnpm publish --no-git-checks
```

`pnpm publish` packs the current directory and publishes it. `--tag <tag>` publishes under a tag, and `--no-git-checks` skips pnpm's check that the git branch is clean and up to date.

In a workspace, `pnpm -r publish` publishes every package that Repsy does not have yet, dependencies first, and replaces `workspace:` ranges (`workspace:^`, `workspace:~` and `workspace:*`) with real versions in the published manifest. Run `pnpm install` once first, otherwise pnpm cannot resolve a `workspace:` range. A second run finds every package in the registry and publishes nothing.

## Other Commands

| Command | What it does |
| --- | --- |
| `pnpm dist-tag ls`, `add` and `rm` | Manage dist-tags, see [Managing npm Packages](../managing-npm-packages/#dist-tags). |
| `pnpm deprecate` and `pnpm undeprecate` | Set and clear the deprecation of a version. pnpm resolves a version range to the newest version that is not deprecated, and an install prints `deprecated <package-name>@<version>` without the message. |
| `pnpm unpublish <package-name>@<version>` | Remove a version. |
| `pnpm view`, `pnpm search`, `pnpm ping` and `pnpm whoami` | Read from the registry. |
| `pnpm audit` | Audit the dependencies, see [Managing npm Packages](../managing-npm-packages/#auditing-an-installation). It needs a `pnpm-lock.yaml`. |
| `pnpm logout` | Revoke a login token. For a deploy token Repsy answers `403 Forbidden` and pnpm fails with `ERR_PNPM_LOGOUT_FAILED`, because you revoke a deploy token in the web UI. |

`pnpm login` does not work against Repsy: it tries npm's web login first, which Repsy does not support, and without a terminal to prompt in it stops with `ERR_PNPM_LOGIN_NON_INTERACTIVE`. Use a deploy token in `.npmrc`, or run `npm login`.

## Check the Result

Open the repository in the web UI: the package is listed under its scope, with its versions and dist-tags.
