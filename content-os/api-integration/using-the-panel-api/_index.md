+++
title = "Using the Panel API"
weight = 1105
description = "Call the panel REST API of Repsy Open Source from scripts and CI: sign in, create repositories and deploy tokens, page through lists and read errors."
+++

# Using the Panel API

The panel API is the set of `/api/...` routes that the web UI calls. Whatever the panel does, a script can do with the same routes: create repositories, manage deploy tokens, list and delete packages, start vulnerability scans and manage users. This page shows how to authenticate, lists the main operations, explains paging and gives a worked example that creates a repository and a deploy token from a CI job.

The package formats (Maven, npm, Docker and so on) have their own wire protocols on the repository port, which this page does not cover. The panel API is served on the port of the web UI, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). In the examples, `<panel-url>` is the address of the web UI of your instance.

{{% notice warning %}}
The panel API is in **beta**. A release can change it in a way that breaks a script, see [Stability and Changes](#stability-and-changes). Test a script against the release you run.
{{% /notice %}}

## Authenticate

There are three ways to prove who you are:

| Credential | Sent as | Works for | Use it for |
| --- | --- | --- | --- |
| Access token of a sign-in | `Authorization: Bearer <token>` | Every operation | Short scripts that sign in themselves, and anything that manages users or passwords. |
| Personal access token (`rut-...`) | `Authorization: Bearer <token>` | The operations on a repository, listing and creating repositories, and managing personal access tokens | CI and long-running automation. It has scopes, so it can be narrower than its owner, and it expires. |
| Username and password | HTTP Basic | The operations on one repository only (`/api/repos/<repo-name>/...`) | A quick call against one repository. |

A deploy token is not a credential of the panel API. It is the credential of a package client, see [Authenticating from CI](../../administration/authenticating-from-ci/).

### Sign in

`POST /api/auth/login` takes a username and a password and answers an access token and a refresh token:

```bash
curl -s -X POST <panel-url>/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "MY REPSY USERNAME", "password": "MY REPSY PASSWORD"}'
```

```json
{"username":"admin","token":"<access-token>","refreshToken":"<refresh-token>"}
```

Send the access token with every further request as `Authorization: Bearer <access-token>`. The answer has `Cache-Control: no-store`, because it carries secrets.

### Refresh the token

The access token is short lived (about 30 minutes in the default configuration). Before it runs out, exchange the refresh token for a new pair:

```bash
curl -s -X POST <panel-url>/api/auth/tokens/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken": "<refresh-token>"}'
```

The answer has the shape of the sign-in answer. Keep the new `refreshToken` and discard the old one. When the refresh token has expired too, sign in again. If you do not set `OS_APP_JWT_SECRET`, every restart of the instance ends all sessions, see [Persisting Data and Backups](../../administration/persisting-data-and-backups/).

### Personal access tokens

A script that runs unattended should not hold a password. Create a personal access token once, with the scopes it needs (`$TOKEN` is an access token from a sign-in):

```bash
curl -s -X POST <panel-url>/api/profile/access-tokens \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "ci", "scopes": ["repo:read", "repo:write", "repo:manage"]}'
```

The answer has the secret in `token`, starting with `rut-`. It is shown once. The scopes are:

| Scope | Allows |
| --- | --- |
| `repo:read` | Download and read repositories, including scan results. |
| `repo:write` | Also publish and start scans. |
| `repo:manage` | Also delete, change settings and manage deploy tokens. It gives nothing to a user who is not an administrator. |

What a token may do is what its owner may do, narrowed by its scopes. `expirationDate` is optional and at most 365 days ahead, which is also the default. A personal access token cannot manage users, a password or a username: those operations need the access token of a sign-in.

### HTTP Basic

An operation on one repository also accepts HTTP Basic:

```bash
curl -s -u "MY REPSY USERNAME:MY REPSY PASSWORD" <panel-url>/api/repos/<repo-name>
```

Listing or creating repositories needs a Bearer token. A password check costs CPU time on purpose, and a wrong password counts as a failed login, so use a personal access token in a job that makes many calls, see [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit).

## Main Operations

All paths start with `<panel-url>`. Every list answers a page, see [Pagination](#pagination).

### Repositories

| Operation | Request |
| --- | --- |
| List repositories | `GET /api/repos` |
| Create a repository | `POST /api/repos` with `name`, `type` (`MAVEN`, `NPM`, `PYPI`, `DOCKER`, `CARGO`, `NUGET`, `GOLANG`, `HELM` or `RUBY`) and optionally `description` and `privateRepo` (default `true`) |
| Read, change or delete one | `GET`, `PATCH` or `DELETE /api/repos/<repo-name>` |
| Settings of a repository | `GET` or `PUT /api/repos/<repo-name>/settings` |

A repository name has at most 25 characters: letters, digits, `_` and `-`, and it does not start with `-`.

### Deploy Tokens

| Operation | Request |
| --- | --- |
| List the tokens of a repository | `GET /api/repos/<repo-name>/deploy-tokens` |
| Create a token | `POST /api/repos/<repo-name>/deploy-tokens` with `name` and optionally `readOnly`, `description`, `username` and `expirationDate` |
| Rotate a token | `POST /api/repos/<repo-name>/deploy-tokens/<token-id>/actions/rotate` |
| Revoke a token | `DELETE /api/repos/<repo-name>/deploy-tokens/<token-id>` |

The secret of a new or rotated token is in the answer, once.

### Packages

Each package format has routes to list and delete what is stored, in the shape `/api/<format>/<plural>/<repo-name>/...`. The plural is `artifacts` for Maven, `packages` for npm, PyPI and NuGet, `crates` for Cargo, `images` for Docker, `modules` for Go, `charts` for Helm and `gems` for Ruby. For example `GET /api/npm/packages/<repo-name>` lists the packages of an npm repository, and `DELETE /api/npm/packages/<repo-name>/<package-name>/versions/<version>` deletes one version. These package routes, like `GET /api/info` and the Maven public-key routes, are newer than release 26.10.0. Look up the exact paths of your release in the [OpenAPI spec](#the-openapi-spec).

### Users

These operations need the access token of a sign-in of an administrator.

| Operation | Request |
| --- | --- |
| List users | `GET /api/users` |
| Create a user | `POST /api/users` with `username`, `password` and `role` (`USER` or `ADMIN`) |
| Change a user | `PUT /api/users/<user-id>` with `username` and `role` |
| Delete a user | `DELETE /api/users/<user-id>` |
| Reset a password | `POST /api/users/<user-id>/actions/reset-password` |

A password has 6 to 50 characters with a digit, a lower case letter and an upper case letter, and no spaces. A value that breaks a rule is refused with `400`, and `errors` has one entry for each rule.

### Vulnerability Scanning

These operations work when scanning is switched on, see [Setting Up Vulnerability Scanning](../../administration/setting-up-vulnerability-scanning/). With scanning off, a request to start a scan is answered with `400` and the code `scannerDisabled`.

| Operation | Request |
| --- | --- |
| Start a scan of a version | `POST /api/repos/<repo-name>/artifacts/<artifact-name>/versions/<version>/scan` (`202` and a `Location` header) |
| Scan state of a version | `GET /api/repos/<repo-name>/artifacts/<artifact-name>/versions/<version>/scan-overview` |
| The scans of a version | `GET /api/repos/<repo-name>/artifacts/<artifact-name>/versions/<version>/scans` |
| The findings of a scan | `GET /api/repos/<repo-name>/scans/<scan-id>/findings` |
| Security summary of a repository | `GET /api/repos/<repo-name>/security-detail` |

A package with a scope has the same routes with `/scopes/<scope>` in front of `/artifacts/`.

## Pagination

Every list answers one page, with the items in `content` and the position in `page`:

```bash
curl -s "<panel-url>/api/repos?page=0&size=2&sort=name,asc" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{"content":[{"name":"cargo", ...},{"name":"docker", ...}],"page":{"size":2,"number":0,"totalElements":11,"totalPages":6}}
```

| Parameter | Meaning |
| --- | --- |
| `page` | The zero-based page. The default is `0`. |
| `size` | The items per page, 1 to 100. The default is `10`. |
| `sort` | `property,direction` with `asc` or `desc`. Repeat the parameter to sort by more than one property. Each list accepts its own properties; the OpenAPI spec names them for each operation. |

Fetch pages until `page.number + 1` equals `page.totalPages`. A `size` above 100 or a `sort` property the list does not know is refused with `400` and the code `validationError`.

## Errors

A failed request is answered with a problem document (`application/problem+json`) that has a stable `code` to switch on and a `traceId` to quote in a bug report:

```json
{"detail":"Repository not found","instance":"/api/repos/nope","status":404,"title":"Not Found","code":"repoNotFound","traceId":"477dc6ac-7d67-436f-8814-eacd02fe2a55"}
```

[Panel API Errors](../panel-api-errors/) describes every field, the status codes, the stable error codes and headers such as `Retry-After`.

## Example: Create a Repository and a Deploy Token from CI

A job creates a repository for a new project and hands its build a deploy token. It holds a personal access token with the scope `repo:manage`, created once by an administrator and stored as the CI secret `REPSY_API_TOKEN`.

```bash
set -eu
PANEL=<panel-url>

# 1. Create a private Maven repository. 201 and a Location header; 409 repoExists if it exists.
curl -sf -X POST "$PANEL/api/repos" \
  -H "Authorization: Bearer $REPSY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "releases", "type": "MAVEN", "description": "Release builds", "privateRepo": true}'

# 2. Create a read/write deploy token and keep only its secret.
DEPLOY_TOKEN=$(curl -sf -X POST "$PANEL/api/repos/releases/deploy-tokens" \
  -H "Authorization: Bearer $REPSY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "ci", "readOnly": false, "description": "CI deploys"}' \
  | jq -r .token)
```

The first request answers `201` with the new repository:

```json
{"name":"releases","description":"Release builds","type":"MAVEN","privateRepo":true,"diskUsage":0,"createdAt":"2026-11-04T19:02:33.269747Z"}
```

The second answers `201` with the secret and the generated user name:

```json
{"token":"<deploy-token>","username":"repsy-deploy-token-tlhm0zv"}
```

Use the token as the password of the package client, see [Authenticating from CI](../../administration/authenticating-from-ci/#deploy-tokens), and keep it out of the job log. To replace it later, rotate it; the token id is in the list answer.

## Registering Maven PGP Public Keys

The web UI has no form for the public keys that Repsy uses to verify the OpenPGP signatures of Maven artifacts, so register a key with the panel API. The steps and the requests are on [Signing Maven Artifacts](../../maven/signing-maven-artifacts/#registering-a-public-key). The routes are `POST`, `GET` and `DELETE` on `/api/mvn/key-stores/<repo-name>/public-keys`, and they need an administrator.

## Stability and Changes

The panel API is in **beta**, at version `0.1.0`. This is the version of the API, not of Repsy: it is in the OpenAPI spec as `info.version` and moves independently of the Repsy release.

- Until version 1.0 a release can change the API in a way that breaks a script: a path, a field, a status code or an error code can be renamed or removed.
- Such a change raises the API version in the spec. Read the notes of a release, and the section "Backward incompatible changes" of it, before you upgrade, see [Upgrading Repsy Open Source](../../administration/upgrading-repsy-open-source/).
- `GET /api/info` needs no credentials and answers the release and the commit of the running server, so a script can check which release it talks to (this route is newer than 26.10.0; a build without build information answers `unknown` for the member it lacks):

  ```bash
  curl -s <panel-url>/api/info
  ```

  ```json
  {"build":{"release":"<release>","commit":"<full-commit-sha>"}}
  ```

- Ignore fields you do not know, so that an added field does not break a script, and treat an unknown error `code` by its status.

## The OpenAPI Spec

The panel API is described by one OpenAPI 3.1 file, `repsy-backend/src/main/resources/openapi/openapi-spec.yaml` in the [repsyio/repsy repository](https://github.com/repsyio/repsy). It lists every operation with its parameters, bodies, status codes and accepted credentials. Open the file at the tag of your release, so that it describes what your instance serves. Use it to look up exact fields or to generate a client.
