+++
title = "Authentication"
weight = 20
description = "How the rp command line client authenticates to Repsy with a personal access token."
+++

`rp auth` signs in to Repsy and manages the stored credential of a profile: [`rp auth login`](../reference/rp-auth-login/), [`rp auth logout`](../reference/rp-auth-logout/), [`rp auth status`](../reference/rp-auth-status/) and [`rp auth token`](../reference/rp-auth-token/). See [rp auth](../reference/rp-auth/) for the details.

`rp` authenticates with a personal access token (PAT). This page will link to the page that explains how to create one; that page does not exist in this documentation yet.

What is already fixed:

- The token is never written to `config.yml` or `hosts.yml`. A token found in those files is ignored. See [Configuration](../configuration/).
- A token may be supplied in the `REPSY_TOKEN` environment variable. It is not part of a profile. See [Environment variables](../environment-variables/).
- Tokens are redacted from error messages and from `--debug` output.
- A failed authentication exits with code 4. See [Exit codes](../exit-codes/).
