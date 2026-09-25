+++
title = "Creating and Publishing an npm Package"
weight = 520
+++

{{< product "cloud" >}}You have registered and created a registry on [Repsy](https://repsy.io/).{{< /product >}}{{< product "os" >}}You have created an npm registry on your Repsy Open Source instance (see [Creating a Private npm Registry](../creating-a-private-npm-registry/)).{{< /product >}} You are now ready to publish packages to your registry.

To create an npm package, you can use npm cli’s `init` command. {{< product "cloud" >}}Since Repsy only supports [scoped](https://docs.npmjs.com/cli/v7/using-npm/scope) packages, package names must include a scope name like `@foo/foo`.{{< /product >}}{{< product "os" >}}Repsy Open Source accepts [scoped](https://docs.npmjs.com/cli/v7/using-npm/scope) packages such as `@foo/foo` as well as unscoped ones. This tutorial uses a scope, so that only the packages of that scope come from Repsy and everything else still comes from npmjs.org.{{< /product >}} You can make it by providing the `--scope` parameter to the command as follows:

```bash
npm init --scope foo -y
```

If this command is executed successfully, a `package.json` file will be generated automatically. This file is required to publish your packages. You can learn more about the file of package.json [here](https://docs.npmjs.com/cli/v7/configuring-npm/package-json).

You currently have an empty npm package. The only missing part is the authentication. {{< product "cloud" >}}In order to successfully publish packages to your `default` registry, you must authenticate to your registries separately for each different scope.{{< /product >}}{{< product "os" >}}Publishing always needs credentials, also to a public registry. You can log in with npm as shown below, or put a deploy token into your `.npmrc` file, see [Authenticating with npm](../authenticating-with-npm/).{{< /product >}}

To authenticate, you can use the `login` command with the scope name and the registry URL. For the scope `foo`, you can run:

{{< product "cloud" >}}
```bash
npm login --scope foo --registry {{% repo-url %}}/<repo-name>
```
{{< /product >}}

{{< product "os" >}}
```bash
npm login --scope foo --registry {{% repo-url %}}/<repo-name>/
```

Write the registry URL with the slash at the end, as the **Configure** dialog of the repository shows it. `<your-repsy-host>` stands for the host and port of your instance. On a local instance with the default settings the URL of the default `npm` repository is `http://localhost:9090/npm/`, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).
{{< /product >}}

{{< product "cloud" >}}This command will ask you username, password, and email address. Please use the same username and password here that you used to register to [Repsy](https://repsy.io/), but the email address may vary.{{< /product >}}{{< product "os" >}}This command asks for a username and a password, and, depending on your npm version, for an email address. Use the username and password you sign in to the web UI with, or any username together with a [deploy token](../../getting-started/creating-a-deploy-token/) of this repository as the password. npm saves the login token that Repsy returns in your `~/.npmrc` file, together with the registry of the scope.{{< /product >}} If this command is executed successfully, you will be authenticated to the registry and be ready to publish your package. As a final step, please run the following command:

```bash
npm publish
```

{{< product "cloud" >}}With this command npm will pack and publish the package to your `default` registry.{{< /product >}}{{< product "os" >}}With this command npm packs the package and publishes it to the registry that is configured for its scope.{{< /product >}}

Congratulations, you have created and published a package to your registry! You can now install your package into any project you want and use safely.

{{< product "os" >}}
### Check the Result

Sign in to the web UI, open **Repositories** and open your npm repository. The package is listed under its scope (`@foo`); an unscoped package is listed under `~`. Open it to see its versions, the `latest` tag and the command to install it. A scoped package needs no `--access public`: who can read it is decided by the visibility of the repository. If publishing fails, see [Troubleshooting](../authenticating-with-npm/#troubleshooting).
{{< /product >}}
