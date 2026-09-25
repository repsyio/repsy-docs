+++
title = "Installing a PyPI Package"
weight = 630
+++

To install the latest stable version of a package, please run:

````bash
pip install <package-name> --index-url {{% repo-url %}}/<repo-name>/simple
````
from the command line. {{< product "cloud" >}}Please do not forget to change the `<package-name>`, `<username>`, and `<repo-name>` placeholders with your exact Repsy username and package and registry names.{{< /product >}}{{< product "os" >}}Please do not forget to change the `<package-name>` and `<repo-name>` placeholders with your package and repository names. `https://<your-repsy-host>` stands for the address of the package protocol port of your Repsy Open Source instance, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/).{{< /product >}}

You can install packages from public registries without authentication, but if your registry is private, then you must authenticate. For private registries, please run:

````bash
pip install <package-name> --index-url https://<username>:<password>@{{% repo-url scheme="false" %}}/<repo-name>/simple
````

from the command line.

The `pip` supports three types of authentication: HTTP authentication, authentication from `.netrc` files, and authentication from `keyring` library. You can use the one that suits you best.

{{< product "os" >}}
For a deploy token, put the token where the password goes: the username can be any value. See [Creating a Deploy Token](../../getting-started/creating-a-deploy-token/).

For persistent configuration, requirements files, CI jobs and troubleshooting, see [Installing Python Packages with pip](../installing-python-packages-with-pip/).
{{< /product >}}
