+++
title = "Publishing and Consuming with Apache Ivy"
weight = 376
description = "Publish a library to a Repsy Open Source Maven repository with Apache Ivy and Ant using ivysettings.xml and the realm Repsy, then resolve it with Ivy."
+++

This tutorial publishes a library to a Repsy Open Source Maven repository with Apache Ivy (driven by Ant) and resolves it again. Ivy reads and writes the repository through the Maven layout, with an `ibiblio` resolver in Maven-compatible mode. See [Creating a Private Maven Repository](../creating-private-maven-repository/) to create the repository.

### Prerequisites

- A Maven repository on your Repsy Open Source instance. The examples use the repository URL `{{% repo-url %}}/<repo-name>`. There is no username in the URL.
- A JDK, Ant and the Ivy jar (the Ant tasks `antlib:org.apache.ivy.ant`).
- A credential: your username and password, or a [deploy token](../creating-private-maven-repository/#get-your-credentials). A deploy token goes into `passwd` and needs the **Read/Write** access type to publish; the `username` can be empty.

{{< steps >}}
### Write ivysettings.xml

```xml
<ivysettings>
  <settings defaultResolver="repsy"/>
  <credentials host="repo.example.com"
               realm="Repsy"
               username="MY REPSY USERNAME"
               passwd="MY REPSY PASSWORD OR DEPLOY TOKEN"/>
  <resolvers>
    <ibiblio name="repsy" m2compatible="true" root="{{% repo-url %}}/<repo-name>/"/>
  </resolvers>
</ivysettings>
```

Ivy looks credentials up by the host of the repository (without the port) and by the realm of the server's `Basic` challenge. Repsy uses the realm `Repsy` for every protocol, so `realm="Repsy"` is required. A `<credentials>` without a realm, or with another one (including the longer realm name of earlier versions), sends no credentials and the first file of a publish is refused. Do not commit the password: keep `ivysettings.xml` with the credentials out of version control.

### Describe the module

A version is registered, and shows up in the web UI, by its **POM**. The module therefore lists a `pom` artifact next to the jar in `ivy.xml`:

```xml
<ivy-module version="2.0">
  <info organisation="com.example" module="demo" revision="1.0.0"/>
  <configurations>
    <conf name="default"/>
  </configurations>
  <publications>
    <artifact name="demo" type="jar" ext="jar" conf="default"/>
    <artifact name="demo" type="pom" ext="pom" conf="default"/>
  </publications>
</ivy-module>
```

If the module has `<dependencies>`, give them `conf="default->default"`.

### Write the Ant build

`ivy:makepom` creates the POM from the module, and `ivy:publish` uploads the jar and the POM:

```xml
<project name="demo" default="publish" xmlns:ivy="antlib:org.apache.ivy.ant">
  <target name="publish">
    <ivy:settings file="ivysettings.xml"/>
    <ivy:resolve file="ivy.xml"/>
    <mkdir dir="build"/>
    <jar destfile="build/demo.jar" basedir="classes"/>
    <ivy:makepom ivyfile="ivy.xml" pomfile="build/demo.pom">
      <mapping conf="default" scope="compile"/>
    </ivy:makepom>
    <ivy:publish resolver="repsy" pubrevision="1.0.0" status="release" publishivy="false">
      <artifacts pattern="build/[artifact].[ext]"/>
    </ivy:publish>
  </target>
</project>
```

- `publishivy="false"` is required. Otherwise Ivy also uploads its own ivy file (`ivy-1.0.0.xml`) after the jar and the POM, and Repsy refuses it with `400` and the identifier `invalidArtifactPath`. The build fails, although the jar and the POM are already stored.
- The `<mapping conf="default" scope="compile"/>` matters when the module has dependencies. Without it Ivy writes every dependency into the POM as `<optional>true</optional>`, and a consumer does not resolve it transitively.

### Publish a release version

```bash
ant publish
```

Ivy uploads the jar and the POM with their checksums. By default `overwrite` is `false`: Ivy asks Repsy with a `HEAD` request whether a file exists, Repsy answers `404` for a missing file and `200` for a stored one, so the first publish goes through and a second publish of the same release is refused by Ivy itself ("destination file exists and overwrite == false"), and nothing changes. With `overwrite="true"` on `ivy:publish` Repsy decides: the repository's **Package Override** setting **Allow** (the default of a new repository) replaces the file, **Deny** is answered `403`, see [Maven Upload Rules](../maven-upload-rules/).

### Publish a SNAPSHOT version

Use a revision that ends in `-SNAPSHOT`, for example `pubrevision="1.1.0-SNAPSHOT"`, and set `overwrite="true"` to republish it. Ivy publishes a SNAPSHOT under its literal file names (`demo-1.1.0-SNAPSHOT.jar`), not as timestamped builds, and a new publish replaces the stored files. That is not an override, so it also works when **Package Override** is **Deny**.

If the **Version Allowance** setting of the repository is **releases**, SNAPSHOT versions are refused, and **snapshots** refuses release versions.

### Consume the artifact

Use the same `ivysettings.xml` to resolve. A consumer module `consumer-ivy.xml`:

```xml
<ivy-module version="2.0">
  <info organisation="com.example" module="consumer"/>
  <configurations>
    <conf name="default"/>
  </configurations>
  <dependencies>
    <dependency org="com.example" name="demo" rev="1.0.0" conf="default->default"/>
  </dependencies>
</ivy-module>
```

and an Ant target that resolves it and copies the jars:

```xml
<target name="retrieve">
  <ivy:settings file="ivysettings.xml"/>
  <ivy:resolve file="consumer-ivy.xml"/>
  <ivy:retrieve pattern="lib/[artifact]-[revision](-[classifier]).[ext]"/>
</target>
```

This is the dependency line that the version page of the web UI shows. A dependency without `conf` resolves too: Ivy then also looks for `sources` and `javadoc` artifacts, Repsy answers `404` for them and Ivy skips them.

A dynamic revision such as `latest.release` resolves although Ivy stores no `maven-metadata.xml`: Repsy answers the file from the versions it has registered, see [Dynamic Versions and maven-metadata.xml](../dynamic-versions-and-maven-metadata/).

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. Find your artifact in the list and open it to see its versions. A release and a SNAPSHOT version both show their POM, and an **Apache Ivy** block with the dependency line.
3. **Browse Files** shows the stored jar and POM.
{{< /steps >}}

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `demo-1.0.0.jar was refused by the server` (`401`) on the first file | The `<credentials>` has no `realm`, another realm than `Repsy`, or another host than the repository's. The deploy token can also be read-only, expired, revoked or belong to another repository. |
| `.../ivy-1.0.0.xml failed with status code 400` | `publishivy` is not `false`. The jar and the POM are stored. |
| `destination file exists and overwrite == false` | Ivy's own default, see above. Publish a new version or set `overwrite="true"`. |
| `403`, message `Artifact override is prohibited in this repository!` | The file exists, `overwrite="true"` and **Package Override** is **Deny**. |
| `:: com.example#demo;1.0.0: not found` | The version does not exist in that repository, or the resolver points to another repository. |
| A published version is not listed in the web UI | The module published no `pom` artifact. |

Repsy sends the identifier of the error and the message in a JSON body. More refusals are listed in [Maven Upload Rules](../maven-upload-rules/).
