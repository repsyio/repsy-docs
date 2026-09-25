+++
title = "Installing a NuGet Package"
weight = 430
description = "Add a NuGet source to NuGet.Config, store credentials for private repositories and install a package with the .NET CLI."
+++

When you create a repository, it will be private by default. Before you install a package from a private repository, you first need to configure credentials as seen in the previous page. If your repository is public, you can skip the credentials part, but you must still add the source configuration.

{{< product "os" >}}Public or private is set per repository, see [Creating a Private NuGet Repository](../creating-a-private-nuget-repository/). A private repository needs a login to be read, and a public one can be read without credentials.{{< /product >}}

{{< steps >}}
### Configure your NuGet source

Add the Repsy source to `NuGet.Config` in your project or solution root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" />
  </packageSources>
</configuration>
```

**Note:** If your repository is **public** and you are **only installing packages**, you do not need to configure credentials.

{{< product "os" >}}Replace `<repo-name>` with the name of your repository. `https://<your-repsy-host>` stands for the address of the package protocol port of your Repsy Open Source instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). There is no username in the address.

NuGet only accepts an `https://` source by default. When your instance is served over plain HTTP, add `allowInsecureConnections="true"` to the source, otherwise the .NET 10 SDK stops with error `NU1302` (the .NET 8 SDK only warns with `NU1803`):

```xml
<add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" allowInsecureConnections="true" />
```
{{< /product >}}

### Store credentials (private repositories only)

Add credentials to `~/.nuget/NuGet/NuGet.Config` (Linux/Mac) or `%appdata%\NuGet\NuGet.Config` (Windows):

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

{{< product "os" >}}Use your username and password, or a [deploy token](../../getting-started/creating-a-deploy-token/) in place of the password: the username can be any value, and a **Read Only** token is enough to install.{{< /product >}}

### Install the package

**Using .NET CLI:**

{{< product "cloud" >}}
```bash
dotnet add package MyPackage --version 1.0.0 --source repsy
```
{{< /product >}}

{{< product "os" >}}
```bash
dotnet add package MyPackage --version 1.0.0
```

`dotnet` looks the package up in every source of your configuration, so the `repsy` source needs no `--source`. The value of `--source` in `dotnet add package` and `dotnet restore` is a URL or a folder, not the name of a source: `--source repsy` fails with `NU1301: The local source '...' doesn't exist.` Use the URL of the service index, `--source {{% repo-url %}}/<repo-name>/v3/index.json`, if you want to name the source in the command.
{{< /product >}}

**Using PackageReference in your `.csproj`:**

```xml
<ItemGroup>
  <PackageReference Include="MyPackage" Version="1.0.0" />
</ItemGroup>
```

Then restore:

```bash
dotnet restore
```

**Using Package Manager Console (Visual Studio):**

```powershell
Install-Package MyPackage -Version 1.0.0 -Source repsy
```

That is all! If you have completed all required steps as described, the .NET tooling will install your package from your Repsy repository successfully.

{{< /steps >}}

**Tip:** NuGet caches packages locally. If you encounter stale data after publishing a new version, clear the local cache:

```bash
dotnet nuget locals all --clear
```

{{< product "os" >}}
For the full tutorial, with `dotnet restore`, version ranges, unlisted versions and the errors you may see, read [Publishing and Restoring NuGet Packages with the dotnet CLI](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/).
{{< /product >}}
