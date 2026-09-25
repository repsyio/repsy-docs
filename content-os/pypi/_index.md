+++
title = "PyPI"
chapter = true
weight = 600
description = "Guides for hosting PyPI repositories: create one, publish packages with twine and install them with pip."
+++

# PyPI

This documentation contains a user guide and samples regarding the use of private and public PyPI repositories in Repsy Open Source. A PyPI repository serves `twine` for uploading and `pip` for installing.

The address of a PyPI repository is the address of your instance's repository port followed by the name of the repository, `{{% repo-url %}}/<repo-name>`. There is no username in the address. You upload to that address, and you install from the simple index below it, `{{% repo-url %}}/<repo-name>/simple`.

### Getting Started

- [Creating a Private PyPI Registry](creating-a-private-pypi-registry/): create a repository and get your credentials.
- [Publishing a PyPI Package](publishing-a-pypi-package/) and [Installing a PyPI Package](installing-a-pypi-package/): a short setup for `twine` and `pip`.

### Tutorials

- [Publishing a Python Package with twine](publishing-a-python-package-with-twine/): build a package, upload it, credentials, the rules Repsy applies to an upload and what each refusal looks like.
- [Installing Python Packages with pip](installing-python-packages-with-pip/): the index URL, credentials, `pip.conf`, requirements files, CI jobs and troubleshooting.
