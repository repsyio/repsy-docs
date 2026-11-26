+++
title = "Panel API Changelog"
weight = 1120
description = "Changes to the Repsy panel API that a script or tool calling it needs to know about, listed by release."
+++

# Panel API Changelog

Changes to the panel API (the `/api/...` routes that the web UI calls) that can affect a script or tool that calls it.
The newest release comes first.

## v26.11.7

### Ids Name the Row, and the Deprecated `uuid` Fields Are Gone

Every package-format object is now named by its row `id`. The copies that v26.11.1 deprecated are removed.

| Area | Route | Change |
| --- | --- | --- |
| Docker tags | `GET /api/docker/images/<username>/<repo-name>/<image-name>/tags/<image-tag>` | The `uuid` field is removed; read `id`. |
| PyPI versions | `GET /api/pypi/packages/<username>/<repo-name>/<package-name>/versions/<version>` | The `uuid` field is removed; read `id`. |
| npm versions | `GET /api/npm/packages/<username>/<repo-name>/<package-name>/versions/<version>` and the scoped `GET /api/npm/scopes/<username>/<repo-name>/<scope>/packages/<package-name>/versions/<version>` | `versionUuid` is renamed to `id`, as in Repsy Open Source. |
| Go modules and versions | the routes listed under v26.11.1 | The `panelId` alias is removed; read `id`. |

The `id` of Go modules and versions, Cargo crates (and `crateId` of their versions) and Maven versions is now the row
id. For objects created before 2026-11-11 this value differs from the one earlier releases returned, so a client that
stored these ids must read them again.

The webhook payloads changed the same way: every format payload names its object in `id` instead of `uuid`. See the
"Handling webhook events" page of each format.

## v26.11.1

### Ids Are UUID Strings

The `id` fields below were integers (`int64`) and are now UUID strings (`format: uuid`), the same as in Repsy Open
Source. A client that stored, parsed or compared the numeric id must treat the id as an opaque string.

| Area | Route | Field |
| --- | --- | --- |
| Docker tags | `GET /api/docker/images/<username>/<repo-name>/<image-name>/tags/<image-tag>` | `id`. The `uuid` field is deprecated and holds the same value; it is removed in v26.11.7. |
| Go modules | `GET /api/go/modules/<username>/<repo-name>` (list) and `GET /api/go/modules/<username>/<repo-name>/info` | `id` of the module |
| Go module versions | `GET /api/go/modules/<username>/<repo-name>/versions` and the `versions` of `.../info` | `id` of the version |
| PyPI versions | `GET /api/pypi/packages/<username>/<repo-name>/<package-name>/versions/<version>` | `id`. The `uuid` field is deprecated and holds the same value; it is removed in v26.11.7. |
| Cargo crates | `GET /api/cargo/crates/<username>/<repo-name>/<crate-name>` | `id` |
| Cargo crate versions | `GET /api/cargo/crates/<username>/<repo-name>/<crate-name>/versions/<version>` | `crateId` |
