+++
title = "Using Private Maven Repository"
weight = 2
+++

Congratulations, your [Repsy](https://repsy.io) account has been successfully created! You currently have your own `default` Maven repository.

It is now time to use this repository in your projects. Instead of inserting the credentials of your private repository to each of your Maven projects, you may create a global Maven settings file which includes your credentials  and is automatically used by all of your projects. 

Let’s begin creating the settings file.

## Creating settings.xml file

### In Linux and Mac

You can create the `.m2` directory under the home directory first - which is supposed to be created earlier by Maven - and the settings file by typing the following commands in the command line. Please do not forget to change the *MY REPSY USERNAME* and *MY REPSY PASSWORD* place holders  with your exact Repsy credentials.

```bash
mkdir -p ~/.m2/
cat << EOF > ~/.m2/settings.xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
    http://maven.apache.org/xsd/settings-1.0.0.xsd">

    <servers>
        <server>
        <id>repsy</id>
        <username>MY REPSY USERNAME</username>
        <password>MY REPSY PASSWORD</password>
        </server>
    </servers>
</settings>
EOF
```

### In Windows

Press `Win + R` key and write `%USERPROFILE%` in the prompt section to go to your home directory. You can now create a `.m2` folder.

Inside the `.m2` folder create a text file and rename it as `settings.xml`. Copy the following content into this file.  Please do not forget to change the *MY REPSY USERNAME* and *MY REPSY PASSWORD* place holders  with your exact Repsy credentials.

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
    http://maven.apache.org/xsd/settings-1.0.0.xsd">

    <servers>
        <server>
        <id>repsy</id>
        <username>MY REPSY USERNAME</username>
        <password>MY REPSY PASSWORD</password>
        </server>
    </servers>
</settings>
```
You can now save and close the settings file.

## Deploying your Java library to Private Maven Repository

If you consider deploying your Java library to your private Maven repository,  you should first define a distribution repository in your `pom.xml` file as seen in the following example. In order to adapt the following content to your needs,  please modify the *{MY REPSY USERNAME}* and *{MY REPOSITORY NAME}* fields in the repository URL to match your project.

```xml
<project   >
  <!-- ... Other project settings -->

  <distributionManagement>
    <!-- ... Some other Distribution repository definitions -->

    <repository>
      <id>repsy</id>
      <name>My Private Maven Repository on Repsy</name>
      <url>https://repo.repsy.io/mvn/{MY REPSY USERNAME}/{MY REPOSITORY NAME}</url>
    </repository>

    <!-- ... Some other Distribution repository definitions -->
  </distributionManagement>

  <!-- ... Other project settings -->
</project>
```

You are now ready to deploy! Please run:

```bash
mvn deploy
```

from the command line. If Maven has not been installed before, you can run `./mvwn deploy` for Linux/Mac or `mvnw deploy` for Windows.

Meanwhile, most modern IDEs and editors also provide other methodologies for executing maven commands.

You can find a deployment example in [GitHub](https://github.com/repsyio/example-maven-deploy) as well.

## Using your Java library from your Private Maven Repository

You have deployed your Java library and now want to use it in your Java projects. First, you need to add a repository section in your `pom.xml` file, similar to distribution repository. Please do not forget to modify the *{MY REPSY USERNAME}* and *{MY REPOSITORY NAME}* fields in the repository URL to match your project.

```xml
<project   >
  <!-- ... Other project settings -->
  <repositories>
    <!-- ... some other repository definitions -->

    <repository>
      <id>repsy</id>
      <name>My Private Maven Repository on Repsy</name>
      <url>https://repo.repsy.io/mvn/{MY REPSY USERNAME}/{MY REPOSITORY NAME}</url>
    </repository>

    <!-- ... some other repository definitions -->
  </repositories>
  
  <!-- ... Other project settings -->
</project>
```

Secondly, you need to define your dependency in `pom.xml` as well.


```xml
<project   >
  <!-- ... Other project settings -->
  <repositories>
    <!-- ... some other repository definitions -->

    <repository>
      <id>repsy</id>
      <name>My Private Maven Repository on Repsy</name>
      <url>https://repo.repsy.io/mvn/{MY REPSY USERNAME}/{MY REPOSITORY NAME}</url>
    </repository>

    <!-- ... some other repository definitions -->
  </repositories>
  
  <!-- ... Other project settings -->
</project>
```

You are now ready to compile the project!

Please run
```bash
mvn compile
```
from the command line. 

If Maven has not been installed before, you can run `./mvwn compile` for Linux/Mac or `mvnw compile` for Windows.

You can also have a look at example implementation in [GitHub](https://github.com/repsyio/example-maven-usage).

## Further Reading

Please refer to the official [documentation](https://maven.apache.org/plugins/maven-deploy-plugin/index.html) of Apache Maven Deploy Plug-in for further information.
