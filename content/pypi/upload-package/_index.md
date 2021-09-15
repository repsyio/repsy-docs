+++
title = "Uploading Packages"
weight = 2
+++

Let's create a basic Python package to upload. Before proceeding, please make sure that you have the latest versions of necessary tools used to build and upload Python packages.

````bash
python -m pip install setuptools wheel twine
````

The `setuptools` is used to build Python packages and to create distribution archives. You will also need a package wheel to be able to create wheel archives. The `twine` is a utility tool
that is used to upload packages to Python package index (PyPI), which is required to upload distribution archives to Repsy repository.

#### Create a Python project

Let's create a simple Python project called 'example-package'. First, open up your terminal/command prompt and create a base directory to hold your project files by typing the following command:

````bash
mkdir example_project
````

Then create project files and directories as follows:

````bash
mkdir example_package && cd example_package && touch __init__.py
````

Lastly, open up the file of  `__init__.py` and add following lines in it:

````python
def print_hello_world():
    print('Hello World!')
````

Save and close the file.

Your project is now ready to build!

#### Create distribution archives

In order to build the project and create distribution archives, you need to add one more file called `setup.py` to the root directory of your project. This file will contain information about the distribution. Please run:

```bash
touch setup.py
```

from the command line. Then add the following lines in the file:

```python
import setuptools

setuptools.setup(
  name="example_package",
  version="1.0.0",
  description="An example package.",
  packages=setuptools.find_packages()
)
```

The `setuptools` creates archive files with given information. All you need to do is to run `setup.py`. 

In the root directory of project, please run:

```bash
python setup.py sdist bdist_wheel
```

from the command line. 

The `sdist` command tells `setuptools` to create a source distribution which is basically a tarball of the source code. The `bdist_wheel` command creates a wheel. 

When the command is executed successfully, you will see two distribution archives created in the `dist/` directory. Now all you have to do is to upload them to your registry.

#### Upload distribution archives

No matter if your repository is public or private, you must authenticate in order to upload packages. There are several ways to authenticate.

Here is the common one: the `.pypirc` files. These files allow you to define configuration for your registries. If you have not had it yet, create this file on the home directory by typing the following command in the command line.

```bash
touch $HOME/.pypirc
```

Then copy the following content into this file. Please do not forget to change the *< username >*, *< registry_name >*, and *< password >* place holders with your exact Repsy credentials and registry name.

```text
[distutils]
index-servers =
    repsy

[repsy]
repository=https://repo.repsy.io/pypi/<username>/<registry_name>
username=<username>
password=<password>
```

Since we do not recommend storing your password in the `.pypirc` file as a plain text, you can alternatively use `keyring` library.

After you authenticate, it's easy to upload packages; just run:

```bash
cd dist && python -m twine upload -r repsy *
```

from the command line.

Note that the `-r` argument is the name of the registry from the configuration file. 

That's all! You can now check out your new package on the Repsy panel.
