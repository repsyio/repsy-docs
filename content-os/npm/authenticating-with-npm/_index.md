+++
title = "Authenticating with npm"
weight = 560
description = "Give npm the registry address and a credential with npm login or a deploy token in .npmrc, route scopes and check the setup."
+++

# Authenticating with npm

npm needs two things to talk to a Repsy registry: the address of the registry, and a credential. This page shows the two ways to give npm a credential, how to route packages to the registry, how to check the setup and how to use it in CI. The `.npmrc` file described here is also read by Yarn classic, pnpm and Bun, see [Using Yarn](../using-yarn/), [Using pnpm](../using-pnpm/) and [Using Bun](../using-bun/).

## What Needs Credentials

| What you do | Private registry | Public registry |
| --- | --- | --- |
| Install, `npm view`, `npm ping`, `npm search` | A credential | None |
| `npm whoami` | A credential | A credential |
| Publish, `npm dist-tag`, `npm deprecate` | A credential with write access | A credential with write access |
| `npm unpublish` | The username and password of an `ADMIN` account (a deploy token never can) | The username and password of an `ADMIN` account (a deploy token never can) |

A credential is one of these:

- **A user account:** the username and the password of an account of your instance.
- **A deploy token:** a token of that repository. A **Read Only** token can install but is refused for everything that changes the registry. No deploy token can unpublish, because that removes stored files. The username that goes with it can be any value. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).
- **A login token:** the token that `npm login` receives from Repsy for your username and password (or for a deploy token). It is valid for 90 days, and `npm logout` revokes it.

## Log In with npm login

```bash
npm login --scope foo --registry {{% repo-url %}}/<repo-name>/
```

npm asks for a username and a password (depending on its version it may also ask for an email address). Enter the username and password of your account, or any username and a deploy token as the password. If the login succeeds, npm saves the token it received in your user `.npmrc` file (`~/.npmrc`), and with `--scope` it also adds the line that sends that scope to the registry:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=<login-token>
```

Without `--scope` npm saves only the token. Then pass `--registry` to every command, or set the registry yourself as described below.

Repsy does not support npm's web login (the sign-in in a browser): its endpoint answers `404 Not Found`. npm 11 falls back to the prompts on its own. Other clients may not: `pnpm login` stops with an error when it has no terminal to prompt in. If a login command does not work, run `npm login`, or put a deploy token into `.npmrc` as shown next.

## Use a Deploy Token in .npmrc

You can skip the login and put a deploy token into the `.npmrc` file directly. This is the way to go in scripts and in CI. Add this line to `~/.npmrc` (for you) or to the `.npmrc` of a project:

```ini
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=<deploy-token>
```

npm sends the token only to this registry, as a `Bearer` credential.

## Scoped Registries and the Main Registry

To use Repsy for the packages of one scope, and npmjs.org for everything else, route the scope to the registry:

```bash
npm config set @foo:registry {{% repo-url %}}/<repo-name>/
```

This writes `@foo:registry=...` into `~/.npmrc`. Together with the token line above, this is the whole configuration:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=<deploy-token>
```

You can send several scopes to several repositories. Give every repository its own `_authToken` line: npm sends each token only to its own registry.

To use a Repsy registry as the main registry, set `registry` instead. Every package that npm installs then comes from this registry, and Repsy does not proxy npmjs.org:

```bash
npm config set registry {{% repo-url %}}/<repo-name>/
```

{{% notice warning %}}
Write the address of the registry with the slash at the end, both in `registry` or `@foo:registry` and in the key of the `_authToken` line. npm matches the address against the key of the token. With npm 11.19, an address without the slash did not find the key `//<your-repsy-host>/<repo-name>/:_authToken`, so npm sent no credential and stopped with `ENEEDAUTH`. Yarn classic is stricter: its key has to name the repository, and a key that names only the host does not match.
{{% /notice %}}

## Check the Setup

```bash
npm ping --registry {{% repo-url %}}/<repo-name>/
npm whoami --registry {{% repo-url %}}/<repo-name>/
```

- `npm ping` prints `PONG` if the registry answers. On a private registry it needs a credential with read access.
- `npm whoami` prints the name that your credential resolves to: your username for a password or a login token of your account, and the generated name of the token (it starts with `repsy-deploy-token-`) for a deploy token. It always needs a credential, also on a public registry. Give it `--registry`: with only `--scope` npm 11 stopped with `ENEEDAUTH`.

## Log Out

```bash
npm logout --registry {{% repo-url %}}/<repo-name>/
```

`npm logout` asks Repsy to revoke the login token and removes it from `.npmrc`. Repsy refuses the token from then on, also if somebody copied it. A deploy token is different: Repsy answers `403 Forbidden` and `npm logout` fails, because you revoke a deploy token in the web UI, in the **Deploy Tokens** section of the repository settings.

## Use Repsy in CI

1. Create a deploy token for the repository: **Read/Write** for a job that publishes, **Read Only** for a job that only installs.
2. Store the token as a secret of your CI system and expose it to the job as an environment variable, for example `NPM_TOKEN`.
3. Commit an `.npmrc` file that refers to the variable instead of the token:

```ini
@foo:registry={{% repo-url %}}/<repo-name>/
//{{% repo-url scheme="false" %}}/<repo-name>/:_authToken=${NPM_TOKEN}
```

npm, Yarn classic, pnpm and Bun replace `${NPM_TOKEN}` with the value of the variable when they read the file. Yarn Berry has its own file with the same syntax, see [Using Yarn](../using-yarn/#yarn-berry-2-and-later).

```bash
npm ci
npm publish
```

A job that sends a token Repsy no longer knows (a token that was revoked or rotated, or one of another repository) counts as failed logins. After 20 failed checks within 60 seconds Repsy answers a client with `429 Too Many Requests` until the window ends, and one `npm install` sends many requests at once. Replace the secret in the job as soon as you rotate or revoke a token. See [Configuration Reference](../../installation/configuration-reference/#authentication) for the settings of the limit.

## Troubleshooting

| What you see | Usual cause |
| --- | --- |
| `ENEEDAUTH` ("This command requires you to be logged in") | npm has no credential for the registry address: you did not log in, the key of the `_authToken` line does not match the address (a missing slash at the end, another host or another repository), or the `.npmrc` file is not the one npm reads. |
| `E401` ("Unable to authenticate, your authentication token seems to be invalid") | Repsy refused the credential: the token is wrong, expired, revoked or rotated, it belongs to another repository, or it is a **Read Only** deploy token used for a change such as `npm publish`. It is also what you get when the variable in `${NPM_TOKEN}` is not set in CI. |
| `E403` on `npm publish` (`403 Forbidden - PUT ...`) | The version already exists and the repository does not accept a version that is published again (the **Package Override** setting is off). Publish a new version. |
| `You cannot publish over the previously published versions` | npm's own check, made before it sends anything. Publish a new version. |
| `E404` when installing a package that you published | npm asked npmjs.org: the scope of the package is not routed to Repsy, so `@foo:registry` is missing. |
| `429 Too Many Requests` | Your address made too many failed credential checks. npm retries with a backoff and then fails. Fix the credential and wait for the time in the `Retry-After` header. |
