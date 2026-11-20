+++
title = "Panel API Changelog"
weight = 1120
description = "Changes to the Repsy panel API that a script or tool calling it needs to know about, listed by release."
+++

# Panel API Changelog

Changes to the panel API (the `/api/...` routes that the web UI calls) that can affect a script or tool that calls it.
The newest release comes first.

## v26.11.1

### Ids Are UUID Strings

The `id` fields below were integers (`int64`) and are now UUID strings (`format: uuid`), the same as in Repsy Open
Source. A client that stored, parsed or compared the numeric id must treat the id as an opaque string.

| Area | Route | Field |
| --- | --- | --- |
| Docker tags | `GET /api/docker/images/<username>/<repo-name>/<image-name>/tags/<image-tag>` | `id`. The `uuid` field is deprecated and holds the same value. |
| Go modules | `GET /api/go/modules/<username>/<repo-name>` (list) and `GET /api/go/modules/<username>/<repo-name>/info` | `id` of the module |
| Go module versions | `GET /api/go/modules/<username>/<repo-name>/versions` and the `versions` of `.../info` | `id` of the version |
| PyPI versions | `GET /api/pypi/packages/<username>/<repo-name>/<package-name>/versions/<version>` | `id`. The `uuid` field is deprecated and holds the same value. |
| Cargo crates | `GET /api/cargo/crates/<username>/<repo-name>/<crate-name>` | `id` |
| Cargo crate versions | `GET /api/cargo/crates/<username>/<repo-name>/<crate-name>/versions/<version>` | `crateId` |
