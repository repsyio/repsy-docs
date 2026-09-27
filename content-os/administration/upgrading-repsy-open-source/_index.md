+++
title = "Upgrading Repsy Open Source"
weight = 169
description = "Upgrade an instance to a newer image, understand why an upgrade cannot be undone, and see what to know before the next release."
+++

# Upgrading Repsy Open Source

An upgrade replaces the container with one that runs a newer image. Your data stays in the database and in the storage
directory, and Repsy updates the database itself when it starts. This page gives the procedure, explains why an upgrade
cannot be undone, and lists what you need to know when you upgrade from a 26.08 release to the next release.

## Before you upgrade

1. **Read the notes below** for every release between yours and the one you install.
2. **Back up the database and the storage directory.** See [Persisting Data and Backups](../persisting-data-and-backups/).
   This is the only way back: the upgrade changes the database in ways an older version cannot use.
3. **Check where your package files are.** They must be in the volume, under `/app/data/storage`. If your instance runs
   without `STORAGE_BASE_PATH`, the files are in `/home/appuser/.repsy` in the container itself, and removing the
   container deletes them. Check with:

   ```bash
   docker exec repsy du -sh /app/data/storage /home/appuser/.repsy
   ```

   Your files are in the directory that has the size; the other one does not exist or is nearly empty. If your files are in `/home/appuser/.repsy`, first follow
   [Moving artifacts to the volume](../persisting-data-and-backups/#moving-artifacts-to-the-volume). An instance that
   mounted `/home/appuser/.repsy` keeps working: while `STORAGE_BASE_PATH` is still the image default, `/app/data/storage`
   is empty and `/home/appuser/.repsy` holds files, the new image keeps using `/home/appuser/.repsy` and logs a `WARN`
   at startup. Move the files, or set `STORAGE_BASE_PATH=/home/appuser/.repsy` and keep mounting it.
4. **Write down your `docker run` options** or keep your Compose file. You start the new container with the same
   options.

## The upgrade procedure

Image tags are the release versions without the leading `v`. Use a fixed version instead of `latest`, so that recreating a
container never upgrades it by accident.

```bash
docker pull repo.repsy.io/repsy/os/repsy:<new-version>

docker stop repsy
docker rm repsy

docker run -d \
  --name repsy \
  -p 8080:8080 -p 9090:9090 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:<new-version>
```

Use the same environment variables and volumes as before. With Docker Compose, change the `image` line, then run
`docker compose pull` and `docker compose up -d`.

If you run the vulnerability scanner, upgrade it in the same step to the same release,
`repo.repsy.io/repsy/os/repsy-scanner-trivy:<new-version>`, and keep its `trivy-cache` volume. Repsy and the scanner of
different releases are not supported, see [Setting Up Vulnerability Scanning](../setting-up-vulnerability-scanning/).

When Repsy starts, it applies the database migrations that the new version needs. Then check that it is up:

```bash
docker logs repsy 2>&1 | grep "started successfully"
```

Open the web UI, sign in, and download a package to be sure.

## Rolling back

Database migrations only go forward. Repsy has no way to undo them, and an older version does not understand a database
that a newer version has migrated. Repsy does not stop you from starting the old image on it, but do not: it can
misbehave in ways that are hard to see.

To go back, restore the backup you took before the upgrade, both the database and the storage directory, and start the
old image on it. Everything written after the backup is lost. If you have to go back to an older version, this is why the
backup comes first.

## Upgrading from 26.08.x to the next release

These are the changes that matter to someone who runs a 26.08 release and upgrades to the next one. Some need an action
before the upgrade, some happen at the first start. The notes were checked against 26.08.2, 26.08.3 and 26.08.4, which
share the same database schema and the same defaults. If you run an older release, check its defaults for `DB_URL` and
`STORAGE_BASE_PATH` before you upgrade.

You can upgrade from any of these releases directly to the next release: there is no release you have to install in
between.

### Set `DB_URL` if you use PostgreSQL

Earlier releases also read `DB_HOST`, `DB_PORT` and `DB_DATABASE` to build the PostgreSQL address. They are not read any
more: set `DB_URL` instead, for example `DB_URL=jdbc:postgresql://repsy-postgres:5432/repsy`.

This matters more than it looks: the Docker image now defaults to the embedded H2 database, so a container that has no
`DB_URL` starts on a **new, empty H2 database** instead of your PostgreSQL. You would see a fresh instance with a new
admin user. Nothing is lost, but stop it, set `DB_URL` and start again. To help, Repsy logs a `WARN` at startup that names
the removed variables and suggests a `DB_URL`, whenever any of them is set, whatever `DB_URL` is. It does not refuse to
start.

### Passwords are upgraded transparently on login

A 26.08 release stores passwords as salted SHA-256 hashes. The next release stores them with BCrypt. The upgrade
does not reset any password: old passwords keep working for the panel and for package clients (Maven, npm, Docker,
PyPI, Cargo, NuGet, Ruby, Go). Each account's legacy SHA-256 hash is converted to BCrypt when the account signs in
for the first time after the upgrade.

**What you need to know:**

- **No password reset.** All passwords work on the first try after the upgrade.
- **Automatic upgrade to BCrypt.** On the first successful sign-in of each account, the legacy hash is replaced with a
  BCrypt hash. The password does not change; the hash algorithm does.
- **Accounts that have not signed in yet.** They keep the legacy hash until they sign in. A later release will retire the
  legacy check and reset the password of any account that has not signed in by then. To avoid a reset later, ask each
  account holder to sign in once before that release ships.
- **Deploy tokens are unaffected.** They keep working throughout the upgrade and after.
- **Emergency access still works.** The forgotten-password recovery (creating a marker file) still works if you lose
  administrator access. See [Recovering a Lost Password](../recovering-a-lost-password/).

### Docker manifests are stored by digest

The way Repsy stores Docker manifests changed. Earlier releases stored a manifest as a child of a tag, so pushing a tag
again overwrote the manifest and the previous one could no longer be pulled by its digest. Now a manifest is stored once
per image and digest, and a tag only points to it.

- The database migration converts the records. Among other things, tags that only existed as bookkeeping for digests
  (`sha256:...` or `sha512:...` tags) are removed. Their manifests stay and can be pulled by digest.
- A background job renames the stored manifest files to `manifests/<digest>` and records the `sha512` digest of each. It
  starts ten minutes after Repsy starts and repeats daily (`DOCKER_MANIFEST_LAYOUT_REPAIR_*`). It can be interrupted and
  resumes where it stopped. Until a manifest has been renamed, Repsy serves it from its old file name, so pulls keep
  working during and after the upgrade.
- The job reports at `INFO` level, so start Repsy with `LOGGING_LEVEL_IO_REPSY=INFO` to see it:
  `Docker manifest layout repair: N repaired, N left as they are (no file matches their digest), N failed and will be
  retried`. A manifest whose file is missing or does not match its digest is logged at `WARN` and left untouched.
- Let the job finish before you upgrade again: the migration leaves a column that a later release may require to be filled.

**This step cannot be undone.** Once the manifest files are renamed, the previous version can no longer read them, and it
cannot push against the migrated database either. Take a backup first.

### Helm manifests are rewritten (PostgreSQL only)

On PostgreSQL, earlier releases stored the manifest of an OCI Helm chart (`helm_oci_manifest.content`) as a large object,
and kept only its number in the column. The database migration V0028 rewrites each such row to hold the manifest itself
and removes the large object of every row it converts. Large objects of rows that were deleted before the migration are
not tracked anywhere, so they stay in `pg_largeobject`. They only take space, and the PostgreSQL tool `vacuumlo` removes
them. Take a backup before you run it. The embedded H2 database needs nothing.

### The trash is emptied for the first time

Earlier releases moved deleted files into a `trash` folder and never removed them. The next release empties it. The first
run, 15 minutes after start, permanently deletes everything in the trash that is older than `TRASH_RETENTION` (seven
days by default). If you want to keep those files, copy the `trash` folders away before you upgrade, or start with
`TRASH_CLEANUP_ENABLED=false`. See [Managing Storage and Cleanup](../managing-storage-and-cleanup/#the-trash).

### Deploy tokens are stored as hashes

Deploy tokens are now stored as SHA-256 hashes, and the migration converts the existing ones. Tokens you already hand out
keep working. Repsy shows a token only once, when you create or rotate it, and cannot show it again. If a token was lost,
rotate it. On PostgreSQL the migration runs `CREATE EXTENSION IF NOT EXISTS
pgcrypto`, so the database user must be allowed to create that extension, or an administrator of the database creates it
beforehand.

### Rules for usernames

Usernames of new accounts, and of accounts that an administrator edits or that a user renames, must be 3 to 25 lowercase
letters, digits, `_` or `-`, and the names Repsy reserves for its own use are refused. Existing accounts with other names
keep working. See [Managing Users](../managing-users/#rules-for-usernames-and-passwords).

### Go module paths keep their case

Go module paths were stored in lowercase, so `example.com/Foo` and `example.com/foo` were the same module. They are now
kept as published, and the two are different modules, as in the Go tools. Modules that were published before keep working:
a lookup that finds nothing under the exact spelling tries the lowercase spelling once. No action is needed.

### Changes that can affect clients and scripts

- **The Basic authentication realm is now `Repsy`.** It used to be `Repsy Managed Repository`. Apache Ivy and sbt look up
  credentials by realm, so their configuration must use `Repsy`.
- **A bearer credential is no longer read from the `?token=` query parameter.** Only the `Authorization` header counts.
  No supported package manager sends the parameter.
- **Failed logins are limited and successful password checks are cached.** A client that sends wrong credentials is
  answered with `429` after 20 failures in a minute. Behind a reverse proxy, check that Repsy trusts it, or all clients
  share one count. See [Authenticating from CI](../authenticating-from-ci/) and
  [Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/).
- **The web UI sends a Content-Security-Policy header, and the API allows no other origin by default.** The web UI can no
  longer be shown in a frame. Earlier releases allowed a browser page from any origin to call the API with credentials.
  With `APP_ALLOWED_ORIGINS` empty, the API is now same-origin only and sends no CORS headers. This changes nothing for
  the Docker image as it is normally run, where the web UI and the API share an origin. It breaks a web UI that is served
  from another origin than the API (for example with `API_BASE_URL` set to another host, or a web UI hosted elsewhere): set
  `APP_ALLOWED_ORIGINS` to the origin of the web UI, for example `https://panel.example.com`, before you upgrade. See
  [Security Headers and CORS](../security-headers-and-cors/).
- **The package port sends no CORS headers, and the security headers are new.** Only the port of the web UI and its API
  answers cross-origin requests. Both ports send `X-Content-Type-Options: nosniff`, and the port of the web UI and its
  API also sends `Referrer-Policy` and `X-Frame-Options`. `Strict-Transport-Security` is sent only if you set
  `APP_HSTS_MAX_AGE`. See [Security Headers and CORS](../security-headers-and-cors/#other-security-headers).
- **Uploads are checked more strictly.** Repsy refuses uploads that earlier releases accepted, for example Maven files
  outside the artifact layout and POMs whose group id does not match their path (both answered with `400`). See the pages
  of the package formats.
- **The API of the web UI changed.** Some routes were removed or reshaped. The web UI is the supported way to manage
  Repsy, and its API is still in beta: scripts that call it directly need to be checked.

### New settings

The next release adds settings you may want to know about: `REPO_BASE_URL` and `API_BASE_URL`, the upload size limits,
`TRASH_RETENTION`, the cleanup jobs, `PASSWORD_RESET_MARKER_DIR`, `APP_ALLOWED_ORIGINS`, `APP_HSTS_MAX_AGE` and the `APP_CSP_*` settings, and
the `AUTH_THROTTLE_*` and `BASIC_AUTH_CACHE_*` settings. They are described in the pages of this section.

The vulnerability scanner is published as an image of its own, `repo.repsy.io/repsy/os/repsy-scanner-trivy`, with the same
tags as Repsy. [Setting Up Vulnerability Scanning](../setting-up-vulnerability-scanning/) describes it, and the new
settings of the scanner and of the `npm audit` lookup.

The remaining database migrations of the release add tables, columns and indexes for new features, and remove the `searchable` setting of repositories, which had no effect.
