+++
title = "npm"
chapter = true
weight = 500
+++

# npm

Repsy Open Source hosts private and public npm registries. A registry is a repository of the type npm: it takes packages from `npm publish` and serves them to `npm install`. It speaks the npm registry protocol, so it works with npm and with the package managers that build on it: Yarn (classic and Berry), pnpm and Bun.

The address of a registry is the repository address of your instance, the name of the repository and a slash: `{{% repo-url %}}/<repo-name>/`. There is no username in the address. `<your-repsy-host>` stands for the host and port of your instance, see [Ports and Repository URLs](../getting-started/ports-and-repository-urls/). On a local instance with the default settings, the address of the default `npm` repository is `http://localhost:9090/npm/`.

## Getting Started

- [Creating a Private npm Registry](creating-a-private-npm-registry/): find or create a repository and get your credentials.
- [Creating and Publishing an npm Package](publishing-an-npm-package/): publish a first package with npm.
- [Installing an npm Package from Registry](installing-an-npm-package/): install it in a project.
- [Authenticating with npm](authenticating-with-npm/): `npm login`, deploy tokens in `.npmrc`, scoped registries, checking the setup and using Repsy in CI.

## Other Package Managers

- [Using Yarn](using-yarn/): Yarn classic (1.x), which reads `.npmrc`, and Yarn Berry (2 and later), which reads `.yarnrc.yml`.
- [Using pnpm](using-pnpm/)
- [Using Bun](using-bun/): `bunfig.toml` and `.npmrc`.

## Managing Packages

- [Managing npm Packages](managing-npm-packages/): dist-tags, deprecating and unpublishing versions, searching a registry, `npm audit` and logging out.

## Good to Know

- A registry accepts scoped packages such as `@foo/bar` and unscoped ones.
- Repsy Open Source does not proxy or mirror npmjs.org. A project that uses a Repsy registry as its only registry can only install what that registry holds. Route the scopes of your own packages to Repsy and leave everything else on npmjs.org.
- Repsy does not support npm's web login. The classic login with a username and a password, and a deploy token in `.npmrc`, both work.
- These pages were checked with npm 11, Yarn 1.22 and 4.18, pnpm 12.6 and Bun 1.3.
