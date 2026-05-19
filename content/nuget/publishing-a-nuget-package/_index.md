+++
title = "Publishing a NuGet Package"
weight = 72
+++

You have registered and created a repository on [Repsy](https://repsy.io/). You are now ready to publish NuGet packages to your repository.

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

Add the Repsy source to `nuget.config` in your project or solution root. This file is safe to commit to version control because it contains only the source URL, not credentials.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="repsy" value="https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}/v3/index.json" />
  </packageSources>
</configuration>
```

Replace `{MY_REPSY_USERNAME}` and `{MY_REPOSITORY_NAME}` with your actual values.

### Store credentials in user-level config

Store your credentials in `~/.nuget/NuGet/NuGet.Config` (Linux/Mac) or `%appdata%\NuGet\NuGet.Config` (Windows). This file is **not** committed to version control.

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

**Tip:** For CI/CD pipelines, use a [Deploy Token](https://repsy.io) instead of your account password.

### Pack and publish

Build and pack your project:

```bash
dotnet pack --configuration Release
```

Then push the generated `.nupkg` file to Repsy:

```bash
dotnet nuget push ./bin/Release/*.nupkg --source repsy --api-key any
```

The `--api-key` flag is required by the NuGet CLI but not used for authentication — credentials from your `NuGet.Config` are used instead. You can pass any non-empty value.

Congratulations, you have created and published a NuGet package to your repository! You can now install your package into any .NET project.
{{< /steps >}}
