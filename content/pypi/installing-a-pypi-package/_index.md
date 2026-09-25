+++
title = "Installing a PyPI Package"
weight = 63
+++

To install the latest stable version of a package, please run:

````bash
pip install <package_name> --index-url {{% repo-url %}}/<registry_name>/simple
````
from the command line. Please do not forget to change the *<package_name>*, *&lt;username&gt;*, and *<registry_name>* placeholders with your exact Repsy username and package and registry names.

You can install packages from public registries without authentication, but if your registry is private, then you must authenticate. For private registries, please run:

````bash
pip install <package_name> --index-url https://<username>:<password>@{{% repo-url scheme="false" %}}/<registry_name>/simple
````

from the command line.

The `pip` supports three types of authentication: HTTP authentication, authentication from `.netrc` files, and authentication from `keyring` library. You can use the one that suits you best.


