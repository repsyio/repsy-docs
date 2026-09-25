+++
title = "Maven Upload Rules"
weight = 390
+++

Every file that Maven or Gradle uploads passes a few rules before Repsy Open Source stores it. This page lists them, the repository settings that change them, and what your build tool sees when a rule refuses an upload. A refused upload changes nothing in the repository.

### Who Can Upload

- A **user account** (username and password) can upload to every repository of the instance.
- A **deploy token** with the **Read/Write** access type can upload to its own repository. A **Read Only** token is refused with `401` when it tries to upload, and so is a token that is expired, revoked or from another repository.
- Nobody can upload anonymously, not even to a public repository: an anonymous upload is refused with `401`.

Only administrators can change the settings below. See [Creating a Private Maven Repository](../creating-private-maven-repository/) for the credentials.

### The Layout of a Path

Maven and Gradle upload each file to a path in the Maven repository layout, and Repsy accepts only such paths:

```
<group-path>/<artifact-id>/<version>/<artifact-id>-<version>[-<classifier>].<extension>
```

The group ID becomes the group path, with dots replaced by `/`. For example, `com.example:demo:1.0.0` is uploaded to `com/example/demo/1.0.0/demo-1.0.0.jar`. A file outside this layout is refused with `400` and is not stored:

- identifier `invalidArtifactPath`
- message `The path is not a valid Maven artifact path. Expected <group>/<artifactId>/<version>/<artifactId>-<version>[-<classifier>].<extension>.`

The file name has to start with the artifact ID and the version of its directory. In the directory of a SNAPSHOT version, for example `demo/1.1.0-SNAPSHOT/`, the file has to carry the artifact ID and the base version (`1.1.0`) and either the literal `SNAPSHOT` or a timestamp and build number, like `demo-1.1.0-20260925.101010-1.jar`. The `maven-metadata.xml` file of an artifact is accepted, and so is the version-level `maven-metadata.xml` of a SNAPSHOT version, each with its checksums.

Build tools always produce correct paths. You meet this rule when you upload files by hand, for example with `curl`.

### The POM

The POM of a version registers the version in the repository, and it is what makes the version appear in the web UI. Repsy reads it when it is uploaded:

- A POM that cannot be parsed is refused with `400`, identifier `malformedPomFile`, message `POM file is malformed or incomplete, please fix it and retry the deployment.`
- The `groupId` of the POM (or, when the POM has none, the `groupId` of its `parent`) has to be the group of the directory it is uploaded to. Otherwise Repsy refuses it with `400`, identifier `pomGroupIdMismatch`, message `The POM declares a groupId that is not the one of its path; its <groupId> (or <parent><groupId>) must equal the directory group.` The artifact ID and the version of the POM are not compared with the path.

### Package Override

The **Package Override** setting decides what happens when a file that already exists is uploaded again.

| Setting | Behaviour |
| --- | --- |
| **Allow** (the default of a new repository) | The file is replaced. |
| **Deny** | The upload is refused with `403`: identifier `artifactOverrideIsProhibited`, message `Artifact override is prohibited in this repository!` |

What counts as an override:

- Any file of a release version that is already stored, for example the second `mvn deploy` or `gradle publish` of `1.0.0`, and the checksum of a file that already has one.
- Not the `maven-metadata.xml` files and their checksums: they are rewritten on every deploy and are never refused.
- Not a SNAPSHOT deploy by Maven or Gradle. Every deploy writes new timestamped files (`demo-1.1.0-20260925.101010-1.jar`, then `...-2.jar`) and rewrites the metadata, so you can deploy a SNAPSHOT again and again, also with **Deny**.

Maven and Gradle stop at the first refusal. A refused redeploy of a release is refused on the first file it sends, so it leaves the repository as it was, and everything that was published earlier stays downloadable.

### Version Allowance

A Maven repository can accept only one kind of version. The **Version Allowance** setting has three values:

| Setting | Release versions (`1.0.0`) | SNAPSHOT versions (`1.0.0-SNAPSHOT`) |
| --- | --- | --- |
| **all packages** (the default of a new repository) | accepted | accepted |
| **snapshots** | refused | accepted |
| **releases** | accepted | refused |

An upload of a kind that is not allowed is refused with `403`:

- a release: identifier `releaseVersionsAreProhibited`, message `Release versions are prohibited in this repository!`
- a SNAPSHOT: identifier `snapshotVersionsAreProhibited`, message `Snapshot versions are prohibited in this repository!`

The rule applies to every file of that kind, also for a version that already exists: switching a kind off stops you from redeploying the versions of that kind that were published earlier, and what was published stays downloadable. The version-level `maven-metadata.xml` of a SNAPSHOT counts as a SNAPSHOT file. The `maven-metadata.xml` of the artifact and of the group list versions of both kinds and are never refused.

When both rules would refuse an upload, Package Override is checked first and you get `artifactOverrideIsProhibited`.

### Checksums, Signatures and Metadata

- A checksum (`.sha1`, `.md5`, `.sha256`, `.sha512`) is judged by the file it belongs to: it has to be in the layout, and it is refused when its file would be refused. A checksum of `maven-metadata.xml` is judged by its directory: only the ones in a SNAPSHOT directory count as SNAPSHOT files.
- A signature (`.asc`) is verified before it is stored, see [Signing Maven Artifacts](../signing-maven-artifacts/) for the answers.
- Repsy stores the `maven-metadata.xml` files that your build tool uploads, and it does not generate them. Maven `LATEST`, version ranges and Gradle dynamic versions such as `1.+` resolve through them, so they work for artifacts published with Maven or Gradle. For an artifact uploaded by other means without metadata, use fixed versions.

### Summary of the Answers

| Status | Identifier | Message | Cause |
| --- | --- | --- | --- |
| `401` | | | Missing or wrong credentials, a read-only, expired, revoked or foreign deploy token, or an anonymous upload |
| `403` | `artifactOverrideIsProhibited` | `Artifact override is prohibited in this repository!` | **Package Override** is **Deny** and the file exists |
| `403` | `releaseVersionsAreProhibited` | `Release versions are prohibited in this repository!` | **Version Allowance** is **snapshots** |
| `403` | `snapshotVersionsAreProhibited` | `Snapshot versions are prohibited in this repository!` | **Version Allowance** is **releases** |
| `400` | `invalidArtifactPath` | `The path is not a valid Maven artifact path. Expected ...` | The path is outside the Maven layout |
| `400` | `malformedPomFile` | `POM file is malformed or incomplete, please fix it and retry the deployment.` | The POM cannot be read |
| `400` | `pomGroupIdMismatch` | `The POM declares a groupId that is not the one of its path; ...` | The group of the POM is not the group of the path |
| `422`, `404` | `artifactSignatureNotVerified`, `artifactSigningKeyNotFound`, `artifactSigningKeyNotRegistered`, `pendingSignatureNotVerified` | | A signature is refused, see [Signing Maven Artifacts](../signing-maven-artifacts/#what-your-build-tool-sees) |

The identifier is in the `msgId` field of the JSON body of the answer. Your build tool prints the status and, depending on the tool, the message.
