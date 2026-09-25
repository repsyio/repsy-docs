+++
title = "Administration"
chapter = true
weight = 160
description = "Run a Repsy Open Source instance: secure and expose it, manage users, keep the data safe, upgrade it and fix problems."
+++

# Administration

This section is for the people who run a Repsy Open Source instance: how to secure it, put it behind a proxy, manage
its users, keep its data safe, and upgrade it.

Repsy Open Source is one container that serves the web UI on port `8080` and all package protocols on port `9090`. It keeps its metadata (users, repositories, versions, tokens) in a database, either the embedded H2
database that the image uses by default or PostgreSQL, and its package files in a directory on disk. Everything below
is configured with environment variables.

## Secure and expose the instance

- [Enabling HTTPS](enabling-https/) turns on the built-in TLS support and explains what package clients need to trust
  your certificate.
- [Running Behind a Reverse Proxy](running-behind-a-reverse-proxy/) sets the public URLs and shows nginx, Caddy and
  Traefik setups, including large uploads.
- [Security Headers and CORS](security-headers-and-cors/) covers the Content-Security-Policy header of the web UI and
  the cross-origin settings of the API.

## Manage users and access

- [Managing Users](managing-users/) creates, edits and deletes users and explains the two roles.
- [Recovering a Lost Password](recovering-a-lost-password/) lists the three ways back in.
- [Authenticating from CI](authenticating-from-ci/) explains deploy tokens, the failed-login limit and the Basic
  authentication cache.

## Keep the data safe

- [Persisting Data and Backups](persisting-data-and-backups/) shows what to back up and how to restore or move an
  instance.
- [Managing Storage and Cleanup](managing-storage-and-cleanup/) describes the storage layout, the trash folder and the
  background cleanup jobs.

## Upgrade and fix problems

- [Upgrading Repsy Open Source](upgrading-repsy-open-source/) covers the upgrade procedure and what to know when you
  upgrade from a 26.08 release.
- [Troubleshooting](troubleshooting/) maps common symptoms to their causes and fixes.
