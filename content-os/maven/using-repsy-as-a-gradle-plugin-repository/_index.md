+++
title = "Using Repsy as a Gradle Plugin Repository"
weight = 373
description = "Publish your own Gradle plugin to a Maven repository and apply it in other builds with the plugins block."
+++

A team that builds its own Gradle plugins can publish them to a Repsy Open Source Maven repository and apply them in other builds with the `plugins { }` block, without the Gradle Plugin Portal. This tutorial publishes a small plugin and applies it from a second build. The examples show the Kotlin DSL and the Groovy DSL.

### Prerequisites

- A Maven repository on your Repsy Open Source instance, see [Creating a Private Maven Repository](../creating-private-maven-repository/). The examples use the repository URL `{{% repo-url %}}/<repo-name>`.
- A JDK and Gradle.
- A credential: your username and password, or a [deploy token](../creating-private-maven-repository/#get-your-credentials). A deploy token goes into the password and needs the **Read/Write** access type to publish; a **Read Only** token is enough to apply the plugin. The username can be any non-empty value.
- The credentials in the user-level `gradle.properties` (`~/.gradle/gradle.properties`) or in environment variables, as described in [Publishing and Consuming with Gradle (Kotlin DSL)](../publishing-and-consuming-with-gradle-kotlin-dsl/#store-the-credentials-outside-the-build-file):

```properties
repsyUsername=MY REPSY USERNAME
repsyPassword=MY REPSY PASSWORD OR DEPLOY TOKEN
```

{{% notice note %}}
For a test instance on plain HTTP, Gradle needs `isAllowInsecureProtocol = true` (Kotlin DSL) or `allowInsecureProtocol = true` (Groovy DSL) in every `maven { }` block that points to it. Serve a shared instance over HTTPS.
{{% /notice %}}

### Write the plugin

Create a project with the `java-gradle-plugin` plugin. Its `gradlePlugin { }` block declares the plugin id and the class that implements it. Together with `maven-publish` it publishes two artifacts: the plugin jar, and a small "plugin marker" artifact that Gradle looks up when a build applies the plugin by id.

`settings.gradle.kts` (or `settings.gradle`) names the project. The name becomes the artifact ID of the plugin jar:

```kotlin
rootProject.name = "hello-plugin"
```

{{< tabs groupId="dsl" >}}
{{% tab name="Kotlin DSL" %}}
`build.gradle.kts`:

```kotlin
plugins {
    `java-gradle-plugin`
    `maven-publish`
}

group = "com.example"
version = "1.0.0"

gradlePlugin {
    plugins {
        create("hello") {
            id = "com.example.hello"
            implementationClass = "com.example.HelloPlugin"
        }
    }
}

publishing {
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
{{% /tab %}}
{{% tab name="Groovy DSL" %}}
`build.gradle`:

```groovy
plugins {
    id 'java-gradle-plugin'
    id 'maven-publish'
}

group = 'com.example'
version = '1.0.0'

gradlePlugin {
    plugins {
        hello {
            id = 'com.example.hello'
            implementationClass = 'com.example.HelloPlugin'
        }
    }
}

publishing {
    repositories {
        maven {
            name = 'repsy'
            url = uri('{{% repo-url %}}/<repo-name>')
            credentials {
                username = findProperty('repsyUsername')
                password = findProperty('repsyPassword')
            }
        }
    }
}
```
{{% /tab %}}
{{< /tabs >}}

The plugin class goes into `src/main/java/com/example/HelloPlugin.java`. This one adds a `hello` task:

```java
package com.example;

import org.gradle.api.Plugin;
import org.gradle.api.Project;

public class HelloPlugin implements Plugin<Project> {
    @Override
    public void apply(Project project) {
        project.getTasks().register("hello", task ->
            task.doLast(done -> System.out.println("Hello from a plugin in Repsy")));
    }
}
```

### Publish the plugin

```bash
./gradlew publish
```

Gradle uploads the plugin jar as `com.example:hello-plugin:1.0.0` (the group of the project and the name of the project) and the plugin marker as `com.example.hello:com.example.hello.gradle.plugin:1.0.0` (the plugin id twice), each with its POM and checksums.

The same rules as for any Maven artifact apply, for example **Package Override**: with **Deny**, publishing the same version again is refused with `403`, see [Maven Upload Rules](../maven-upload-rules/). The examples use a release version.

### Tell the consuming build where the plugin is

In the build that applies the plugin, name the repository in the `pluginManagement { }` block of `settings.gradle.kts` or `settings.gradle`, which Gradle reads before it resolves any plugin.

{{< tabs groupId="dsl" >}}
{{% tab name="Kotlin DSL" %}}
`settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        maven {
            url = uri("{{% repo-url %}}/<repo-name>")
            credentials {
                username = providers.gradleProperty("repsyUsername").get()
                password = providers.gradleProperty("repsyPassword").get()
            }
        }
        gradlePluginPortal()
    }
}
```
{{% /tab %}}
{{% tab name="Groovy DSL" %}}
`settings.gradle`:

```groovy
pluginManagement {
    repositories {
        maven {
            url = uri('{{% repo-url %}}/<repo-name>')
            credentials {
                username = providers.gradleProperty('repsyUsername').get()
                password = providers.gradleProperty('repsyPassword').get()
            }
        }
        gradlePluginPortal()
    }
}
```
{{% /tab %}}
{{< /tabs >}}

Naming `pluginManagement.repositories` replaces Gradle's default, the Gradle Plugin Portal, so a plugin can only come from the repositories you list. The examples add `gradlePluginPortal()` back, so that plugins from the portal keep working; leave it out if plugins must only come from Repsy. For a public repository leave out the `credentials { }` block.

### Apply the plugin

Apply the plugin by id and version in the `plugins { }` block of `build.gradle.kts` or `build.gradle`:

{{< tabs groupId="dsl" >}}
{{% tab name="Kotlin DSL" %}}
```kotlin
plugins {
    id("com.example.hello") version "1.0.0"
}
```
{{% /tab %}}
{{% tab name="Groovy DSL" %}}
```groovy
plugins {
    id 'com.example.hello' version '1.0.0'
}
```
{{% /tab %}}
{{< /tabs >}}

Run the task of the plugin:

```bash
./gradlew hello
```

### Verify the result in the web UI

Open your repository in the **Repositories** tab. The list has two artifacts for one plugin: `hello-plugin` in the group `com.example`, and the plugin marker `com.example.hello.gradle.plugin` in the group `com.example.hello`. **Browse Files** shows their files.

### Without the Plugin Marker

If the marker artifact is not in the repository, `plugins { id(...) version ... }` cannot find the plugin and Gradle stops with `Plugin [id: 'com.example.hello', version: '1.0.0'] was not found`. This happens when only the plugin jar was published. Either publish the marker too (`./gradlew publish` does), or map the plugin id to the jar by hand in `pluginManagement`, which needs no marker:

{{< tabs groupId="dsl" >}}
{{% tab name="Kotlin DSL" %}}
```kotlin
pluginManagement {
    repositories {
        // the maven { } block of Repsy from above
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.id == "com.example.hello") {
                useModule("com.example:hello-plugin:1.0.0")
            }
        }
    }
}
```
{{% /tab %}}
{{% tab name="Groovy DSL" %}}
```groovy
pluginManagement {
    repositories {
        // the maven { } block of Repsy from above
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.id == 'com.example.hello') {
                useModule('com.example:hello-plugin:1.0.0')
            }
        }
    }
}
```
{{% /tab %}}
{{< /tabs >}}

The build then applies the plugin with `plugins { id("com.example.hello") }` and no version.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `Plugin [id: '...', version: '...'] was not found in any of the following sources` | Gradle looked in the repositories of `pluginManagement` and did not find the plugin marker. Check the plugin id and version, the repository name in the URL, and that the plugin was published to that repository. Gradle lists the repositories it searched; the Repsy repository is among them when the `pluginManagement` block is right. |
| `Received status code 401` | The credentials are wrong, or the deploy token is expired, revoked or belongs to another repository. A private repository cannot be read anonymously, and nobody can publish anonymously. A read-only deploy token cannot publish. |
| `Received status code 403` while publishing | The repository refuses the upload, for example `Artifact override is prohibited in this repository!` when **Package Override** is **Deny** and the version exists. See [Maven Upload Rules](../maven-upload-rules/). |
| A plugin that is not in Repsy is not found although it exists on the Gradle Plugin Portal | `pluginManagement.repositories` replaced the default. Add `gradlePluginPortal()`. |
