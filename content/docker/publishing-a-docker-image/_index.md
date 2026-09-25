+++
title = "Publishing a Docker Image"
weight = 22
+++

{{< product "cloud" >}}You have registered and created a registry on [Repsy](https://repsy.io/).{{< /product >}}{{< product "os" >}}You have created a registry on your Repsy OS instance.{{< /product >}} You are now ready to publish images to your registry.

In order to successfully publish images to your `default` registry, you must authenticate. 

To authenticate, you can use docker cli's `login` command with the repo base URL. You can run:

```bash
docker login {{% repo-url scheme="false" account="false" %}}
```

This command will ask you username, password, and email address. Please use the same username and password here that you {{< product "cloud" >}}used to register to [Repsy](https://repsy.io/){{< /product >}}{{< product "os" >}}use for your Repsy OS instance{{< /product >}}. If this command is executed successfully, you will be authenticated to the registry and be ready to publish your image. As a final step, please run the following command:

```bash
docker push {{% repo-url scheme="false" %}}/<registryName>/<imageName>:<imageTag>
```

With this command docker will publish the image to your `default` registry.

Congratulations, you have published an image to your registry! You can now install your image.


