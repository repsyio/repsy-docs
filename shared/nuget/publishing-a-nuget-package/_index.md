+++
title = "Publishing a NuGet Package"
weight = 420
description = "Create a .NET class library, add the source to NuGet.Config, store your credentials, then pack and push the NuGet package."
+++

{{< product "cloud" >}}You have registered and created a repository on [Repsy](https://repsy.io/).{{< /product >}}{{< product "os" >}}You have created a NuGet repository on your Repsy Open Source instance, see [Creating a Private NuGet Repository](../creating-a-private-nuget-repository/).{{< /product >}} You are now ready to publish NuGet packages to your repository.

{{< steps >}}
### Create a .NET project

To create a class library that can be packed as a NuGet package, use the .NET CLI:

```bash
dotnet new classlib -n MyPackage
cd MyPackage
```

If this command is executed successfully, the .NET CLI will generate a project with a `.csproj` file. Make sure the project metadata in the `.csproj` is filled in before packing:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <PackageId>MyPackage</PackageId>
    <Version>1.0.0</Version>
    <Authors>Your Name</Authors>
    <Description>A sample NuGet package published to Repsy.</Description>
  </PropertyGroup>
</Project>
```

### Configure your NuGet source

Add the Repsy source to `NuGet.Config` in your project or solution root. This file is safe to commit to version control because it contains only the source URL, not credentials.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" />
  </packageSources>
</configuration>
```

{{< product "cloud" >}}Replace `<username>` and `<repo-name>` with your actual values.{{< /product >}}{{< product "os" >}}Replace `<repo-name>` with the name of your repository. `https://<your-repsy-host>` stands for the address of the package protocol port of your Repsy Open Source instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). There is no username in the address.

NuGet only accepts an `https://` source by default. When your instance is served over plain HTTP, add `allowInsecureConnections="true"` to the source:

```xml
<add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" allowInsecureConnections="true" />
```
{{< /product >}}

### Store credentials in user-level config

Store your credentials in `~/.nuget/NuGet/NuGet.Config` (Linux/Mac) or `%appdata%\NuGet\NuGet.Config` (Windows). This file is **not** committed to version control.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSourceCredentials>
    <repsy>
      <add key="Username" value="MY REPSY USERNAME" />
      <add key="ClearTextPassword" value="MY REPSY PASSWORD OR DEPLOY TOKEN" />
    </repsy>
  </packageSourceCredentials>
</configuration>
```

**Tip:** For CI/CD pipelines, use a [Deploy Token](../../getting-started/creating-a-deploy-token/) instead of your account password.

{{< product "os" >}}Use the username and password you sign in to the web UI with, or a deploy token in place of the password. Repsy checks only the token, so the username can be any value. A token has to be **Read/Write** to publish.{{< /product >}}

### Pack and publish

Build and pack your project:

```bash
dotnet pack --configuration Release
```

Then push the generated `.nupkg` file to Repsy:

```bash
dotnet nuget push ./bin/Release/*.nupkg --source repsy --api-key any
```

{{< product "cloud" >}}The `--api-key` flag is required by the NuGet CLI but not used for authentication — credentials from your `NuGet.Config` are used instead. You can pass any non-empty value.{{< /product >}}{{< product "os" >}}When your credentials are in `NuGet.Config`, the client authenticates with them and the value of `--api-key` does not matter; if you leave the flag out, `dotnet` warns that no API key was provided and pushes anyway. Without credentials in a configuration file, pass a **Read/Write** [deploy token](../../getting-started/creating-a-deploy-token/) as the API key: `--api-key <deploy-token>`. An account password is refused there with `401`.{{< /product >}}

Congratulations, you have created and published a NuGet package to your repository! You can now install your package into any .NET project.
{{< /steps >}}

{{< product "os" >}}
### Check the Result

Open your NuGet repository in the web UI to see the package and its versions. The **Configure** button of the repository opens a dialog with the source, the credentials and the push and install commands, filled in with the address of your repository, see [Creating a Private NuGet Repository](../creating-a-private-nuget-repository/#the-configure-dialog).

If the push is refused, see [Publishing and Restoring NuGet Packages with the dotnet CLI](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#troubleshooting). To install the package, see [Installing a NuGet Package](../installing-a-nuget-package/).
{{< /product >}}
