+++
title = "Publishing and Restoring NuGet Packages with the dotnet CLI"
weight = 460
+++

This tutorial takes a small class library from `dotnet pack` to a package in your Repsy Open Source NuGet repository, restores it in a second project, and explains the rules Repsy applies to a push and what each refusal looks like. It complements [Publishing a NuGet Package](../publishing-a-nuget-package/) and [Installing a NuGet Package](../installing-a-nuget-package/), which show the same setup in short.

### Prerequisites

- A NuGet repository on your Repsy Open Source instance, see [Creating a Private NuGet Repository](../creating-a-private-nuget-repository/). The examples use the address of its service index, `{{% repo-url %}}/<repo-name>/v3/index.json`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start.
- The .NET SDK. The commands were checked with the .NET SDK 10.0.401, and the notes on older SDKs with 8.0.425.
- A credential: your username and password, or a [deploy token](../creating-a-private-nuget-repository/#get-your-credentials). A deploy token needs the **Read/Write** access type to push, and a **Read Only** token is enough to restore. With a deploy token, the username can be any non-empty value.

{{% notice note %}}
Repsy takes the credentials over HTTP Basic authentication, or the deploy token in the `X-NuGet-ApiKey` header of a push, so a secret is sent with every request. Serve a shared instance over HTTPS. On plain HTTP, the credentials cross the network unencrypted, and NuGet refuses the source unless you allow it, see [HTTP and HTTPS](#http-and-https).
{{% /notice %}}

{{< steps >}}
### Create the package

Create a class library:

```bash
dotnet new classlib -n Example.Library
cd Example.Library
```

Add the metadata of the package to the `<PropertyGroup>` of `Example.Library.csproj`, next to the `TargetFramework` the template wrote:

```xml
<PropertyGroup>
  <PackageId>Example.Library</PackageId>
  <Version>1.0.0</Version>
  <Authors>Your Name</Authors>
  <Description>An example package.</Description>
</PropertyGroup>
```

The `PackageId` and the `Version` identify the package in Repsy. Pack it:

```bash
dotnet pack --configuration Release
```

The command writes the package to `bin/Release/Example.Library.1.0.0.nupkg`.

### Configure the source

Tell NuGet where the repository is. Put the source into a `nuget.config` in the root of your project or solution, which is safe to commit because it holds no credentials:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" />
  </packageSources>
</configuration>
```

The `key` is the name of the source. You use it in the credentials below and as `--source` of `dotnet nuget push`. The file adds the source to the ones your other configuration files define, such as nuget.org. Add `<clear />` as the first element of `<packageSources>` to drop those.

`dotnet nuget add source` writes the same entry for you. Without `--configfile` it adds the source to your user-level configuration, and with `--configfile nuget.config` to that file, which has to exist (`dotnet new nugetconfig` creates one):

```bash
dotnet nuget add source {{% repo-url %}}/<repo-name>/v3/index.json --name repsy --configfile nuget.config
```

### Store the credentials

Put the credentials into your user-level configuration, so that they do not end up in version control: `~/.nuget/NuGet/NuGet.Config` on Linux and macOS, `%appdata%\NuGet\NuGet.Config` on Windows. The name of the element inside `<packageSourceCredentials>` is the `key` of the source.

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

Replace `MY REPSY USERNAME` with your username, or with any value when you use a deploy token, and `MY REPSY PASSWORD OR DEPLOY TOKEN` with your password or the deploy token. Restrict the file to your user on Linux and macOS: `chmod 600 ~/.nuget/NuGet/NuGet.Config`.

`dotnet nuget add source` can write the credentials as well, to the user-level file unless you pass `--configfile`:

```bash
dotnet nuget add source {{% repo-url %}}/<repo-name>/v3/index.json --name repsy --username <username> --password <password-or-token> --store-password-in-clear-text
```

On Linux and macOS the `--store-password-in-clear-text` option is required: without it the client stops with `Password encryption is not supported on .NET Core for this platform`.

### Push the package

```bash
dotnet nuget push bin/Release/Example.Library.1.0.0.nupkg --source repsy --api-key <deploy-token>
```

The client finds the source `repsy` in your configuration and prints the address it pushes to:

```text
Pushing Example.Library.1.0.0.nupkg to '{{% repo-url %}}/<repo-name>/v3/package'...
  PUT {{% repo-url %}}/<repo-name>/v3/package/
  Created {{% repo-url %}}/<repo-name>/v3/package/ 143ms
Your package was pushed.
```

How the push authenticates depends on where the credentials are:

| You have | Use | What happens |
| --- | --- | --- |
| A deploy token, and no credentials in a configuration file | `--api-key <deploy-token>` | Repsy authenticates the first request with the API key. |
| Credentials in `NuGet.Config`, for a user account or a deploy token | `--api-key any`, or no `--api-key` at all | The client sends the request, Repsy answers `401` with a Basic challenge, and the client repeats it with the credentials from `NuGet.Config`. Without `--api-key`, `dotnet` prints a warning that no API key was provided and pushes anyway. |

The API key has to be a deploy token. Repsy answers `401` when it is an account password, so use the `NuGet.Config` credentials for a user account. Instead of `--api-key`, the client also reads the `NUGET_API_KEY` environment variable.

You can name the repository by its address instead of by the name of the source, `--source {{% repo-url %}}/<repo-name>/v3/index.json`. `dotnet` then uses the credentials of the source in your configuration that has the same address.

### Check the result

Sign in to the web UI, open the **Repositories** tab and open your NuGet repository. The package is listed with its versions, and the version page shows its details, its dependencies, whether it is listed and the install commands. Or ask the repository itself. `dotnet package search` (checked with the .NET SDK 10) lists the package:

```bash
dotnet package search Example.Library --source repsy
```

To see every version without a client, read the version list of the package. The id is in lower case:

```bash
curl -u <username>:<password-or-token> {{% repo-url %}}/<repo-name>/v3/package/example.library/index.json
```

```json
{"versions":["1.0.0"]}
```

### Restore the package in a project

In another project, use the same `nuget.config` and credentials, and add the package:

```bash
dotnet new console -n Example.App
cd Example.App
# copy the nuget.config from above into this directory
dotnet add package Example.Library --version 1.0.0
```

`dotnet add package` writes the reference into the project and restores it:

```xml
<ItemGroup>
  <PackageReference Include="Example.Library" Version="1.0.0" />
</ItemGroup>
```

A project that already has the reference restores it with `dotnet restore`. `dotnet list package` shows the version that was resolved.

Leave out `--source` here. `dotnet` looks the package up in every source of your configuration, and Repsy is one of them. The value of `--source` in `dotnet add package` and `dotnet restore` is a URL or a folder, not the name of a source: `--source repsy` fails with `NU1301: The local source '.../repsy' doesn't exist`. Name the source by its address, `--source {{% repo-url %}}/<repo-name>/v3/index.json`, when you want it in the command. `dotnet` uses the credentials of the source in your configuration that has this address. This is different from `dotnet nuget push`, which accepts the name.
{{< /steps >}}

### Using Repsy Next to nuget.org

Repsy Open Source does not proxy or mirror nuget.org, so a repository only holds what you pushed. A project that needs both keeps both sources. Without a mapping, NuGet considers every source for every package. Package source mapping makes the choice explicit: it says which source a package id may come from.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" />
  </packageSources>
  <packageSourceMapping>
    <packageSource key="repsy">
      <package pattern="Example.*" />
    </packageSource>
    <packageSource key="nuget.org">
      <package pattern="*" />
    </packageSource>
  </packageSourceMapping>
</configuration>
```

With this file, `Example.*` packages come only from Repsy and everything else comes from nuget.org. Use a prefix that is yours for your own package ids.

### HTTP and HTTPS

NuGet only accepts a source over HTTPS unless you allow plain HTTP for that source, so a local instance at `http://localhost:9090` needs one more step. Without it, the .NET SDK 10 stops the restore with `NU1302` and the push with `You are running the 'push' operation with an 'HTTP' source`, and the .NET SDK 8 only warns with `NU1803`.

Allow HTTP for the source with the `allowInsecureConnections` attribute:

```xml
<add key="repsy" value="http://localhost:9090/<repo-name>/v3/index.json" allowInsecureConnections="true" />
```

`dotnet nuget add source` writes the attribute when you pass `--allow-insecure-connections`, and `dotnet nuget push` takes the same option for a source you name by its address. Anything you configure that way sends the credentials in clear text over the network, so use it for a local trial and serve a shared instance over HTTPS, see [Enabling HTTPS](../../administration/enabling-https/).

The client does not use the address you configured for the rest of its requests. It reads the service index and follows the addresses in it, and Repsy builds them from the address the request came in on: the scheme, the host and the port. Behind a reverse proxy, the proxy has to send the forwarded headers, or the client is sent to the internal address of Repsy. See [Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/).

### Rules Repsy Applies to a Push

A refused push changes nothing in the repository: nothing is stored and no version appears. `dotnet` prints only the HTTP status, for example `error: Response status code does not indicate success: 409.`. The body of the response carries Repsy's message as `{"errors":[{"message":"..."}]}`; the messages are in the list below. A push has to pass these checks:

1. **Credentials.** A user account can push to every repository of the instance. A deploy token can push to its own repository when its access type is **Read/Write**. A **Read Only** token, a wrong or expired token, a token of another repository, an account password used as the API key and missing credentials are all refused with `401`. Nobody can push anonymously, not even to a public repository.
2. **The package.** The request has to be a multipart upload, as `dotnet nuget push` sends it, of a `.nupkg` file with a `.nuspec` at its root. Otherwise Repsy answers `400`: `Content-Type must be multipart/form-data`, or `The uploaded file is not a valid NuGet package (.nuspec not found).`, or `The .nuspec in the package is not well-formed XML.`
3. **The package id.** It starts with a letter or a digit, has at most 100 characters and only letters, digits, `.`, `_` and `-`. Otherwise: `400`, `Invalid NuGet package id.`
4. **The version.** It has up to four numeric parts, optionally a pre-release label after a hyphen and build metadata after a `+`, and at most 64 characters, for example `1.2.3`, `1.2.3.4`, `1.2.3-beta.1`, `1.2.3+build5`. Otherwise: `400`, `Invalid NuGet version format.` or `NuGet version is longer than 64 characters.`
5. **Version Allowance.** The **Version Allowance** setting of the repository can restrict it to pre-release versions or to stable versions. A version with a hyphen in it, such as `1.0.0-rc.1`, is a pre-release version, and every other version is stable. A refused version is answered with `422`: `Pre-release packages are not allowed in this repository.` or `Release packages are not allowed in this repository.` This check comes before the next one, so pushing a version that exists again to a repository that does not take its kind is `422`, never `409`.
6. **Package Override.** See [Pushing a Version Again](#pushing-a-version-again).
7. **The size limit.** A push of more than 500 MB is refused with `413`. An administrator can change the limit with the `MULTIPART_MAX_FILE_SIZE` and `MULTIPART_MAX_REQUEST_SIZE` environment variables, see [Configuration Reference](../../installation/configuration-reference/).

Repsy stores the package id in lower case and the version in a normalized form, and the address of the package uses both. The normalized version is lower case, has no build metadata and keeps its pre-release label; it has at least three numeric parts, and a fourth part that is `0` is dropped:

| Version in the package | Stored, and shown in the version list |
| --- | --- |
| `1.0` | `1.0.0` |
| `1.2.0.0` | `1.2.0` |
| `1.2.3.4` | `1.2.3.4` |
| `1.0.0-Beta.1` | `1.0.0-beta.1` |
| `1.4.0+build5` | `1.4.0` |

Build metadata does not count: `1.4.0+a` and `1.4.0+b` are the same version, and the second push is a push of a version that exists. NuGet clients ignore the case of package ids and versions, so they are not affected.

### Pushing a Version Again

Whether you can push a version that already exists is decided by the **Package Override** setting of the repository. An administrator changes it in the repository settings.

| Setting | Behaviour |
| --- | --- |
| **Allow** (the default of a new repository) | The version is replaced with the new package, and the push is answered like any other with `201 Created`. A version that was unlisted is listed again. |
| **Deny** | The push is refused with `409`: `Version <version> of package <package-id> already exists.` Nothing changes. |

With **Deny**, `dotnet nuget push` fails with `error: Response status code does not indicate success: 409.` and exit code `1`. Add `--skip-duplicate` to a push that may run twice, for example a CI job that was restarted: the client then reports `Package '...' already exists at feed '...'` and exits with `0`.

Publish a new version instead of replacing an old one whenever you can. A client that has already restored a version keeps the copy it has in its global packages folder and does not notice a replaced package; `dotnet nuget locals all --clear` clears that cache.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| Push: `error: Response status code does not indicate success: 401.` | The credentials are missing or wrong, or the deploy token is read-only, expired, revoked or belongs to another repository, or an account password was passed as `--api-key`. Use a Read/Write deploy token as the API key, or put the credentials into `NuGet.Config` and see [the table above](#push-the-package). |
| Push: `error: You are running the 'push' operation with an 'HTTP' source: ...` | The source is plain HTTP and not allowed. See [HTTP and HTTPS](#http-and-https). |
| Push: `error: The specified source 'repsy' is invalid. Provide a valid source.` | `dotnet` finds no source of that name in the configuration that applies to the current directory. Run the command in the directory of the `nuget.config`, or pass the address of the service index as `--source`. |
| Push: `error: Response status code does not indicate success: 409.` | The version exists and **Package Override** is **Deny**. Push a new version, add `--skip-duplicate`, or ask an administrator to allow overriding. |
| Push: `error: Response status code does not indicate success: 422.` | The **Version Allowance** of the repository does not take this kind of version. See [Rules Repsy Applies to a Push](#rules-repsy-applies-to-a-push). |
| Push: `error: Response status code does not indicate success: 400.` | The package, its id or its version is not valid, see [Rules Repsy Applies to a Push](#rules-repsy-applies-to-a-push). Repsy's message is in the body of the response, which `curl` shows. |
| Restore: `NU1301: Failed to retrieve information about '<package-id>' from remote source '...'` followed by `Response status code does not indicate success: 401.` | The repository is private and `dotnet` sent no credentials or wrong ones. Check the name of the credentials element against the `key` of the source, and the password or token. |
| Restore: `NU1301: The local source '.../repsy' doesn't exist.` | `--source` was given the name of a source. Leave `--source` out or pass the address. |
| Restore: `NU1302` or `NU1803` | The source is plain HTTP, see [HTTP and HTTPS](#http-and-https). |
| Restore: `NU1101: Unable to find package <package-id>. No packages exist with this id in source(s): repsy` | The repository has no package with that id: the id is wrong, the package is in another repository, or the source is not the one you meant. |
| Restore: `NU1102: Unable to find package <package-id> with version (>= 9.9.9)` | The package exists, but not that version. The message names the nearest version. |
| Restore does not see a package you just pushed | NuGet caches package data locally. Clear the cache with `dotnet nuget locals all --clear`. |

Failed requests count towards the login throttle of Repsy. See [Authenticating from CI](../../administration/authenticating-from-ci/) if a job that retries with wrong credentials gets `429`.

The next step is to [unlist a version](../unlisting-and-relisting-nuget-packages/) you do not want to be found any more, or to run the same commands in [a CI pipeline](../nuget-in-ci/).
