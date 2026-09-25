+++
title = "NuGet in CI"
weight = 480
+++

A CI job that restores from or pushes to your Repsy Open Source NuGet repository needs a credential that is safe to keep in the CI system, a `nuget.config` that holds no secret, and a version number that the job makes up for itself. This page covers them, with a GitHub Actions example that works the same in any CI system that runs shell commands.

### Use a Deploy Token

Give the job a [deploy token](../../getting-started/creating-a-deploy-token/) instead of a user account:

- A token belongs to one repository, so a leaked token exposes that repository only, not every repository of the instance.
- A **Read/Write** token can restore, push, unlist and relist. A **Read Only** token can restore; use it for jobs that only build and test.
- A token expires at most 365 days after you create it. Rotate or replace it before then, and update the secret of the CI system.
- A deploy token works as the API key of `dotnet nuget push`, which an account password does not.

Store the token as a secret of your CI system, for example `REPSY_TOKEN`, and never write it into a file that you commit. The username is not checked; use a fixed label such as `ci`. See [Authenticating from CI](../../administration/authenticating-from-ci/) for how Repsy treats tokens and wrong credentials.

### Keep the Secret out of nuget.config

NuGet expands environment variables written as `%NAME%` in the values of a `nuget.config`, also on Linux and macOS. That lets you commit a `nuget.config` that names the variables, and lets the job provide their values. Put this file into the root of the repository:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="repsy" value="{{% repo-url %}}/<repo-name>/v3/index.json" />
  </packageSources>
  <packageSourceCredentials>
    <repsy>
      <add key="Username" value="%REPSY_USER%" />
      <add key="ClearTextPassword" value="%REPSY_TOKEN%" />
    </repsy>
  </packageSourceCredentials>
</configuration>
```

Set `REPSY_USER` (any value, for example `ci`) and `REPSY_TOKEN` in the environment of the job. The file needs the two variables wherever it is used, so a developer machine sets them too, or the project keeps only the source in `nuget.config` and each developer keeps their credentials in the user-level `NuGet.Config`, see [Publishing and Restoring NuGet Packages with the dotnet CLI](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#store-the-credentials). When your instance is served over plain HTTP, add `allowInsecureConnections="true"` to the source, see [HTTP and HTTPS](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#http-and-https).

### Restore, Pack and Push

A job that builds a package and pushes it to Repsy:

```bash
dotnet restore
dotnet pack --configuration Release --no-restore -p:Version=1.0.$BUILD_NUMBER --output artifacts
dotnet nuget push "artifacts/*.nupkg" --source repsy --api-key "$REPSY_TOKEN" --skip-duplicate
```

- `restore` reads the credentials from `nuget.config` and the environment.
- `-p:Version=...` gives the package the version of this build, without editing the project file. A pre-release label after a hyphen, such as `1.0.$BUILD_NUMBER-ci`, makes it a pre-release version.
- `--api-key "$REPSY_TOKEN"` authenticates the push with the deploy token. The client also reads the API key from the `NUGET_API_KEY` environment variable, which keeps it out of the command line. The credentials in `nuget.config` work for the push too, with `--api-key any`.
- `--skip-duplicate` turns a push that Repsy refuses because the version already exists into a no-op: a restarted job then ends with exit code `0` instead of `1`. See [Pushing a Version Again](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#pushing-a-version-again).

A complete GitHub Actions job:

```yaml
name: publish-package
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      REPSY_USER: ci
      REPSY_TOKEN: ${{ secrets.REPSY_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Restore
        run: dotnet restore
      - name: Pack
        run: dotnet pack --configuration Release --no-restore -p:Version=1.0.${{ github.run_number }} --output artifacts
      - name: Push
        run: dotnet nuget push "artifacts/*.nupkg" --source repsy --api-key "$REPSY_TOKEN" --skip-duplicate
```

The runner reaches the instance over the network, so the address in `nuget.config` has to be one that the runner can reach and that NuGet accepts: an HTTPS address with a certificate that the runner trusts, or a plain HTTP address that you allowed with `allowInsecureConnections`. A runner on the same machine as Repsy can use `http://localhost:9090`.

### Choose Versions

- **A version that names the build** never has to be pushed twice, so it works with every setting of the repository.
- **A version that is pushed again**, for example `1.0.0` from every run, needs the repository setting **Package Override** to be **Allow**, which is the default. With **Deny**, Repsy answers `409`, and the job fails unless it uses `--skip-duplicate`. A client that has restored a version does not notice when it is replaced.
- **Version Allowance** of the repository can accept only stable or only pre-release versions. A job that pushes a kind the repository does not accept fails with `422`. See [Rules Repsy Applies to a Push](../publishing-and-restoring-nuget-packages-with-the-dotnet-cli/#rules-repsy-applies-to-a-push).
- The global packages folder of a job can be cached by the CI system. The `NUGET_PACKAGES` environment variable moves it to a directory that you can cache.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| Push: `error: Response status code does not indicate success: 401.` | The secret is empty or wrong, or the token is **Read Only**, expired, revoked or rotated, or belongs to another repository. |
| Restore: `NU1301` with `Response status code does not indicate success: 401.` | The environment variables of the job are not set or hold the wrong values, or the name of the credentials element in `nuget.config` differs from the `key` of the source. |
| Push: `error: Response status code does not indicate success: 409.` | The version exists and **Package Override** is **Deny**. Use a new version, or `--skip-duplicate`. |
| Push: `error: Response status code does not indicate success: 422.` | The **Version Allowance** of the repository does not take this kind of version. |
| A push with a `--source` name fails with `The specified source 'repsy' is invalid` | The `nuget.config` is not in the working directory of the step, or in one of its parents. |
| `429` or repeated `401` | Wrong credentials were sent too often from the address of the runner. By default Repsy refuses further password checks after 20 failures in 60 seconds. Fix the secret. A valid deploy token keeps working while the address is blocked, see [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit). |
