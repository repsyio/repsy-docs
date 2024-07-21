+++
title = "Using Repository with Gradle"
weight = 4
+++

If you are using Gradle as a dependency management tool, [Repsy](https://repsy.io) is quite convenient for both deploying and downloading operations as well.

## Deployment

If you are intended to use a [Repsy](https://repsy.io) Maven repository as a deployment environment, in both private and public cases, you will need repository credentials for package deployment. By default, [Gradle publish plug-in](https://docs.gradle.org/current/userguide/publishing_maven.html) enforces you to use credentials inside `build.gradle`.

### Configuring build.gradle

For configuration, you can start adding the following section into your `build.gradle` file. Please modify URL, username, and password sections to match your repository settings.

```groovy
publishing {
    publications {
        maven(MavenPublication) {
            from components.java
        }
    }

    repositories {
        maven {
            url 'https://repo.repsy.io/mvn/{MY REPSY USERNAME}/{MY REPOSITORY NAME}'
            credentials {
                username 'MY REPSY USERNAME'
                password 'MY REPSY PASSWORD'
            }
        }
    }
}
```

Alternatively, you may consider putting your variables into `gradle.properties` in your home directory.

#### Configuring gradle.properties

##### For Windows:

Press `Win + R` key and write `%USERPROFILE%` in the prompt section to go to your home directory. You can find `gradle.properties` inside the `.gradle` folder.

##### For Linux/Mac:

Please open the file in `~/.gradle/gradle.properties` path. If the properties file does not exist, you may create one.

Please add the following variables into your `gradle.properties` file by adjusting values to your repository settings.

```properties
repsyUrl=https://repo.repsy.io/mvn/{MY REPSY USERNAME}/{MY REPOSITORY NAME}
repsyUsername=MY REPSY USERNAME
repsyPassword=MY REPSY PASSWORD
```

Finally, you can change your `build.gradle` file as follows:

```groovy
publishing {
    publications {
        maven(MavenPublication) {
            from components.java
        }
    }

    repositories {
        maven {
            url repsyUrl
            credentials {
                username repsyUsername
                password repsyPassword
            }
        }
    }
}
```

After configuration is completed, you can run the following command.

If Gradle is installed globally, run:

```bash
gradle publish
```

If Gradle wrapper is inside your project directory, run:

for Windows:

```
gradlew publish
```

for Linux/Mac:

```
./gradlew publish
```

You can find an example implementation in [GitHub](https://github.com/repsyio/example-gradle-deploy).

## Usage

If you are using a private Maven repository and have already configured your `gradle.properties` file, please add the following section into your `build.gradle` file.

```groovy
repositories {
    mavenCentral()

    maven {
        url repsyUrl
        credentials {
            username repsyUsername
            password repsyPassword
        }
    }
}
```

If you are using a public repository, you may ignore the credentials section.

```groovy
repositories {
    mavenCentral()

    maven {
        url repsyUrl
    }
}
```

You can now build your project! Run:

```bash
./gradlew build
```

You can find an example implementation in [GitHub](https://github.com/repsyio/example-gradle-usage).
