+++
title = "Installing an NPM Package from Registry"
weight = 3
+++

When you create a registry, it will be private by default. Before you install a package from a private registry, you first need to authenticate as seen in the previous page. If your registry is public, you can skip the authentication part, but you must still indicate the scoped packages -with the registry information- that you want to install. Therefore,  you need to set npm configuration as follows:

```bash
npm config set @foo:registry https://repo.repsy.io/npm/<username>/<registryName>
```

If you do authenticate, you don’t have to set this configuration since the `npm login` command will automatically do it for you.

You can now install any package from the registry into your project’s base directory that includes a package.json file. Just do not forget to provide the scope name of the package. Please run:

```bash
npm install @foo/foo
```

That’s all! If you have completed all required steps as described, npm will install your package from your registry into your project successfully.

