+++
title = "NuGet"
chapter = true
weight = 400
+++

# NuGet

Repsy Open Source hosts private and public NuGet repositories. A NuGet repository is a repository of the type NuGet: it takes packages from `dotnet nuget push` and serves them to `dotnet restore`, `dotnet add package` and the other .NET tools. It speaks the NuGet V3 protocol, so any client that reads a V3 service index works with it.

The address of a repository is the repository address of your instance followed by the name of the repository and `/v3/index.json`, the service index: `{{% repo-url %}}/<repo-name>/v3/index.json`. There is no username in the address. `<your-repsy-host>` stands for the host and port of your instance, see [Ports and Repository URLs](../getting-started/ports-and-repository-urls/). On a local instance with the default settings, the address of the default `nuget` repository is `http://localhost:9090/nuget/v3/index.json`.

## Getting Started

- [Creating a Private NuGet Repository](creating-a-private-nuget-repository/): find or create a repository and get your credentials.
- [Publishing a NuGet Package](publishing-a-nuget-package/): pack a first package and push it.
- [Installing a NuGet Package](installing-a-nuget-package/): install it in a project.

## Tutorials

- [Publishing and Restoring NuGet Packages with the dotnet CLI](publishing-and-restoring-nuget-packages-with-the-dotnet-cli/): sources and credentials, `dotnet nuget push`, `dotnet restore`, `dotnet add package`, HTTP and HTTPS, version rules, pushing a version again and the errors you may see.
- [Unlisting and Relisting NuGet Packages](unlisting-and-relisting-nuget-packages/): hide a version from search and from `dotnet add package` without deleting it, and bring it back.
- [NuGet in CI](nuget-in-ci/): credentials from environment variables and secrets, pushing from a pipeline and restoring in one.

## Good to Know

- Repsy Open Source does not proxy or mirror nuget.org. A project that has a Repsy repository as its only source can only restore what that repository holds. Keep nuget.org in your configuration for everything else, and use package source mapping to say which packages come from where, see [Publishing and Restoring NuGet Packages with the dotnet CLI](publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#using-repsy-next-to-nugetorg).
- A deploy token works as the API key of `dotnet nuget push`. An account password does not: it only works as the password in your `NuGet.Config`. See [Creating a Deploy Token](../getting-started/creating-a-deploy-token/).
- The service index is served without credentials, also for a private repository. Everything else needs a login, unless the repository is public and the request only reads. Pushing, unlisting and relisting always need credentials.
- Repsy stores package ids in lower case and versions in their normalized form. NuGet ids are case-insensitive, so clients are not affected.
- These pages were checked with the .NET SDK 10.0.401, and where noted with 8.0.425.
