+++
title = "Creating and Publishing an NPM Package"
weight = 32
+++

You have registered and created a registry on [Repsy](https://repsy.io/). You are now ready to publish packages to your registry.

To create an npm package, you can use npm cli’s `init` command. Since Repsy only supports [scoped](https://docs.npmjs.com/cli/v7/using-npm/scope) packages, package names must include a scope name like `@foo/foo`. You can make it by providing the `--scope` parameter to the command as follows:

```bash
npm init --scope foo -y
```

If this command is executed successfully, a `package.json` file will be generated automatically. This file is required to publish your packages. You can learn more about the file of package.json [here](https://docs.npmjs.com/cli/v7/configuring-npm/package-json).

You currently have an empty npm package. The only missing part is the authentication. In order to successfully publish packages to your `default` registry, you must authenticate to your registries separately for each different scope. 

To authenticate, you can use the `login` command with the scope name and the registry URL. For the scope `foo`, you can run:

```bash
npm login --scope foo --registry https://repo.repsy.io/npm/<username>/<registryName>
```

This command will ask you username, password, and email address. Please use the same username and password here that you used to register to [Repsy](https://repsy.io/), but the email address may vary. If this command is executed successfully, you will be authenticated to the registry and be ready to publish your package. As a final step, please run the following command:

```bash
npm publish
```

With this command npm will pack and publish the package to your `default` registry.

Congratulations, you have created and published a package to your registry! You can now install your package into any project you want and use safely.


