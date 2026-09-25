+++
title = "Publishing a Go Module with curl"
weight = 860
description = "Publish a Go module by building its zip archive and uploading it with curl, and learn the upload rules and refusals."
+++

This tutorial takes a small Go module to a release in your Repsy Open Source Go repository, and explains the rules Repsy applies to an upload and what each refusal looks like. It complements [Publishing a Go Module](../publishing-a-go-module/), which shows the same upload in short.

Go has no publish command. A Go repository is a module proxy that you fill yourself: you build the zip archive of a version of your module, and you upload it with one `PUT` request. Repsy reads the `go.mod` out of the zip, stores the zip, the `go.mod` and a small `.info` file, and serves them to the `go` command afterwards.

### Prerequisites

- A Go repository on your Repsy Open Source instance, see [Creating a Private Go Module Registry](../creating-a-private-go-module-registry/). The examples use the address `{{% repo-url %}}/<repo-name>`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start.
- The `go` command and `curl`. The second way to build the zip, below, also needs `git`, `tar` and `zip`.
- A credential: your username and password, or a [deploy token](../creating-a-private-go-module-registry/#get-your-credentials). A deploy token goes into the password field and needs the **Read/Write** access type to publish; the username can be any non-empty value. Uploading always needs credentials, also to a public repository.

{{% notice note %}}
Repsy takes the password over HTTP Basic authentication, so it is sent with every upload. `curl` sends it over plain HTTP too, so serve a shared instance over HTTPS. Otherwise the credentials cross the network unencrypted. See [Enabling HTTPS](../../administration/enabling-https/).
{{% /notice %}}

{{< steps >}}
### Create the module

Create a directory for the module and start it with `go mod init`. The module path is the name that other projects use to import it. Give it a domain that belongs to you, or to your company:

```bash
mkdir hello && cd hello
go mod init example.com/hello
```

Add some code, in `hello.go`:

```go
package hello

// Greeting is what the module says.
func Greeting() string {
	return "Hello from Repsy"
}
```

If the module is in a Git repository, commit it and tag the release. The tag is the version:

```bash
git init && git add . && git commit -m "First release"
git tag v1.0.0
```

The rules for the module path and the version are in [What Repsy Checks on Upload](#what-repsy-checks-on-upload). In short, the version is `v` and three numbers, such as `v1.0.0`, with an optional suffix such as `-rc.1`, and the `module` line of your `go.mod` has to be the module path you upload to.

### Build the module zip

The `go` command expects the zip of a module to have a fixed shape: every file is stored under `<module-path>@<version>/`, and some files are left out, such as `.git`, nested modules and symlinks. The Go project ships the code that builds it, the package `golang.org/x/mod/zip`. Repsy does not run it for you, so build the zip on your machine.

**With a small program that uses that package.** It builds the zip of any directory, and it refuses a module path or a version that the `go` command would refuse. Create the program once, in a directory of its own:

```bash
mkdir ~/modzip && cd ~/modzip
go mod init modzip
```

Save this as `~/modzip/main.go`:

```go
// Command modzip writes the module zip that the go command expects.
//
// Usage: modzip <module-path> <version> <module-dir> <output.zip>
package main

import (
	"fmt"
	"os"

	"golang.org/x/mod/module"
	"golang.org/x/mod/zip"
)

func main() {
	if len(os.Args) != 5 {
		fmt.Fprintln(os.Stderr, "usage: modzip <module-path> <version> <module-dir> <output.zip>")
		os.Exit(2)
	}
	modulePath, version, dir, output := os.Args[1], os.Args[2], os.Args[3], os.Args[4]

	out, err := os.Create(output)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer out.Close()

	if err := zip.CreateFromDir(out, module.Version{Path: modulePath, Version: version}, dir); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
```

Build it, and use it on your module:

```bash
go mod tidy && go build -o modzip .
./modzip example.com/hello v1.0.0 /path/to/hello /path/to/hello-module.zip
```

The zip lists the files of the module under their final names:

```bash
unzip -l /path/to/hello-module.zip
```

```text
example.com/hello@v1.0.0/go.mod
example.com/hello@v1.0.0/hello.go
```

**Or, for a module in a Git repository, with `git archive`.** It packs the files of the tag and honours `export-ignore` in `.gitattributes`. Run it in the repository:

```bash
MODULE_PATH=example.com/hello
VERSION=v1.0.0
STAGING=$(mktemp -d)
mkdir -p "${STAGING}/${MODULE_PATH}@${VERSION}"
git archive "${VERSION}" | tar -x -C "${STAGING}/${MODULE_PATH}@${VERSION}"
rm -f module.zip
(cd "${STAGING}" && zip -q -r -D "${OLDPWD}/module.zip" "${MODULE_PATH}@${VERSION}")
```

`zip -D` leaves out the entries of directories, and `rm -f module.zip` removes the archive of an earlier run (`zip` adds to an existing file, so a leftover archive would end up inside the new one). This route does not check anything, and it packs whatever the tag holds, so use the program above when your repository holds nested modules or vendored code.

### Upload the zip

Send the zip with `PUT`. `curl -T` does exactly this. Use `-T`, not `-d`, `--data-binary` or `-F`: the body has to be the zip file itself.

```bash
MODULE_PATH=example.com/hello
VERSION=v1.0.0

curl --fail-with-body -sS \
  -u <username>:<password-or-token> \
  -T module.zip \
  -H "Content-Sha256: $(sha256sum module.zip | cut -d' ' -f1)" \
  "{{% repo-url %}}/<repo-name>/${MODULE_PATH}/@v/${VERSION}.zip"
```

On macOS, use `shasum -a 256` in place of `sha256sum`. Give `-u <username>` without the password and `curl` asks for it, so that it does not show up in your shell history or in the process list. A CI job passes the token differently, see [Go in CI](../go-in-ci/).

A successful upload is answered with `200` and an empty body, so `curl` prints nothing. When Repsy refuses the upload, `curl` prints the answer and exits with `22`, see [Troubleshooting](#troubleshooting). (`--fail-with-body` needs curl 7.76 or newer. With an older one, leave it out and read the answer that `curl` prints.)

- The address is the repository address, the module path, `/@v/` and the version with `.zip` after it.
- The `Content-Sha256` header is optional. It holds the SHA-256 digest of the whole zip file in hex, upper or lower case, and Repsy compares it with the file it received. Send it, so that a damaged upload is refused instead of being stored as a version that cannot be replaced.
- A capital letter in a module path is written in the address as `!` and the lower-case letter, as the `go` command does when it downloads: `example.com/BurntSushi/toml` becomes `example.com/!burnt!sushi/toml`. The `go.mod` and the names in the zip keep the real spelling.

### Verify the upload

The `go` command asks a Go repository for the list of versions of a module, and for the `.info`, `.mod` and `.zip` file of a version. Ask for the same:

```bash
BASE="{{% repo-url %}}/<repo-name>/${MODULE_PATH}/@v"

curl -u <username>:<password-or-token> "$BASE/list"
curl -u <username>:<password-or-token> "$BASE/${VERSION}.info"
curl -u <username>:<password-or-token> "$BASE/${VERSION}.mod"
```

The first call prints one version per line, sorted by version number. The second prints `{"Version":"v1.0.0","Time":"..."}`. The `Time` is the moment of the upload, not the time of a commit. The third prints the `go.mod` of the version, the one Repsy read out of your zip. The `.zip` file is served too. The answers of `.info` and `.mod` for a version that does not exist are `404`, and the list of a module that does not exist is `200` with an empty body.

`curl -I` (a `HEAD` request) is answered with `404` for every address, even for a file that exists. Use `GET`.

Then install the module in another project, see [Using Go Modules from Repsy](../using-go-modules-from-repsy/).

### See the module in the web UI

Sign in to the web UI, open the **Repositories** tab and open your Go repository. Every row is a module, with its module path. Open a module to see its versions, with the `go` version of each `go.mod` (**Go Version**) and the time of the upload, and open a version to see its `go get` command and the addresses of its `.info`, `.mod` and `.zip` files. The **Configure** button of the repository shows the commands for your repository.
{{< /steps >}}

### What Repsy Checks on Upload

A refused upload changes nothing in the repository: no file is stored and no version appears. An upload has to pass all of these checks:

1. **Credentials.** A user account can upload to every repository of the instance. A deploy token can upload to its own repository when its access type is **Read/Write**. A **Read Only** token, an expired or revoked token, a token of another repository and missing credentials are all refused with `401`, and Repsy asks for HTTP Basic credentials. Nobody can upload anonymously, not even to a public repository.
2. **The module path and the version in the address.** The module path can have up to 512 characters and the version up to 100. The version has to be a semantic version with a leading `v`: `v<major>.<minor>.<patch>`, with an optional `-<pre-release>` and an optional `+<build>`, and without leading zeros in the numbers. Repsy checks these before it reads the body of the request.

   | Accepted as a version | Refused as a version |
   | --- | --- |
   | `v1.0.0` | `1.0.0` (no `v`) |
   | `v1.2.3-rc.1`, `v1.0.0-beta` | `v1.2` and `v1` (not three numbers) |
   | `v0.0.0-20260115103000-0123456789ab` (a pseudo-version) | `v01.2.3` (a leading zero) |
   | `v0.1.0` | `latest`, `main` and `banana` |

3. **The size.** The zip file can be as large as `GO_MAX_MODULE_ZIP_SIZE` allows. The default, `500MB`, is 524,288,000 bytes, that is 500 MiB. A client that announces a larger file is refused before the body is read, and so is an upload that grows past the limit while Repsy reads it, such as a chunked one. What the zip unpacks to has a limit of its own, 500 MiB in total and 100,000 files, and so has its `go.mod`, 16 MiB. An administrator changes the first limit with the variable, see the [Configuration Reference](../../installation/configuration-reference/#upload-size-limits).
4. **The digest.** When the request has a `Content-Sha256` header, Repsy calculates the SHA-256 digest of the body and compares it. Without the header, nothing is compared.
5. **The `go.mod`.** The zip has to contain the file `<module-path>@<version>/go.mod`, with the module path and the version spelled as in the address, capital letters included. The file cannot be empty and needs a `module` line. The module path on that line has to be the module path of the address, and its first element has to contain a dot: `example.com/hello` is fine, `hello` and `localhost/hello` are not.
6. **The version is new.** See [Versions Cannot Be Overwritten](#versions-cannot-be-overwritten).

Repsy looks at the `go.mod` and at nothing else in the zip. The `go` command checks the zip as a whole when it downloads it, and refuses one that has files outside `<module-path>@<version>/` with an error such as `zip for example.com/hello@v1.0.0 has unexpected file stray.go`. Repsy has stored such a zip by then, and a version cannot be replaced, so build the zip with one of the routes above and look at it with `unzip -l` before you upload it.

Some rules of Go itself are not checked by Repsy, and a module that breaks them cannot be used. A module with a version `v2.0.0` or higher has to end its module path with `/v2` (or the number of its major version), in the `go.mod`, the address and the zip. The program above refuses to build a zip that has the wrong suffix. Repsy does not.

A module path is case sensitive: `example.com/Hello` and `example.com/hello` are two modules, with their own versions.

### Versions Cannot Be Overwritten

Repsy never replaces a version of a Go module. Uploading a version that already exists is refused with `409` and this body, whatever the settings of the repository:

```text
HTTP/1.1 409

{"msgId":"goModuleVersionAlreadyExists","type":"ERROR", ...}
```

Nothing changes: the stored zip, `go.mod` and `.info` stay as they were. A Go repository has no **Package Override** setting, and the **Deny** and **Allow** of the other formats do not exist here.

Publish a new version instead. This is a rule of Go's ecosystem as much as of Repsy: the `go` command writes the checksum of every module it downloads into `go.sum`, and it refuses to use a file that no longer matches. Repsy has no checksum database to tell your users that you replaced a version on purpose. An administrator can delete a version in the web UI and upload it again, and the upload then succeeds, but everybody who had downloaded the old version gets an error like this one until they remove the entry from `go.sum` and clear their module cache:

```text
verifying example.com/hello@v1.0.0: checksum mismatch

SECURITY ERROR
This download does NOT match an earlier download recorded in go.sum.
```

See [Deleting Go Module Versions](../deleting-go-module-versions/).

### Troubleshooting

Repsy sends the identifier of the error and a message in a JSON body, which `curl --fail-with-body` prints:

```text
{"msgId":"goModModulePathMismatch","type":"ERROR", ..., "text":"The go.mod module directive does not match the module path in the URL."}
```

| What you see | Cause |
| --- | --- |
| `401` | The credentials are missing or wrong, or the deploy token is read-only, expired, revoked or belongs to another repository. |
| `404` | The address is not a Go repository of your instance: the repository name is wrong, or the repository has another type. |
| `429` | Wrong credentials were sent too often from your address. See [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit). |
| `400`, `sha256Mismatch` | The `Content-Sha256` header is not the digest of the file that was sent. Calculate it from the file you send, and send the file with `-T`. |
| `400`, `goModNotFoundInZip` | The zip has no `<module-path>@<version>/go.mod`: the prefix, the module path, its capital letters or the version differ from the address, or the body is not a zip file at all (for example, after `-d` or `-F`). Check with `unzip -l`. |
| `400`, `goModFileEmpty` or `goModMissingModuleDirective` | The `go.mod` in the zip is empty or has no `module` line. |
| `400`, `goModInvalidModulePath` | The first element of the module path has no dot. |
| `400`, `goModModulePathMismatch`: `The go.mod module directive does not match the module path in the URL.` | The `module` line of the `go.mod` names another module than the address. |
| `400`, `invalidModuleVersion`: `The module version is not a valid Go semver string.` | The version in the address is not written as in the table above. |
| `400`, `modulePathTooLong`: `The module path is longer than 512 characters.` or `moduleVersionTooLong`: `The module version is longer than 100 characters.` | The address names a longer module path or version. |
| `400`, `goModTooLarge`: `The go.mod in the module zip is larger than 16 MiB.` | The `go.mod` unpacks to more than 16 MiB. |
| `400`, `moduleZipTooLarge`: `The module zip inflates to more than 500 MiB.` | The files in the zip unpack to more than 500 MiB in total. |
| `400`, `moduleZipTooManyFiles`: `The module zip has more than 100000 files.` | The zip has too many files. |
| `400`, `moduleZipEntryNameInvalid`: `A module zip entry name contains a newline.` | A file name in the zip has a line break in it. |
| `409`, `goModuleVersionAlreadyExists` | The version exists already, see [Versions Cannot Be Overwritten](#versions-cannot-be-overwritten). |
| `409`, `goModuleBusy`: `The module was deleted while it was being published. Please retry.` | An administrator deleted the module at the very moment of your upload. Upload again. |
| `413`, `payloadTooLarge`: `The uploaded content is too large.` | The zip is larger than `GO_MAX_MODULE_ZIP_SIZE`. |

The next step is to [install the module with the go command](../using-go-modules-from-repsy/).
