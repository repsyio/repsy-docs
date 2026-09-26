+++
title = "Dynamic Versions and maven-metadata.xml"
weight = 374
description = "Learn how Repsy keeps maven-metadata.xml for Maven, Gradle, Ivy and sbt publishers so dynamic versions and plugin prefixes resolve, and where it stops."
+++

A build tool that resolves a dynamic version does not list the repository directories. It reads a `maven-metadata.xml` file. Maven resolves `LATEST`, `RELEASE` and version ranges such as `[1.0,2.0)` with the file of the artifact, Gradle resolves `1.+` and dependency locking with it, and so do Apache Ivy and sbt for `latest.release`. Maven finds a plugin by its prefix (`mvn hello:hi`) in the file of the plugin's group.

Maven and Gradle upload those files with every deploy. Apache Ivy and sbt upload none. Repsy Open Source makes a repository work for all of them, also when they publish to the same artifact, and this page describes how, and where it stops.

### Which Client Publishes Which File

| Client | `maven-metadata.xml` of the artifact | `maven-metadata.xml` of the group (plugin prefixes) |
| --- | --- | --- |
| Apache Maven | Uploaded with every deploy | Uploaded when the artifact is a plugin |
| Gradle (`maven-publish`) | Uploaded with every publish | Not uploaded |
| Apache Ivy | Not uploaded | Not uploaded |
| sbt | Not uploaded | Not uploaded |
| A plain HTTP `PUT` | Only what you upload | Only what you upload |

The file of the artifact is `<group-path>/<artifact-id>/maven-metadata.xml`, for example `com/example/demo/maven-metadata.xml`. The file of the group is `<group-path>/maven-metadata.xml`. Each of them has the checksums `.md5`, `.sha1`, `.sha256` and `.sha512`.

A version is registered by its POM. An artifact that Ivy or sbt publishes has to include a POM, or its version is not listed anywhere, not in the web UI and not in the file below.

### A File That a Client Uploaded Wins

When a client has uploaded a `maven-metadata.xml`, Repsy serves that file as it is, together with the checksums that are stored next to it. A checksum that nobody stored is not made up for a stored file, because it would not match it.

### A Missing File Is Generated From the Registered Versions

When nobody uploaded the file of an artifact, Repsy answers a `GET` or a `HEAD` for it and for its four checksums from the versions it has registered for that artifact, instead of `404`. That is what makes `LATEST`, `RELEASE`, version ranges, Gradle `1.+`, Ivy `latest.release` and sbt `latest.release` find the versions of an artifact that Ivy or sbt published.

- The versions are sorted like Maven sorts them. `latest` is the highest version and `release` is the highest version that is not a SNAPSHOT. `latest` is not the version that was deployed last: publishing `1.5.0` after `2.0.0` leaves `2.0.0` as `latest`.
- `lastUpdated` is the time the newest version was registered, never the time of the request, so two requests without a publish in between get the same bytes and a checksum always matches its file.
- Nothing is stored. The generated file is not in **Browse Files** and takes no disk space, and it changes as soon as a version is published or deleted.
- A signature (`maven-metadata.xml.asc`) is never generated: it answers `404`.
- An artifact that has no registered version, and a group that has no registered plugin, still answer `404`.
- Reading follows the usual rules: a private repository answers `401` without credentials before it tells whether an artifact exists.

A `HEAD` request is answered like the `GET` of the same path without the body, for a generated file as for any other file. Ivy and sbt send one before they publish, to find out whether a file exists.

### Mixing Publishers on One Artifact

Say `mvn deploy` published `1.0` and uploaded its own `maven-metadata.xml`, which lists `1.0`. Then sbt or Ivy publishes `2.0`, which uploads no file. The stored file wins over the generated one, so without any help `2.0` would stay hidden from `LATEST` and `[1.0,)`.

Repsy therefore keeps a stored file complete. When a POM registers a version that the stored `maven-metadata.xml` does not list, Repsy:

1. adds the version to the file and sorts the versions,
2. recomputes `latest`, `release` and `lastUpdated`,
3. rewrites the checksums that are stored next to the file, and
4. deletes a stored `maven-metadata.xml.asc`, because the signature no longer verifies the new content.

A file that already lists every registered version is left byte for byte as it is, with its signature.

The other order works without any help. When Maven deploys after Ivy or sbt published, Maven reads the generated file first and uploads a file that lists the versions of Ivy or sbt as well.

Two rules keep this safe:

- Repsy only adds. A version that the file lists and that Repsy does not know is kept, and a file that cannot be parsed is left untouched.
- It is done after the version is registered and never fails the publish. If the file cannot be updated, the publish still succeeds and Repsy logs a warning.

Deleting a version in the web UI removes it from a stored file, and an artifact without a stored file has nothing to update, see [Browsing and Deleting Packages](../../repositories/browsing-and-deleting-packages/).

### Plugin Prefixes

`mvn hello:hi` looks up the prefix `hello` in the `maven-metadata.xml` of every group in `pluginGroups` of `settings.xml`. Maven uploads that file when it deploys a plugin, but Gradle, sbt, Ivy and a plain `PUT` do not, so a plugin that they published was not found by its prefix.

When no file of the group is stored, Repsy answers a `GET` or a `HEAD` for it and for its four checksums from the plugins that it has registered for the group: a POM with the packaging `maven-plugin`. The file has one `<plugin>` for each plugin, with its `<name>`, its `<prefix>` and its `<artifactId>`, in the order of the artifact IDs. As with the file of an artifact, a stored file is served as it is, nothing is stored for a generated one and its signature is `404`.

The path of a file of a group has the same shape as the path of a file of an artifact: `com/acme/tools/maven-metadata.xml` is the artifact `tools` of the group `com.acme`, and also the group `com.acme.tools`. Repsy answers the file of the artifact first and the file of the group only when no artifact of that name is registered.

### SNAPSHOT Versions

The `maven-metadata.xml` in the directory of a SNAPSHOT version, for example `demo/1.1.0-SNAPSHOT/maven-metadata.xml`, is never generated. Maven and Gradle upload it together with their timestamped files, and Ivy and sbt publish a SNAPSHOT under its literal file names (`demo-1.1.0-SNAPSHOT.jar`), which Maven, Gradle and Ivy resolve without any metadata.

A literal `-SNAPSHOT` file that Ivy or sbt publishes again replaces the stored one, and it is not an override, so it works with **Package Override** set to **Deny**. Releases and timestamped builds stay immutable. See [Maven Upload Rules](../maven-upload-rules/#package-override).

In the web UI a SNAPSHOT without a version-level `maven-metadata.xml` shows the newest POM stored for it: the POM of the newest timestamped build, or the literal `-SNAPSHOT` POM when there is no build.

### Using Ivy With Repsy

Ivy reads and publishes to a Repsy repository through the Maven layout only: an `ibiblio` resolver with `m2compatible="true"`, a publish with `publishivy="false"` and a POM that `ivy:makepom` writes. Ivy and sbt find their credentials by the realm of the `Basic` challenge, and Repsy uses the realm `Repsy` for every protocol, so the credentials of `ivysettings.xml` and of sbt's `Credentials` name the realm `Repsy`. A configuration that names another realm sends no credentials and gets `401`.

### Limits

- **A stale upload can hide a version.** Maven computes its file from a copy it read before its upload. If Ivy or sbt publishes a version of the same artifact between that read and the upload, the file Maven stores does not list it, and it stays hidden from dynamic versions until the next POM of that artifact registers.
- **A delete and a publish at the same moment.** A version that you delete in the web UI while another version of the same artifact is being published can be listed in the file again although it is deleted. Resolving that version then fails with `404`.
- **One Repsy process.** The updates of one artifact's file wait for each other inside one Repsy process. Several Repsy instances that share one storage are not protected against each other.
- **The file is rewritten.** An update writes the file again from what Repsy understands of it. Elements that Maven does not define, and XML comments, are lost.
- **Plugin prefixes come from the artifact ID.** Repsy derives the prefix like Maven does when it has no other information: `hello-maven-plugin` and `maven-hello-plugin` give `hello`. A plugin that sets its own `goalPrefix` and was published without the file of the group is not found by its prefix. Publish such a plugin with Maven, which uploads the file.
- **A stored file of a group is not extended.** A file of a group that Maven uploaded lists the plugins Maven knew then. A plugin that Gradle, sbt or Ivy publishes into the same group later is not added to it.
