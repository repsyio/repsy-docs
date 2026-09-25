+++
title = "Using Yarn"
weight = 570
+++

# Using Yarn

Yarn comes in two generations that are configured in different ways. **Yarn classic** (version 1.x) reads its registry and credentials from `.npmrc`, the file that npm uses. **Yarn Berry** (version 2 and later) reads `.yarnrc.yml` and ignores `.npmrc`. Run `yarn --version` to see which one you have: a version that starts with `1` is Yarn classic. This page was checked with Yarn 1.22.22 and Yarn 4.18.1.

## Before You Start

- An npm repository on your Repsy Open Source instance, see [Creating a Private npm Registry](../creating-a-private-npm-registry/). Its address is `{{% repo-url %}}/<repo-name>/`, with the slash at the end. `<your-repsy-host>` stands for the host and port of your instance.
- A [deploy token](../../getting-started/creating-a-deploy-token/) of the repository: **Read/Write** to publish, **Read Only** is enough to install. The username that goes with it can be any value.

## Yarn Classic (1.x)

### Configure

Put this into `~/.npmrc`, or into the `.npmrc` of the project:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=<deploy-token>
always-auth=true
```

- `@foo:registry` sends the scope `@foo` to Repsy. To use the registry for every package, set `registry=` instead, but keep in mind that Repsy does not proxy npmjs.org.
- Yarn classic matches the key of the token against the exact address of the registry. The key has to name the repository (`//<your-repsy-host>/<repo-name>/`). A key that names only the host, or another repository, sends no credential.
- `always-auth=true` makes Yarn send the credential when it asks a private registry for an **unscoped** package. Without it Yarn sends none, the private registry answers `401 Unauthorized`, and Yarn reports it as `Couldn't find package "<package-name>" on the "npm" registry`, the same message as for a package that does not exist. A scoped package works without it. Add it whenever you use a private registry as the main registry.
- A `.yarnrc` file is not needed. Do not use `--no-default-rc`: it makes Yarn ignore `.npmrc`, credentials included.
- `yarn login` only works interactively, so put the token into `.npmrc`. In CI, refer to an environment variable instead of the token, see [Authenticating with npm](../authenticating-with-npm/#use-repsy-in-ci).

### Install

```bash
yarn add @foo/<package-name>
```

`yarn.lock` records the address Repsy serves the package from and its checksums. `yarn install --frozen-lockfile` installs from it.

### Publish

```bash
yarn publish --non-interactive --no-git-tag-version
```

`yarn publish` packs the current directory and publishes it. It asks for a new version; `--new-version <version>` gives one, and `--non-interactive` publishes the version of `package.json`. `--no-git-tag-version` keeps Yarn from creating a git commit and tag.

{{% notice warning %}}
`yarn publish` prints `Published.` and exits with `0` when Repsy refuses the request with `401 Unauthorized`, for example for a **Read Only** token or a wrong token. It only fails on other refusals, such as `403 Forbidden` for a version that already exists. Check the result, for example with `yarn info @foo/<package-name> version` or in the web UI.
{{% /notice %}}

### Other Commands

`yarn tag list <package-name>`, `yarn tag add <package-name>@<version> <tag>` and `yarn tag remove <package-name> <tag>` manage dist-tags (the spellings `ls` and `rm` print a deprecation warning), and `yarn info` shows the metadata of a package. Yarn classic has no `deprecate`, `unpublish`, `whoami`, `ping` or `search` command. Use npm for them, see [Managing npm Packages](../managing-npm-packages/). `yarn audit` always asks `registry.yarnpkg.com`, so it never reaches Repsy.

## Yarn Berry (2 and Later)

### Configure

Create `.yarnrc.yml` in the project (or `~/.yarnrc.yml`):

```yaml
npmScopes:
  foo:
    npmRegistryServer: "{{% repo-url %}}/<repo-name>/"
    npmPublishRegistry: "{{% repo-url %}}/<repo-name>/"
    npmAuthToken: "<deploy-token>"
```

- The name of the scope is written without the `@`.
- `npmRegistryServer` is where the scope is installed from and `npmPublishRegistry` where it is published to. Without `npmPublishRegistry`, `yarn npm publish` of a scoped package goes to `registry.yarnpkg.com`.
- `npmAuthToken` sends the token as a `Bearer` credential. To use a user account instead, set `npmAuthIdent: "<username>:<password>"`, which Yarn sends as `Basic`.
- Yarn Berry refuses a plain `http://` registry unless its host is listed in `unsafeHttpWhitelist`, `localhost` included (`YN0081`). A local instance needs:

  ```yaml
  unsafeHttpWhitelist:
    - "localhost"
  ```

- Yarn Berry reads no `.npmrc` file.

To use the registry as the main registry, set the same values at the top level, together with `npmAlwaysAuth`:

```yaml
npmRegistryServer: "{{% repo-url %}}/<repo-name>/"
npmAuthToken: "<deploy-token>"
npmAlwaysAuth: true
```

Without `npmAlwaysAuth: true`, Yarn asks a private registry for an unscoped package without a credential and stops with `YN0041` ("Invalid authentication (as an anonymous user)"). A scoped package works without it.

{{% notice note %}}
Yarn Berry 4 quarantines every version that is younger than one day (`npmMinimalAgeGate` defaults to 1440 minutes). A version that you just published fails to install with `YN0016` ("... quarantined") until it is a day old. This is a policy of Yarn and not of Repsy. Set `npmMinimalAgeGate: 0` (globally, and in the entry of every scope, which does not inherit the global value) to turn it off, or wait.
{{% /notice %}}

In CI, use an environment variable in place of the token: `npmAuthToken: "${NPM_TOKEN}"`.

### Install

```bash
yarn add @foo/<package-name>
```

Plug'n'Play, hardened mode (`enableHardenedMode`) and `yarn install --immutable` work with Repsy.

### Publish

```bash
yarn install
yarn npm publish
```

`yarn npm publish` packs the project itself and needs its install state, so run `yarn install` first. Without it Yarn stops with an internal error that says the package "doesn't seem to be present in your lockfile". `--tag <tag>` publishes under a tag. A version that already exists is sent to Repsy again, which accepts it while **Package Override** of the repository is on; `--tolerate-republish` makes Yarn read the metadata first and skip a version that Repsy already has. In a workspace, `yarn workspaces foreach -A --no-private --topological npm publish` publishes every package and replaces `workspace:` ranges with real versions.

### Other Commands

- `yarn npm tag list <package-name>`, `yarn npm tag add <package-name>@<version> <tag>` and `yarn npm tag remove <package-name> <tag>` manage dist-tags. Yarn itself refuses to remove `latest`.
- `yarn npm whoami` prints the name of your credential. `--scope foo` asks the registry of the scope, and `--publish` the publish registry.
- `yarn npm info <package-name>` shows the metadata of a package, and `yarn npm info <package-name>@<version> -f deprecated` the deprecation message of a version. `yarn add` does not print anything about a deprecated version.
- `yarn npm audit` audits the installed packages, see [Managing npm Packages](../managing-npm-packages/#auditing-an-installation).
- Yarn Berry has no `deprecate`, `unpublish`, `ping` or `search` command. Use npm. `yarn npm login` and `yarn npm logout` were not tested against Repsy: use a deploy token, and revoke it in the web UI.

## Check the Result

Open the repository in the web UI: the package is listed under its scope, with its versions and dist-tags.

## Troubleshooting

| What you see | Usual cause |
| --- | --- |
| Yarn classic: `Couldn't find package "<package-name>" on the "npm" registry` | Repsy answered `401` or `404`. For an unscoped package in a private registry, `always-auth=true` is missing. Otherwise the key of the token does not name the repository, the token is wrong, or the package does not exist. |
| Yarn Berry: `YN0041` "Invalid authentication (as an anonymous user)" | Set `npmAlwaysAuth: true`, or use a scope. |
| Yarn Berry: `YN0035` "Package not found" with the address `registry.yarnpkg.com` | The registry is not configured for this package: an unscoped package needs `npmRegistryServer` at the top level. |
| Yarn Berry: `YN0033` "No authentication configured for request" | The registry the command uses has no credential, for example `yarn npm whoami --publish` when only a scope is configured. |
| Yarn Berry: `YN0081` "Unsafe http requests must be explicitly whitelisted" | Add the host to `unsafeHttpWhitelist`. |
| Yarn Berry: `YN0016` "... quarantined" | The version is younger than `npmMinimalAgeGate`. |
