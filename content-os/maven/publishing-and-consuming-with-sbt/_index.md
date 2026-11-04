+++
title = "Publishing and Consuming with sbt"
weight = 375
description = "Publish a Scala library to a Repsy Open Source Maven repository with sbt publishTo and credentials, then resolve it from another sbt build."
+++

This tutorial publishes a Scala library to a Repsy Open Source Maven repository with `sbt publish` and resolves it from another sbt build. sbt writes the Maven layout, so the repository is an ordinary Maven repository, see [Creating a Private Maven Repository](../creating-private-maven-repository/).

### Prerequisites

- A Maven repository on your Repsy Open Source instance. The examples use the repository URL `{{% repo-url %}}/<repo-name>`. There is no username in the URL.
- A JDK and sbt.
- A credential: your username and password, or a [deploy token](../creating-private-maven-repository/#get-your-credentials). A deploy token goes into the password and needs the **Read/Write** access type to publish; the username can be any non-empty value.

{{% notice note %}}
sbt looks up a `Credentials` entry by the **host** of the repository (without the port) and by the **realm** of the server's `Basic` challenge. Repsy uses the realm `Repsy` for every protocol, so the entry must name `"Repsy"`. A credential with another realm, or an older longer realm name from an earlier setup, is never sent, and every request is answered `401`.
{{% /notice %}}

{{< steps >}}
### Store the credentials outside the build file

Do not write the credentials into `build.sbt`, which you commit. Put them into the file `~/.sbt/.credentials`:

```properties
realm=Repsy
host=repo.example.com
user=MY REPSY USERNAME
password=MY REPSY PASSWORD OR DEPLOY TOKEN
```

`host` is the host name of your instance's repository port, without the port number. In a CI job, read them from environment variables in the build instead (see the next step).

### Configure publishing

A minimal `build.sbt`:

```scala
ThisBuild / organization := "com.example"
ThisBuild / version := "1.0.0"
ThisBuild / scalaVersion := "2.13.18"

lazy val root = (project in file("."))
  .settings(
    name := "demo",
    publishMavenStyle := true,
    publishTo := Some("Repsy" at "{{% repo-url %}}/<repo-name>"),
    credentials += Credentials(Path.userHome / ".sbt" / ".credentials"),
  )
```

To take the credentials from environment variables, replace the last line with:

```scala
credentials += Credentials(
  "Repsy",
  "repo.example.com",
  sys.env("REPSY_USERNAME"),
  sys.env("REPSY_PASSWORD")
),
```

sbt appends the Scala binary version to the artifact ID: the library above is stored as `com.example:demo_2.13`. A dependency written with `%%` finds it.

{{% notice note %}}
sbt refuses a repository on plain HTTP unless you allow it. Serve a shared instance over HTTPS. For a test instance on plain HTTP, write `("Repsy" at "http://localhost:9090/<repo-name>").withAllowInsecureProtocol(true)`.
{{% /notice %}}

### Publish a release version

```bash
sbt publish
```

sbt uploads the POM and the jar of the library, with their `.md5` and `.sha1` checksums. Add `Compile / packageDoc / publishArtifact := true` and `Compile / packageSrc / publishArtifact := true` to also publish the Scaladoc and sources jars. For several Scala versions set `crossScalaVersions` and run `sbt +publish`: each version is stored as its own artifact, `demo_2.13` and `demo_3`.

By default sbt does not replace a release. Before it uploads a file it asks Repsy with a `HEAD` request whether the file exists: Repsy answers `404` for a missing file, so the first publish goes through, and `200` for a stored one, so a second `sbt publish` of the same release is refused by sbt itself and nothing changes. To let Repsy decide instead, set `publishConfiguration := publishConfiguration.value.withOverwrite(true)`. The repository's **Package Override** setting then applies: **Allow** (the default of a new repository) replaces the file, **Deny** is answered `403`, see [Maven Upload Rules](../maven-upload-rules/).

### Publish a SNAPSHOT version

Set a version that ends in `-SNAPSHOT`, for example `ThisBuild / version := "1.1.0-SNAPSHOT"`, and run `sbt publish` again. sbt publishes a SNAPSHOT under its literal file names (`demo_2.13-1.1.0-SNAPSHOT.jar`), not as timestamped builds, and a new publish replaces the stored files. That is not an override, so it works with **Package Override** set to **Deny**.

If the **Version Allowance** setting of the repository is **releases**, SNAPSHOT versions are refused, and **snapshots** refuses release versions.

### Consume the artifact

In the build that uses the library add the repository, the credentials and the dependency to `build.sbt`:

```scala
resolvers += ("Repsy" at "{{% repo-url %}}/<repo-name>")

credentials += Credentials(Path.userHome / ".sbt" / ".credentials")

libraryDependencies += "com.example" %% "demo" % "1.0.0"
```

A private repository needs the credentials, and a public repository can be read without them. Then run `sbt update` or `sbt compile`.

Repsy stores no `maven-metadata.xml` for a library that sbt published, because sbt sends none. It answers the file for the artifact from the versions it has registered, so a dynamic version such as `"com.example" %% "demo" % "latest.release"` resolves, see [Dynamic Versions and maven-metadata.xml](../dynamic-versions-and-maven-metadata/).

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. Find your artifact in the list, with its group, its artifact ID (including the `_2.13` suffix) and its latest version, and open it to see its versions. A release and a SNAPSHOT version both show their POM.
3. **Browse Files** shows the stored files. There is no `maven-metadata.xml` in them: it is generated when a client asks for it.
{{< /steps >}}

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `401` on the first file, sbt sends no credentials | The `Credentials` entry names another realm than `Repsy`, or another host than the repository's. The deploy token can also be read-only, expired, revoked or belong to another repository. |
| `403`, message `Artifact override is prohibited in this repository!` | The file already exists, the publish may overwrite and **Package Override** is **Deny**. |
| `403`, message `Release versions are prohibited in this repository!` or `Snapshot versions are prohibited in this repository!` | **Version Allowance** of the repository does not allow that kind of version. |
| sbt stops with a message that the file exists and overwrite is false | sbt's own default for a release, see above. Publish a new version. |
| `unresolved dependency` for `com.example#demo_2.13;1.0.0` | The version does not exist in that repository, the repository is missing from `resolvers`, or the Scala binary version of the consumer differs from the published one. |

Repsy sends the identifier of the error and the message in a JSON body. More refusals are listed in [Maven Upload Rules](../maven-upload-rules/).
