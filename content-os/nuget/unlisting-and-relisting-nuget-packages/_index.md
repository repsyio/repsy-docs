+++
title = "Unlisting and Relisting NuGet Packages"
weight = 470
description = "Unlist and relist NuGet package versions with the dotnet CLI, and see what clients get in each case."
+++

NuGet has no way to take a published version back. What a client can do is to **unlist** it: the version stays in the repository and can still be restored by anyone who asks for it by name, but it is no longer offered as a candidate. This page shows how to unlist and relist a version in Repsy Open Source, what clients see afterwards, and how unlisting differs from deleting a version and from the **Version Allowance** setting.

### Prerequisites

- A NuGet repository with a package in it, see [Publishing and Restoring NuGet Packages with the dotnet CLI](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/). The examples use the source `repsy` from your `NuGet.Config`, the package `Example.Library` and the version `1.1.0`.
- A credential that may write: an account, or a **Read/Write** [deploy token](../creating-a-private-nuget-repository/#get-your-credentials). A **Read Only** token is refused with `401`. Unlisting and relisting always need credentials, also in a public repository.

### Unlist a Version

The .NET CLI unlists with `dotnet nuget delete`:

```bash
dotnet nuget delete Example.Library 1.1.0 --source repsy --api-key <deploy-token> --non-interactive
```

```text
warn : Deleting Example.Library 1.1.0 from the '{{% repo-url %}}/<repo-name>/v3/package'.
  DELETE {{% repo-url %}}/<repo-name>/v3/package/Example.Library/1.1.0
  NoContent {{% repo-url %}}/<repo-name>/v3/package/Example.Library/1.1.0 40ms
Example.Library 1.1.0 was deleted successfully.
```

The client says "deleted", but Repsy only unlists the version: nothing is removed. `--non-interactive` skips the confirmation prompt. The credentials work as they do for `dotnet nuget push`: a deploy token as `--api-key`, or the credentials in your `NuGet.Config` when you leave `--api-key` out. Without a client, unlisting is a `DELETE` request for the version, and Repsy answers `204`:

```bash
curl -X DELETE -H "X-NuGet-ApiKey: <deploy-token>" {{% repo-url %}}/<repo-name>/v3/package/example.library/1.1.0
```

A package or a version that does not exist is answered with `404` (the client prints `error: Response status code does not indicate success: 404.`), and a request without write permission with `401`.

### What Clients See

An unlisted version differs from a listed one in these ways:

| What a client does | With the unlisted version `1.1.0` and the listed version `1.0.0` |
| --- | --- |
| `dotnet add package Example.Library`, without a version | Adds `1.0.0`. Repsy leaves `1.1.0` out of the candidates. If every version is unlisted, the command fails with `There are no versions available for the package 'Example.Library'.` |
| `dotnet package search Example.Library` | Shows `1.0.0` as the version of the package. A package with only unlisted versions is not found: `No results found.` |
| `dotnet add package Example.Library --version 1.1.0`, and a `PackageReference` with exactly this version | Works. An unlisted version is still downloadable. |
| A floating version such as `1.*` in a `PackageReference` | Resolves to `1.1.0`. The list of versions that `dotnet restore` reads for this contains the unlisted versions, too. |
| `dotnet restore` of a project that already refers to exactly `1.1.0` | Works. |

So unlisting keeps existing projects working and steers new ones away from a version, but it does not stop anyone from getting the version, and a floating version can still pick it. Pin the versions in the projects you care about, or delete the version, if it must not be used at all.

The version stays in the version list of the package in the web UI, and its detail page shows **Listed: No** among the details of the version. The web UI has no button to unlist or relist a version: it only shows the state.

### Relist a Version

The .NET CLI has no command to relist. NuGet's relist is a `POST` request for the same address, which Repsy answers with `200`:

```bash
curl -X POST -H "X-NuGet-ApiKey: <deploy-token>" {{% repo-url %}}/<repo-name>/v3/package/example.library/1.1.0
```

With an account instead of a deploy token, send the credentials as HTTP Basic credentials: `curl -X POST -u <username>:<password> ...`.

Pushing the version again also lists it, when the repository allows a version to be pushed again: **Package Override** has to be **Allow**, and the push then replaces the package with the one you push, see [Pushing a Version Again](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#pushing-a-version-again).

The address has the id of the package in lower case and the version in its normalized form, for example `1.2.0` for `1.2.0.0`. Repsy also accepts the id in the spelling of the package (`Example.Library`), as `dotnet nuget delete` sends it.

### Unlisting, Deleting and Version Allowance

| Goal | Use | Effect |
| --- | --- | --- |
| Steer new projects away from a version, and keep old ones working | Unlisting | The version stays and can be restored by its exact version. It comes back with a relist. |
| Remove a version for good | Delete the version in the web UI, see [Browsing and Deleting Packages](../../repositories/browsing-and-deleting-packages/). You need the `ADMIN` role. | The version is gone for every client. Deleting the last version of a package removes the package. |
| Stop a kind of version from being pushed | The **Version Allowance** setting of the repository, see [Configuring Repository Settings](../../repositories/configuring-repository-settings/#version-allowance): **all packages**, only **pre-release** versions or only **stable** versions | Applies to pushes from then on. Versions that are already in the repository stay, listed or not, and can still be restored. |

**Version Allowance** looks at the kind of version only, not at whether it is listed. A pre-release version is one with a hyphen in its version, such as `1.0.0-rc.1`. See [Rules Repsy Applies to a Push](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#rules-repsy-applies-to-a-push).

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `error: Response status code does not indicate success: 401.` | The credentials are missing or wrong, the token is read-only, or an account password was passed as `--api-key`. Use a Read/Write deploy token as the API key, or put your credentials into `NuGet.Config`. |
| `error: Response status code does not indicate success: 404.` | The package or the version does not exist in this repository. Check the id and the version. |
| A restored project still gets the version | The version is unlisted, not removed. See [What Clients See](#what-clients-see). |
