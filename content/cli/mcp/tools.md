+++
title = "MCP Tools"
weight = 72
description = "Every tool the rp MCP server offers an AI agent, with its arguments and whether it needs --allow-writes."
# Copied from docs/reference/mcp-tools.md of repsy-cli, which "make docs" generates from the server
# (RPS-2640). Refresh the tool sections from there; do not edit them by hand.
+++

# MCP Tools

The tools that [rp mcp](../) offers to an AI agent. The read tools are always there; the write tools exist only when the server is started with `rp mcp --allow-writes`. No tool deletes, revokes or rotates anything. `rp mcp tools` prints the same list.

| Tool | Access | Title |
| --- | --- | --- |
| [`create_deploy_token`](#create_deploy_token) | Write, needs `--allow-writes`. | Create a deploy token |
| [`create_repo`](#create_repo) | Write, needs `--allow-writes`. | Create a repository |
| [`get_client_setup`](#get_client_setup) | Read. | Get client setup |
| [`get_package`](#get_package) | Read. | Get a package |
| [`get_repo`](#get_repo) | Read. | Get a repository |
| [`get_scan_overview`](#get_scan_overview) | Read. | Get the scan overview of a version |
| [`get_usage`](#get_usage) | Read. | Get usage |
| [`list_deploy_tokens`](#list_deploy_tokens) | Read. | List deploy tokens |
| [`list_package_tags`](#list_package_tags) | Read. | List package tags |
| [`list_packages`](#list_packages) | Read. | List packages |
| [`list_repo_contents`](#list_repo_contents) | Read. | List repository contents |
| [`list_repos`](#list_repos) | Read. | List repositories |
| [`list_scan_findings`](#list_scan_findings) | Read. | List scan findings |
| [`list_scans`](#list_scans) | Read. | List the scans of a version |
| [`trigger_scan`](#trigger_scan) | Write, needs `--allow-writes`. | Start a security scan |
| [`whoami`](#whoami) | Read. | Who am I |

## create_deploy_token

**Create a deploy token.** Write, needs `--allow-writes`.

Create a deploy token for a repository, for a CI job or a client that must not use a personal credential. The result holds the secret once: it goes into this conversation and the transcript of the client, so prefer creating it in a terminal with rp token create when that matters.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | a name for the token, 1 to 80 characters |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `expires_in_days` | integer | no | the life of the token in days, 1 to 365; default 365 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `read_only` | boolean | no | true for a token that can only read (download) |
| `username` | string | no | the username the token signs in with; default: the server chooses one |

## create_repo

**Create a repository.** Write, needs `--allow-writes`.

Create a repository, private unless public is true. On Repsy OS only an administrator can; on Repsy Cloud it belongs to the account of the credential. A name that is taken is an error, nothing is overwritten.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `format` | string | yes | maven, npm, pypi, docker, cargo, nuget, go, helm or ruby |
| `name` | string | yes | the name of the new repository |
| `description` | string | no | a description of the repository |
| `public` | boolean | no | true makes the repository readable without credentials; default private |

## get_client_setup

**Get client setup.** Read.

Return the configuration that rp &lt;format&gt; setup would write for a repository: the files and the lines it adds, the commands it runs and the steps left to the user. Nothing is written, and the user's own files are not read. The token is a reference to an environment variable, never the token itself. The repository is read once to check that it exists.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `format` | string | yes | the client: maven, npm, pypi, docker, cargo, nuget, go, helm or ruby |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `scope` | string | no | user or project; default user. Not every format has both |

## get_package

**Get a package.** Read.

Return one package, version, Docker tag or manifest, with the API's own fields for the format. Coordinates are the natural ones of the format: maven group[:artifact[:version]], npm [@scope/]name[@version] (@scope alone: the packages of a scope), docker image[:tag] or image@sha256:digest (the image may contain /), go module/path[@version], cargo, helm, nuget, pypi and ruby name[@version].

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `coordinates` | string | yes | the package, or one version of it when the coordinates carry a version; a Maven group alone is the group summary, a Docker image@digest the stored manifest |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `format` | string | no | the repository format (maven, npm, pypi, docker, cargo, nuget, go, helm or ruby); omit it to read it from the repository, which costs one request |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `platform` | string | no | Ruby only: the gem platform of the version, such as java |

## get_repo

**Get a repository.** Read.

Return one repository with its settings: format, visibility, disk usage, and whether it takes snapshots, releases and overrides.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |

## get_scan_overview

**Get the scan overview of a version.** Read.

Return the vulnerability counts by severity of the latest security scan of one package version, with the id of that scan and its status.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `artifact` | string | yes | the package name as the repository lists it, without an npm scope |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `version` | string | yes | the version of the package |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `scope` | string | no | npm only: the scope of a scoped package, with or without the @ |

## get_usage

**Get usage.** Read.

Return the disk use and traffic of the account. The server answers this for a login session only; with an access token the tool refuses without sending anything.

No arguments.

## list_deploy_tokens

**List deploy tokens.** Read.

List the deploy tokens of a repository: name, username, read-only or not, and expiry. The secrets are never returned; the server keeps no copy to show.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |

## list_package_tags

**List package tags.** Read.

List the distribution tags of an npm package or the OCI tags of a Helm chart. The tags of a Docker image are a list_packages call with the image as coordinates. Coordinates are the natural ones of the format: maven group[:artifact[:version]], npm [@scope/]name[@version] (@scope alone: the packages of a scope), docker image[:tag] or image@sha256:digest (the image may contain /), go module/path[@version], cargo, helm, nuget, pypi and ruby name[@version].

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `coordinates` | string | yes | the npm package or Helm chart, without a version |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `format` | string | no | the repository format (maven, npm, pypi, docker, cargo, nuget, go, helm or ruby); omit it to read it from the repository, which costs one request |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |

## list_packages

**List packages.** Read.

List the packages of a repository, or the next level down for the given coordinates: the versions of a package, the artifacts of a Maven group, the tags of a Docker image or the manifests of a tag. Coordinates are the natural ones of the format: maven group[:artifact[:version]], npm [@scope/]name[@version] (@scope alone: the packages of a scope), docker image[:tag] or image@sha256:digest (the image may contain /), go module/path[@version], cargo, helm, nuget, pypi and ruby name[@version].

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `coordinates` | string | no | omit it for the packages of the repository; give a package for its versions, a Maven group for its artifacts, a Docker image for its tags or image:tag for its manifests |
| `format` | string | no | the repository format (maven, npm, pypi, docker, cargo, nuget, go, helm or ruby); omit it to read it from the repository, which costs one request |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `search` | string | no | only rows whose name contains this text, case-insensitive; a few lists have no such filter and say so |

## list_repo_contents

**List repository contents.** Read.

List the files and directories stored in a repository at one path, as the registry keeps them (one level, not recursive).

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `path` | string | no | a directory inside the repository, such as com/acme; omit it for the root |

## list_repos

**List repositories.** Read.

List the repositories the credential can see. On Repsy Cloud this includes the repositories of accounts the user collaborates with, and each row names its owner; pass that owner to the other tools.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `format` | string | no | only repositories of this format (maven, npm, pypi, docker, cargo, nuget, go, helm or ruby) |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `search` | string | no | only repositories whose name contains this text, case-insensitive |

## list_scan_findings

**List scan findings.** Read.

List the vulnerabilities a security scan found in one package version: CVE, severity, affected package and version, fixed version and CVSS score. Without scan_id the latest scan is read.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `artifact` | string | yes | the package name as the repository lists it, without an npm scope |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `version` | string | yes | the version of the package |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `scan_id` | string | no | the id of a scan from list_scans; omit it for the latest scan |
| `scope` | string | no | npm only: the scope of a scoped package, with or without the @ |
| `sort` | string | no | property,direction, for example severity,desc or cvssScore,desc; properties: id, cveId, severity, packageName, packageVersion, fixedVersion, description, referenceUrl, fixStatus, cvssScore, cvssVector |

## list_scans

**List the scans of a version.** Read.

List the security scans of one package version, newest first: status, highest severity, scanner and times.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `artifact` | string | yes | the package name as the repository lists it, without an npm scope |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `version` | string | yes | the version of the package |
| `limit` | integer | no | the most rows to return, 1 to 200; default 50 |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `scope` | string | no | npm only: the scope of a scoped package, with or without the @ |

## trigger_scan

**Start a security scan.** Write, needs `--allow-writes`.

Start a security scan of one package version. When a scan of the version is already running (an upload starts one when a scanner is enabled) the tool attaches to it instead of failing. With wait_seconds it waits for the scan to finish, up to 300 seconds.

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `artifact` | string | yes | the package name as the repository lists it, without an npm scope; a Maven artifact is groupId:artifactId |
| `repo` | string | yes | the repository name, as list_repos returns it |
| `version` | string | yes | the version of the package |
| `owner` | string | no | Repsy Cloud only: the owner (user or organisation) of the repository, as list_repos returns it; omit it for the owner of the rp profile. Refused on Repsy OS and on a Cloud custom domain |
| `scope` | string | no | npm only: the scope of a scoped package, with or without the @ |
| `wait_seconds` | integer | no | wait up to this many seconds (at most 300) for the scan to finish; 0, the default, returns at once |

## whoami

**Who am I.** Read.

Return the Repsy host, the product (os or cloud), the user and the kind of credential this server signs requests with. Call it first to know which registry the other tools talk to.

No arguments.
