+++
title = "Publishing and Consuming with Maven"
weight = 370
description = "Publish a Java library with mvn deploy as a release or SNAPSHOT version, and use it as a dependency in another project."
+++

This tutorial takes a Java library from `mvn deploy` to a dependency in another project, with a release version and with a SNAPSHOT version. It complements [Using a Private Maven Repository](../using-private-maven-repository/), which shows the same setup in short.

### Prerequisites

- A Maven repository on your Repsy Open Source instance, see [Creating a Private Maven Repository](../creating-private-maven-repository/). The examples use the repository URL `{{% repo-url %}}/<repo-name>`. There is no username in the URL.
- A JDK and Apache Maven.
- A credential: your username and password, or a [deploy token](../creating-private-maven-repository/#get-your-credentials). A deploy token goes into the password field and needs the **Read/Write** access type to publish; the username can be any value.

{{% notice note %}}
Maven 3.8.1 and later refuses to use a repository on plain HTTP, unless it runs on `localhost`. Serve a shared instance over HTTPS. If Maven stops with "Blocked mirror for repositories" and the name `maven-default-http-blocker`, the repository URL starts with `http://`.
{{% /notice %}}

{{< steps >}}
### Store the credentials in settings.xml

Add a `server` entry to `~/.m2/settings.xml` (on Windows, `%USERPROFILE%\.m2\settings.xml`). The `id` is the name that `pom.xml` refers to; the examples use `repsy`.

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
  http://maven.apache.org/xsd/settings-1.0.0.xsd">

  <servers>
    <server>
      <id>repsy</id>
      <username>MY REPSY USERNAME</username>
      <password>MY REPSY PASSWORD OR DEPLOY TOKEN</password>
    </server>
  </servers>
</settings>
```

In a CI job, read the secret from an environment variable instead of writing it into the file: `<password>${env.REPSY_DEPLOY_TOKEN}</password>`.

### Point the project at the repository

Add the repository to the `distributionManagement` section of `pom.xml`. Maven deploys a release version to `repository` and a version that ends in `-SNAPSHOT` to `snapshotRepository`, so define both:

```xml
<project>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0.0</version>
  <packaging>jar</packaging>

  <distributionManagement>
    <repository>
      <id>repsy</id>
      <name>Repsy Open Source</name>
      <url>{{% repo-url %}}/<repo-name></url>
    </repository>
    <snapshotRepository>
      <id>repsy</id>
      <name>Repsy Open Source</name>
      <url>{{% repo-url %}}/<repo-name></url>
    </snapshotRepository>
  </distributionManagement>
</project>
```

### Publish a release version

```bash
mvn deploy
```

Maven uploads the POM and the jar (and the sources and javadoc jars, if the build attaches them), each with its checksums, and then the `maven-metadata.xml` files. The build ends with `BUILD SUCCESS`.

Deploying the same release version again works when the repository's **Package Override** setting is **Allow**, which is the default of a new repository. When it is **Deny**, Repsy refuses the second deploy on its first file with `403` and changes nothing, see [Maven Upload Rules](../maven-upload-rules/).

### Publish a SNAPSHOT version

Give the project a version that ends in `-SNAPSHOT`, for example `1.1.0-SNAPSHOT`, and run `mvn deploy` again. Maven uploads timestamped files such as `demo-1.1.0-20260925.101010-1.jar` and a version-level `maven-metadata.xml` that points to the newest build.

Every deploy of a SNAPSHOT writes new timestamped files, so it is never an override: you can deploy the same SNAPSHOT as often as you like, also when **Package Override** is **Deny**.

If the **Version Allowance** setting of the repository is **releases**, SNAPSHOT versions are refused, and **snapshots** refuses release versions.

### Consume the artifact

In the project that uses the library, add the repository and the dependency to `pom.xml`:

```xml
<project>
  <repositories>
    <repository>
      <id>repsy</id>
      <name>Repsy Open Source</name>
      <url>{{% repo-url %}}/<repo-name></url>
    </repository>
  </repositories>

  <dependencies>
    <dependency>
      <groupId>com.example</groupId>
      <artifactId>demo</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
```

A private repository needs the same `server` entry (with the id `repsy`) in `settings.xml` as for publishing. A public repository can be read without credentials. Then run:

```bash
mvn compile
```

A `-SNAPSHOT` dependency resolves to the newest timestamped build through the version-level metadata. Maven checks for a newer build once a day by default; run `mvn -U compile` to check right away.

To test that Repsy really serves the artifact, without a project and without your local repository, resolve it directly:

```bash
mvn dependency:get -Dartifact=com.example:demo:1.0.0 \
  -DremoteRepositories=repsy::default::{{% repo-url %}}/<repo-name>
```

The `repsy` in `remoteRepositories` is the id that selects the `server` entry of `settings.xml`.

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. The list has one row per artifact, with its group, its artifact ID and its latest version. Open the artifact to see its versions, and open a version to see the POM and ready-made dependency snippets for Apache Maven, Gradle and other build tools.
3. **Browse Files** shows the stored files as a directory tree, with the POM, the jar, the checksums and the `maven-metadata.xml` files.
4. The **Signed** field of a version shows whether the version has verified PGP signatures, see [Signing Maven Artifacts](../signing-maven-artifacts/).

A version shows up in the list when its POM has been uploaded.
{{< /steps >}}

### Dynamic Versions

`LATEST`, `RELEASE` and version ranges such as `[1.0,2.0)` are resolved through the `maven-metadata.xml` of the artifact. Repsy stores the metadata file that Maven uploads with `mvn deploy`, so they work for artifacts published by Maven and Gradle. Repsy does not generate `maven-metadata.xml` itself: for an artifact that was uploaded by other means (for example with a plain HTTP `PUT`) and has no metadata file, they do not resolve, so use fixed versions there.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `401 Unauthorized` on `mvn deploy` or `mvn compile` | The credentials are missing or wrong, the `id` in `settings.xml` is not the `id` of the `repository` in `pom.xml`, or the deploy token is read-only, expired, revoked or belongs to another repository. Anonymous requests can read public repositories only, and nobody can publish anonymously. |
| `403 Forbidden`, `Artifact override is prohibited in this repository!` | The file already exists and **Package Override** is **Deny**. Publish a new version, or ask an administrator to allow overriding. |
| `403 Forbidden`, `Release versions are prohibited in this repository!` or `Snapshot versions are prohibited in this repository!` | **Version Allowance** of the repository does not allow that kind of version. |
| `400 Bad Request`, `POM file is malformed or incomplete, please fix it and retry the deployment.` | Repsy could not read the POM you deployed. |
| `400 Bad Request`, `The POM declares a groupId that is not the one of its path` | The `groupId` of the POM (or of its parent) is not the group directory the file was uploaded to. |
| "Blocked mirror for repositories" | The repository URL uses plain HTTP, see the note above. |
| `Could not find artifact` for a dependency | The version does not exist in that repository, or the repository is missing in `pom.xml`. |

Repsy sends the identifier of the error and the message in a JSON body, and Maven prints the HTTP status. More refusals and their answers are listed in [Maven Upload Rules](../maven-upload-rules/).
