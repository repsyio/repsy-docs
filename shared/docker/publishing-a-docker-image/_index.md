+++
title = "Publishing a Docker Image"
weight = 220
+++

{{< product "cloud" >}}You have registered and created a registry on [Repsy](https://repsy.io/).{{< /product >}}{{< product "os" >}}You have created a registry on your Repsy Open Source instance.{{< /product >}} You are now ready to publish images to your registry.

In order to successfully publish images to {{< product "cloud" >}}your `default` registry{{< /product >}}{{< product "os" >}}your registry{{< /product >}}, you must authenticate. 

To authenticate, you can use docker cli's `login` command with the repo base URL. You can run:

```bash
docker login {{% repo-url scheme="false" account="false" %}}
```

{{< product "cloud" >}}This command will ask you username, password, and email address. Please use the same username and password here that you used to register to [Repsy](https://repsy.io/){{< /product >}}{{< product "os" >}}This command asks you for a username and a password. Enter the username and password of a user of your Repsy Open Source instance. Instead of the password you can use a [deploy token](../../getting-started/creating-a-deploy-token/): put the token in the password prompt, and the username can be any value{{< /product >}}. If this command is executed successfully, you will be authenticated to the registry and be ready to publish your image. As a final step, please run the following command:

```bash
docker push {{% repo-url scheme="false" %}}/<repo-name>/<image-name>:<image-tag>
```

With this command docker will publish the image to {{< product "cloud" >}}your `default` registry{{< /product >}}{{< product "os" >}}your registry{{< /product >}}.

Congratulations, you have published an image to your registry! You can now install your image.

{{< product "os" >}}
Docker talks to the registry over HTTPS, except for `localhost`, where plain HTTP is accepted. If your instance runs on another host, serve it over HTTPS.

[Pushing and Pulling Images with Docker](../pushing-and-pulling-images-with-docker/) explains this, the naming of images, and what Repsy does with the layers and the manifest you push.
{{< /product >}}
