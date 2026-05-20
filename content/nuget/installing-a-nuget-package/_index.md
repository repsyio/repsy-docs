+++
title = "Installing a NuGet Package"
weight = 73
+++

When you create a repository, it will be private by default. Before you install a package from a private repository, you first need to configure credentials as seen in the previous page. If your repository is public, you can skip the credentials part, but you must still add the source configuration.

{{< steps >}}
### Configure your NuGet source

Add the Repsy source to `NuGet.Config` in your project or solution root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="repsy" value="https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}/v3/index.json" />
  </packageSources>
</configuration>
```

**Note:** If your repository is **public** and you are **only installing packages**, you do not need to configure credentials.

### Store credentials (private repositories only)

Add credentials to `~/.nuget/NuGet/NuGet.Config` (Linux/Mac) or `%appdata%\NuGet\NuGet.Config` (Windows):

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSourceCredentials>
    <repsy>
      <add key="Username" value="MY_REPSY_USERNAME" />
      <add key="ClearTextPassword" value="MY_REPSY_PASSWORD_OR_DEPLOY_TOKEN" />
    </repsy>
  </packageSourceCredentials>
</configuration>
```

### Install the package

**Using .NET CLI:**

```bash
dotnet add package MyPackage --version 1.0.0 --source repsy
```

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
