+++
title = "Maven"
chapter = true
weight = 300
description = "Guides for hosting Maven repositories: create one, publish and consume artifacts with Maven and Gradle, sign artifacts and learn the upload rules."
+++

# Maven

This documentation contains a user guide and samples regarding the use of private and public Maven repositories in Repsy Open Source. A Maven repository serves every client that speaks the Maven repository layout: Apache Maven, Gradle (Kotlin DSL and Groovy DSL) and Gradle plugin builds.

The URL of a Maven repository is the address of your instance's repository port followed by the name of the repository, `{{% repo-url %}}/<repo-name>`. There is no username in the URL.

### Getting Started

- [Creating a Private Maven Repository](creating-private-maven-repository/): create a repository and get your credentials.
- [Using a Private Maven Repository](using-private-maven-repository/) and [Using a Public Maven Repository](using-public-maven-repository/): the `settings.xml` and `pom.xml` setup for Maven.
- [Using Repository with Gradle](using-repository-with-gradle/): a short Gradle setup.

### Tutorials

- [Publishing and Consuming with Maven](publishing-and-consuming-with-maven/): release and SNAPSHOT versions, credentials, verification and troubleshooting.
- [Publishing and Consuming with Gradle (Kotlin DSL)](publishing-and-consuming-with-gradle-kotlin-dsl/) and [Publishing and Consuming with Gradle (Groovy DSL)](publishing-and-consuming-with-gradle-groovy-dsl/).
- [Using Repsy as a Gradle Plugin Repository](using-repsy-as-a-gradle-plugin-repository/): publish a Gradle plugin and apply it with `plugins {}`.
- [Dynamic Versions and maven-metadata.xml](dynamic-versions-and-maven-metadata/): how `LATEST`, version ranges, `1.+`, `latest.release` and plugin prefixes resolve when Maven, Gradle, Ivy and sbt publish to the same repository.

### Signing and Upload Rules

- [Signing Maven Artifacts](signing-maven-artifacts/): how Repsy verifies PGP signatures, and how to sign with Maven and Gradle.
- [Maven Upload Rules](maven-upload-rules/): what Repsy accepts on upload and what each refusal looks like to your build tool.
