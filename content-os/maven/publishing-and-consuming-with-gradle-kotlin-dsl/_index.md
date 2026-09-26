+++
title = "Publishing and Consuming with Gradle (Kotlin DSL)"
weight = 371
description = "Publish a Java library with Gradle and the maven-publish plugin in the Kotlin DSL, then consume it from another Gradle build."
+++

This tutorial publishes a Java library to a Repsy Open Source Maven repository with Gradle and the `maven-publish` plugin, and uses it from another Gradle build. The build files are written in the Kotlin DSL (`build.gradle.kts`). If your builds use the Groovy DSL, see [Publishing and Consuming with Gradle (Groovy DSL)](../publishing-and-consuming-with-gradle-groovy-dsl/).

### Prerequisites

- A Maven repository on your Repsy Open Source instance, see [Creating a Private Maven Repository](../creating-private-maven-repository/). The examples use the repository URL `{{% repo-url %}}/<repo-name>`. There is no username in the URL.
- A JDK and Gradle (or a project with the Gradle wrapper).
- A credential: your username and password, or a [deploy token](../creating-private-maven-repository/#get-your-credentials). A deploy token goes into the password and needs the **Read/Write** access type to publish; the username can be any non-empty value.

{{% notice note %}}
Gradle refuses a repository on plain HTTP unless you allow it explicitly. Serve a shared instance over HTTPS. For a test instance on plain HTTP (for example `http://localhost:9090`) add `isAllowInsecureProtocol = true` to the `maven { }` block. Without it Gradle stops with "Using insecure protocols with repositories, without explicit opt-in, is unsupported".
{{% /notice %}}

{{< steps >}}
### Store the credentials outside the build file

Do not write the credentials into `build.gradle.kts`, which you commit. Put them into the user-level `gradle.properties`, which is `~/.gradle/gradle.properties` (on Windows `%USERPROFILE%\.gradle\gradle.properties`):

```properties
repsyUsername=MY REPSY USERNAME
repsyPassword=MY REPSY PASSWORD OR DEPLOY TOKEN
```

In a CI job, pass them as environment variables instead. Gradle turns `ORG_GRADLE_PROJECT_<name>` into the project property `<name>`:

```bash
export ORG_GRADLE_PROJECT_repsyUsername="MY REPSY USERNAME"
export ORG_GRADLE_PROJECT_repsyPassword="MY REPSY PASSWORD OR DEPLOY TOKEN"
```

### Configure publishing

A minimal library project has a `settings.gradle.kts` with the name of the project, which becomes the artifact ID:

```kotlin
rootProject.name = "demo"
```

and a `build.gradle.kts` that applies `maven-publish` and names the repository:

```kotlin
plugins {
    `java-library`
    `maven-publish`
}

group = "com.example"
version = "1.0.0"

java {
    withSourcesJar()
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
        }
    }
    repositories {
        maven {
            name = "repsy"
            url = uri("{{% repo-url %}}/<repo-name>")
            credentials {
                username = findProperty("repsyUsername") as String?
                password = findProperty("repsyPassword") as String?
            }
        }
    }
}
```

### Publish a release version

```bash
./gradlew publish
```

Gradle uploads the jar, the sources jar, the POM and the Gradle module metadata (`.module`), with their checksums, and the `maven-metadata.xml` files. On Windows run `gradlew publish`, and with a global Gradle installation `gradle publish`.

Publishing the same release version again works when the repository's **Package Override** setting is **Allow**, which is the default of a new repository. When it is **Deny**, Repsy refuses the second publish with `403` and changes nothing, see [Maven Upload Rules](../maven-upload-rules/).

### Publish a SNAPSHOT version

Set a version that ends in `-SNAPSHOT`, for example `version = "1.1.0-SNAPSHOT"`, and run `./gradlew publish` again. Gradle uploads timestamped files and a version-level `maven-metadata.xml` that points to the newest build. Every publish writes new timestamped files, so it is never an override, also when **Package Override** is **Deny**.

If the **Version Allowance** setting of the repository is **releases**, SNAPSHOT versions are refused, and **snapshots** refuses release versions.

### Consume the artifact

In the build that uses the library, add the repository and the dependency to `build.gradle.kts`:

```kotlin
repositories {
    mavenCentral()
    maven {
        url = uri("{{% repo-url %}}/<repo-name>")
        credentials {
            username = findProperty("repsyUsername") as String?
            password = findProperty("repsyPassword") as String?
        }
    }
}

dependencies {
    implementation("com.example:demo:1.0.0")
}
```

A private repository needs the credentials, and a public repository can be read without them: leave out the `credentials { }` block. Then run `./gradlew build`.

Gradle caches a `-SNAPSHOT` dependency for 24 hours before it asks Repsy for a newer build. Run `./gradlew build --refresh-dependencies` to check right away, or shorten the cache in the build:

```kotlin
configurations.all {
    resolutionStrategy.cacheChangingModulesFor(0, "seconds")
}
```

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. Find your artifact in the list, with its group, its artifact ID and its latest version, and open it to see its versions. A version shows the POM and ready-made dependency snippets, including **Gradle Kotlin DSL** and **Gradle Groovy DSL**.
3. **Browse Files** shows the stored files, including the `.module` file.
{{< /steps >}}

### Dynamic Versions

Dynamic versions such as `1.+` and dependency locking resolve through the artifact's `maven-metadata.xml`. Repsy stores the metadata file that Gradle uploads with `publish`, so they work for artifacts published by Gradle and Maven. For an artifact that has no stored metadata file, for example one that Apache Ivy, sbt or a plain HTTP `PUT` published, Repsy generates the answer from the versions it has registered, so they resolve there too. When several clients publish to the same artifact, Repsy also adds a version that a stored file lacks. See [Dynamic Versions and maven-metadata.xml](../dynamic-versions-and-maven-metadata/) for the rules and the limits.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `Could not PUT '...'. Received status code 401` or `Could not GET '...'. Received status code 401` | The credentials are wrong, or the deploy token is read-only (publishing only), expired, revoked or belongs to another repository. Nobody can publish anonymously. |
| `Received status code 403`, message `Artifact override is prohibited in this repository!` | The file already exists and **Package Override** is **Deny**. |
| `Received status code 403`, message `Release versions are prohibited in this repository!` or `Snapshot versions are prohibited in this repository!` | **Version Allowance** of the repository does not allow that kind of version. |
| `Using insecure protocols with repositories, without explicit opt-in, is unsupported` | The repository URL uses plain HTTP, see the note above. |
| `Could not resolve com.example:demo:1.0.0` | The version does not exist in that repository, or the repository is missing from `repositories { }`. |

Repsy sends the identifier of the error and the message in a JSON body. More refusals and their answers are listed in [Maven Upload Rules](../maven-upload-rules/).
