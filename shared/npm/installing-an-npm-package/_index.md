+++
title = "Installing an npm Package from Registry"
weight = 530
description = "Install an npm package from a registry by routing its scope to the registry, and log in first when the registry is private."
+++

When you create a registry, it will be private by default. Before you install a package from a private registry, you first need to authenticate as seen in the previous page. If your registry is public, you can skip the authentication part, but you must still indicate the scoped packages -with the registry information- that you want to install. Therefore,  you need to set npm configuration as follows:

{{< product "cloud" >}}
```bash
npm config set @foo:registry {{% repo-url %}}/<repo-name>
```
{{< /product >}}

{{< product "os" >}}
```bash
npm config set @foo:registry {{% repo-url %}}/<repo-name>/
```

`<your-repsy-host>` stands for the host and port of your instance, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).
{{< /product >}}

If you do authenticate, you don’t have to set this configuration since the `npm login` command will automatically do it for you.

You can now install any package from the registry into your project’s base directory that includes a package.json file. Just do not forget to provide the scope name of the package. Please run:

```bash
npm install @foo/<package-name>
```

That’s all! If you have completed all required steps as described, npm will install your package from your registry into your project successfully.

{{< product "os" >}}
### Unscoped Packages

An unscoped package has no scope that npm could route to a registry. To install one from Repsy, make the repository the main registry:

```bash
npm config set registry {{% repo-url %}}/<repo-name>/
```

Repsy Open Source does not proxy or mirror npmjs.org, so npm can then only install what this repository holds. Anything from npmjs.org, including the dependencies of your own packages, is not found. Publishing your packages under a scope and routing only that scope to Repsy avoids this.

### Lockfiles

`package-lock.json` records the address of every tarball together with its integrity checksum. The addresses are the ones Repsy serves: they start with the `REPO_BASE_URL` of your instance, or with the address of the request when that is not set, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/#repository-urls). A repository accepts a version that is published again with new content as long as its **Package Override** setting is on. `npm ci` from a lockfile that recorded the old content then fails with an integrity error, so publish a new version instead of overwriting one.
{{< /product >}}
