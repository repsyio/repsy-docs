+++
title = "Using a Public Maven Repository"
weight = 330
description = "Deploy Java libraries to a public Maven repository that anyone can download from, using the same steps as for a private one."
+++

You may want to share some of your artifacts publicly in some cases. It is quite possible to make them publicly available in {{< product "cloud" >}}[Repsy](https://repsy.io){{< /product >}}{{< product "os" >}}Repsy Open Source by setting the visibility of the repository to public in its settings{{< /product >}} whenever you want.

Please keep in mind that {{< product "cloud" >}}[Repsy](https://repsy.io) does not support anonymous deployment due to security reasons, but clients can always access and download public artifacts without a [Repsy](https://repsy.io) account.{{< /product >}}{{< product "os" >}}Repsy Open Source does not support anonymous deployment due to security reasons, but clients can always access and download public artifacts without credentials.{{< /product >}}

{{< steps >}}
### Creating settings.xml file

You may refer to the [user documentation of the private Maven repository](../using-private-maven-repository#creating-settingsxml-file) for detailed instructions. 

### Deploying your Java library to Public Maven Repository

You may refer to the [user documentation of the private Maven repository](../using-private-maven-repository#deploying-your-java-library-to-private-maven-repository) for detailed instructions.

### Using your Java library from your Public Maven Repository

Deployment and usage instructions for Java libraries mentioned in the section of private Maven repositories are totally applicable for public Maven repositories as well.

In the meantime, if your clients just want to use libraries, there is no need to configure a `settings.xml` file. In such a case, it is sufficient to define repository URL and dependency in `pom.xml` file.

Please refer to the [user documentation](../using-private-maven-repository#using-your-java-library-from-your-private-maven-repository) for the detail of instructions mentioned above.
{{< /steps >}}
