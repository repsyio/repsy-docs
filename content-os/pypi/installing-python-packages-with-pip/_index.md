+++
title = "Installing Python Packages with pip"
weight = 670
description = "Install packages with pip: the index URL, credentials, permanent configuration, requirements files, CI jobs and fixing failed installs."
+++

This tutorial shows how to install packages from a Repsy Open Source PyPI repository with `pip`: the index URL, the credentials, a permanent configuration, requirements files, CI jobs and what to do when an install fails. It complements [Installing a PyPI Package](../installing-a-pypi-package/), which shows the same in short.

### Prerequisites

- A PyPI repository on your Repsy Open Source instance with at least one package in it, see [Creating a Private PyPI Registry](../creating-a-private-pypi-registry/) and [Publishing a Python Package with twine](../publishing-a-python-package-with-twine/).
- The index URL of the repository: `{{% repo-url %}}/<repo-name>/simple`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start.
- For a private repository, a credential: your username and password, or a [deploy token](../creating-a-private-pypi-registry/#get-your-credentials). A **Read Only** token is enough to install, and the username can be any non-empty value. A public repository can be read without credentials.

### Install a Package

Point `pip` at the simple index of the repository:

```bash
pip install example-package --extra-index-url {{% repo-url %}}/<repo-name>/simple
```

This is the command the web UI shows on the page of a package version. To install one version, name it: `pip install example-package==1.0.0 --extra-index-url ...`.

`pip` has two options for the index, and they behave differently:

| Option | What `pip` does |
| --- | --- |
| `--index-url` | Uses only this index instead of the default one, `https://pypi.org/simple`. |
| `--extra-index-url` | Uses this index in addition to the default one, and to any other index you give. |

Repsy Open Source does not fetch packages from other indexes, so a repository has only the packages that you uploaded to it. With `--index-url`, `pip` cannot find the dependencies of your package that live on pypi.org, unless you have uploaded them to the repository too. With `--extra-index-url`, it can.

{{% notice warning %}}
When `pip` has several indexes, it chooses the highest version of a package from all of them. If a package on pypi.org has the same name as one of your private packages, and a higher version, `pip` installs the one from pypi.org. Give your private packages names that no public package has, and pin the versions of what you install.
{{% /notice %}}

### Authenticate

A private repository answers a request without valid credentials with `401` and asks for HTTP Basic credentials. There are three ways to give them to `pip`.

**In the index URL.** The simplest way, and fine for a quick test:

```bash
pip install example-package --index-url https://<username>:<password-or-token>@{{% repo-url scheme="false" %}}/<repo-name>/simple
```

Percent-encode characters that have a meaning in a URL, such as `@`, `:`, `/` and `#`, in the username and the password. Anyone who can see your shell history or the process list sees the secret, and `pip` can print the URL in its output. Use one of the other ways for anything that lasts.

**In `~/.netrc`.** `pip` reads credentials from a `.netrc` file (on Windows, `_netrc` in your home directory). The entry is looked up by host name, without the port:

```text
machine <your-repsy-host-name>
login <username>
password <password-or-token>
```

Restrict the file to your user (`chmod 600 ~/.netrc`), and keep the index URL free of credentials.

**In the keyring.** `pip` can read the password from the `keyring` library, so that it is not stored in a file. See the `--keyring-provider` option in the documentation of `pip` for how to turn it on and how the entry is named.

Without any of these, `pip` asks for the credentials on the terminal, and it fails when there is no terminal or when you set `PIP_NO_INPUT=1`.

### Configure pip Permanently

To use the repository without repeating the option, put it into the `pip` configuration file. `pip config debug` lists the files that your `pip` reads. The usual places are:

| System | User-level file |
| --- | --- |
| Linux | `~/.config/pip/pip.conf` |
| macOS | `~/Library/Application Support/pip/pip.conf` |
| Windows | `%APPDATA%\pip\pip.ini` |

A file named `pip.conf` (on Windows `pip.ini`) in the root of a virtual environment applies to that environment only.

```ini
[global]
extra-index-url = {{% repo-url %}}/<repo-name>/simple
```

You can also write the same with `pip config set global.extra-index-url {{% repo-url %}}/<repo-name>/simple`. Keep credentials out of a file that you share or commit. For a private repository, use `.netrc` or the keyring, or put the secret in the environment as described below.

### Use a Requirements File

A requirements file can name the index next to the packages, so that `pip install -r requirements.txt` works for everyone who has a credential:

```text
--extra-index-url {{% repo-url %}}/<repo-name>/simple
example-package==1.0.0
```

`pip` expands environment variables written as `${NAME}` in a requirements file. If the file has to carry the credentials, commit the variable names and not their values:

```text
--extra-index-url https://${REPSY_USERNAME}:${REPSY_TOKEN}@{{% repo-url scheme="false" %}}/<repo-name>/simple
example-package==1.0.0
```

### Use Repsy in a CI Job

In a CI job, store the deploy token as a secret of your CI system and pass it to `pip` through the environment. `pip` reads every option from a variable named `PIP_` plus the option in upper case:

```bash
export PIP_EXTRA_INDEX_URL=https://<username>:${REPSY_TOKEN}@{{% repo-url scheme="false" %}}/<repo-name>/simple
export PIP_NO_INPUT=1
pip install -r requirements.txt
```

For example, in a GitHub Actions workflow:

```yaml
- name: Install dependencies
  env:
    PIP_EXTRA_INDEX_URL: https://ci:${{ secrets.REPSY_TOKEN }}@<your-repsy-host>/<repo-name>/simple
    PIP_NO_INPUT: "1"
  run: pip install -r requirements.txt
```

Use a **Read Only** deploy token for a job that only installs, so that a leaked token cannot publish. `PIP_NO_INPUT` makes a job with wrong credentials fail at once instead of waiting for input.

### Plain HTTP and HTTPS

The default setup of Repsy Open Source uses plain HTTP, which is fine on your own machine: `pip` trusts `localhost` without HTTPS. For an index on another host that uses `http://`, `pip` refuses it with a warning that the host is "not a trusted or secure host", unless you mark it as trusted:

```bash
pip install example-package --extra-index-url http://<your-repsy-host>/<repo-name>/simple --trusted-host <your-repsy-host>
```

Use `host:port` for a host with a port, for example `--trusted-host repsy.example.com:9090`. The same setting exists as `trusted-host` in `pip.conf` and as `PIP_TRUSTED_HOST`. Your credentials cross the network unencrypted on plain HTTP, so serve a shared instance over HTTPS. If its certificate is signed by your own authority, pass the certificate of that authority with `--cert <file>` or `PIP_CERT`.

### Versions and Pre-releases

`pip` installs the highest final release by default. To install a pre-release, dev release or post release, name the version (`example-package==1.0.0rc1`) or add `--pre`. Repsy lists every version of a package, whatever its kind.

### Check the Repository Without pip

`pip` reads the project page of a package, `{{% repo-url %}}/<repo-name>/simple/<package-name>/`. It is an HTML page with a link to every file of the package. Each link has the SHA-256 digest of the file as its fragment (`#sha256=...`), which `pip` checks after the download, and a `data-requires-python` attribute when the release has a `Requires-Python`, which `pip` uses to skip versions that do not support your Python:

```bash
curl -u <username>:<password-or-token> {{% repo-url %}}/<repo-name>/simple/<package-name>/
```

The package name is written in its normalized form: lower case, with runs of `-`, `_` and `.` replaced by one `-`. A request with another spelling is answered with a `307` redirect to the normalized name, which `pip` follows on its own; add `-L` to `curl` to follow it. The files themselves are served from `{{% repo-url %}}/<repo-name>/<package-name>/-/<file-name>`.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `401` errors, or `pip` asks for a username and password | The repository is private and the credentials are missing or wrong, or the deploy token is expired, revoked or belongs to another repository. |
| `Could not find a version that satisfies the requirement ...` and `No matching distribution found` | The package or the version is not in that repository (Repsy answers `404` with the message `Package not found.` for a package that does not exist), the name is misspelled, or the index URL points at another repository. The package may also need a newer Python than yours (`pip` mentions ignored versions that require a different Python), or a version is a pre-release and needs `--pre`. |
| `The repository located at ... is not a trusted or secure host and is being ignored` | The index URL starts with `http://` on a host other than `localhost`. Serve the instance over HTTPS, or use `--trusted-host`. |
| A certificate error | The certificate of the instance is not trusted by your system. Use `--cert`, or install the certificate authority on the machine. |
| A dependency of your package is not found | The index was given with `--index-url`, and the dependency is not in the repository. Use `--extra-index-url`, or upload the dependency to the repository. |

### Other Clients

This page covers `pip`. The client setup that the web UI shows for a repository, and the tests that Repsy Open Source runs against its PyPI repositories, use `pip` and `twine`. Other tools, such as uv, Poetry, PDM and Hatch, are not covered here.
