+++
title = "Installing Packages"
weight = 3
+++

To install the latest stable version of a package, please run:

````bash
pip install <package_name> --index-url https://repo.repsy.io/pypi/<username>/<registry_name>/simple
````
from the command line. Please do not forget to change the *<package_name>*, *< username >*, and *<registry_name>* place holders with your exact Repsy username and package and registry names.

You can install packages from public registries without authentication, but if your registry is private, then you must authenticate. For private registries, please run:

````bash
pip install <package_name> --index-url https://<username>:<password>@repo.repsy.io/pypi/<username>/<registry_name>/simple
````

from the command line.

The`pip` supports three types of authentication: HTTP authentication, authentication from `.netrc` files, and authentication from `keyring` library. You can use the one that suits you best.


