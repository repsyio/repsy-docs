+++
title = "Publishing a Python Package with twine"
weight = 660
description = "Build a Python package, upload it with twine, and learn what is checked on upload and what each refusal looks like."
+++

This tutorial takes a small Python package from `python -m build` to a release in your Repsy Open Source PyPI repository, and explains the rules Repsy applies to an upload and what each refusal looks like. It complements [Publishing a PyPI Package](../publishing-a-pypi-package/), which shows the same setup in short.

### Prerequisites

- A PyPI repository on your Repsy Open Source instance, see [Creating a Private PyPI Registry](../creating-a-private-pypi-registry/). The examples use the upload address `{{% repo-url %}}/<repo-name>`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start.
- Python 3 with `pip`.
- A credential: your username and password, or a [deploy token](../creating-a-private-pypi-registry/#get-your-credentials). A deploy token goes into the password field and needs the **Read/Write** access type to publish; the username can be any non-empty value.

Install the tools that build and upload a package:

```bash
python -m pip install --upgrade build twine
```

{{% notice note %}}
Repsy takes the password over HTTP Basic authentication, so it is sent with every upload. Serve a shared instance over HTTPS. On plain HTTP, the credentials cross the network unencrypted.
{{% /notice %}}

{{< steps >}}
### Create the package

Create a directory with a package in it and a `pyproject.toml` next to it:

```bash
mkdir example-project && cd example-project
mkdir example_package
touch example_package/__init__.py
```

Add a function to `example_package/__init__.py`:

```python
def print_hello_world():
    print("Hello World!")
```

Describe the package in `pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=61"]
build-backend = "setuptools.build_meta"

[project]
name = "example-package"
version = "1.0.0"
description = "An example package."
requires-python = ">=3.9"
```

The `name` and the `version` identify the release in Repsy. `requires-python` is stored with the release and is served to `pip`, which then skips versions that do not support its Python.

### Build the distribution files

```bash
python -m build
```

The command writes two files to `dist/`: a wheel and a source distribution.

```text
dist/example_package-1.0.0-py3-none-any.whl
dist/example_package-1.0.0.tar.gz
```

Repsy accepts wheels (`.whl`) and source distributions (`.tar.gz` or `.zip`) and treats both the same way. Any other kind of file is refused, see [What Repsy Checks on Upload](#what-repsy-checks-on-upload).

### Store the credentials

Create `~/.pypirc` (on Windows, `%USERPROFILE%\.pypirc`) with a section for your repository. The name of the section, here `repsy`, is what you pass to `twine` with `-r`.

```ini
[distutils]
index-servers =
    repsy

[repsy]
repository = {{% repo-url %}}/<repo-name>
username = <username>
password = <password-or-token>
```

Put the deploy token into `password`. The file holds a secret in plain text, so on Linux and macOS restrict it to your user with `chmod 600 ~/.pypirc`.

Alternatively, leave `password` out and let `twine` ask for it, or keep it in your keyring: `twine` looks the password up in `keyring` by the repository address and the username, for example with `python -m keyring set {{% repo-url %}}/<repo-name> <username>`.

In a CI job, do not write the secret to a file. `twine` reads the credentials and the upload address from environment variables, so you can store the token as a secret of your CI system and expose it to the job:

```bash
export TWINE_REPOSITORY_URL={{% repo-url %}}/<repo-name>
export TWINE_USERNAME=<username>
export TWINE_PASSWORD=<password-or-token>
python -m twine upload --non-interactive dist/*
```

With `--non-interactive`, `twine` fails at once when a credential is missing instead of waiting for input.

### Upload the package

With the `.pypirc` file:

```bash
python -m twine upload -r repsy dist/*
```

Without a configuration file, pass the address of the repository yourself. `twine` then asks for the username and the password, or reads them from `TWINE_USERNAME` and `TWINE_PASSWORD`:

```bash
python -m twine upload --repository-url {{% repo-url %}}/<repo-name> dist/*
```

`twine` sends each file in its own request, and the command ends without an error when Repsy has accepted every file. The address is the repository address without `/simple`: an upload to `.../simple` is answered with `404`. A trailing slash makes no difference.

### Verify the result in the web UI

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. The list has one row per package, with its latest version. Open the package to see its versions, and open a version to see its details.
3. The details show the ready-made `pip install` command for the version, when it was uploaded, its `Requires-Python`, its home page and classifiers, whether it is a final, pre, post or dev release, and the long description of the package rendered as Markdown.

To check what `pip` will see, request the project page of the simple index:

```bash
curl -u <username>:<password-or-token> {{% repo-url %}}/<repo-name>/simple/example-package/
```

It is an HTML page with one link per uploaded file. Each link carries the SHA-256 digest of the file as its fragment (`#sha256=...`), and a `data-requires-python` attribute when the release has a `Requires-Python`.
{{< /steps >}}

### What Repsy Checks on Upload

A refused upload changes nothing in the repository: nothing is stored and no version appears. An upload has to pass all of these checks:

1. **Credentials.** A user account can upload to every repository of the instance. A deploy token can upload to its own repository when its access type is **Read/Write**. A **Read Only** token, an expired or revoked token, a token of another repository and missing credentials are all refused with `401`, and Repsy asks for HTTP Basic credentials. Nobody can upload anonymously, not even to a public repository.
2. **Sizes.** The package name, the version and `Requires-Python` are limited to 255 characters each, and so is the file name. Longer values are refused with `400`. Descriptive values that are too long, such as a home page, an author, an author email, a license or a description content type of more than 255 characters, are not stored, and the upload still succeeds.
3. **The file name.** The file has to be named `<name>-<version>[-<tag>...].<extension>`, where the extension is `whl`, `tar.gz` or `zip`, and the version is written in the canonical form of PEP 440, as `python -m build` writes it:

   | Accepted in a file name | Refused in a file name |
   | --- | --- |
   | `1.0.0` | `v1.0.0` |
   | `1.0.0rc1`, `1.0.0a1`, `1.0.0b2` | `1.0.0alpha1` (spelled out) |
   | `1.0.0.post1` | `1.0.0+build5` (a local version) |
   | `1.0.0.dev1` | `01.0.0` (leading zeros) |

   Other kinds of files, such as eggs or Windows installers, are refused too.
4. **The digest.** Every upload has to state the SHA-256 digest of its file, and Repsy compares it with the file it received. `twine` does this for you. A hand-written client that leaves it out or sends a wrong one is refused with `400`.
5. **Package Override.** See [Uploading a Version Again](#uploading-a-version-again).
6. **The version.** The version in the metadata of the upload has to be a valid Python version. Repsy normalizes the spelling it accepts here, for example `1.0-rc1` to `1.0rc1`.
7. **The size limit.** An upload of more than 500 MB is refused with `413`. An administrator can change the limit of Repsy with the `MULTIPART_MAX_FILE_SIZE` and `MULTIPART_MAX_REQUEST_SIZE` environment variables.

The name of a package is normalized before it is stored: runs of `-`, `_` and `.` become one `-`, and upper case becomes lower case. `Example_Package`, `example.package` and `example-package` are the same package, and `pip` asks for it by the normalized name.

Repsy accepts pre-releases, dev releases and post releases like final releases: `1.0.0rc1`, `1.0.0.dev1` and `1.0.0.post1` are published like `1.0.0`. The repository has no setting that switches one of these kinds off.

### Uploading a Version Again

Whether you can upload a file that already exists is decided by the **Package Override** setting of the repository. An administrator changes it in the repository settings.

| Setting | Behaviour |
| --- | --- |
| **Allow** (the default of a new repository) | The file is replaced with the new one. |
| **Deny** | The upload is refused with `403`: the identifier is `fileAlreadyExists`, and nothing changes. |

The rule is applied to the file name, not to the version. When you upload the wheel of a version and later its source distribution, or a wheel with another platform tag, these are different files and are not overrides. Running `python -m twine upload dist/*` again for a version that is already published is refused for the first file that exists, and `twine` stops there.

Publish a new version instead of replacing an old one whenever you can: a client that has already installed or cached a file does not know that it changed.

### Troubleshooting

`twine` prints the HTTP status of a refused upload. Repsy also sends the identifier of the error and a message in a JSON body, which `twine` shows when you add `--verbose`.

| What you see | Cause |
| --- | --- |
| `401` | The credentials are missing or wrong, or the deploy token is read-only, expired, revoked or belongs to another repository. With `--non-interactive` and no credentials, `twine` stops before it sends anything. |
| `403`, `fileAlreadyExists` | The file already exists and **Package Override** is **Deny**. Publish a new version, or ask an administrator to allow overriding. |
| `404` | The address is not a PyPI repository of your instance: the repository name is wrong, the repository has another type, or the address ends in `/simple`. |
| `400`, `archiveFileNameInvalid`: `Invalid archive file name. It must start with the package name followed by a hyphen followed by the version name.` | The file name is not in the form above, or it is another kind of file. Check that the version is in the canonical form. |
| `400`, `badVersionString`: `Release version is invalid.` | The version in the metadata is not a valid Python version. |
| `400`, `sha256DigestMissing` or `sha256DigestMismatch` | The upload did not carry the digest of its file, or the digest is not the one of the file. Upload with `twine`. |
| `400`, `badPackageMetadata`: `Package metadata is invalid.` | The metadata of the upload could not be read. |
| `400`, `pypiPackageNameTooLong`, `pypiVersionTooLong`, `pypiArchiveFileNameTooLong` or `pypiRequiresPythonTooLong` | A value is longer than 255 characters. |
| `413`: `The uploaded content is too large.` | The file is larger than the upload limit of the instance. |

The next step is to [install the package with pip](../installing-python-packages-with-pip/).
