+++
title = "Upgrading Repsy Open Source"
weight = 169
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
   [Moving artifacts to the volume](../persisting-data-and-backups/#moving-artifacts-to-the-volume).
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
admin user. Nothing is lost, but stop it, set `DB_URL` and start again.

### Every password is reset

A 26.08 release stores passwords as salted SHA-256 hashes. The next release stores them with BCrypt, and a SHA-256 hash
cannot be converted without the password. The upgrade therefore resets the password of every account that still has an
old hash, which is every account of a 26.08 instance that has not signed in to a newer build. It is a one-time migration.
The users' web UI sessions are ended.

What you have to do:

- **Administrators.** At the first start Repsy generates a new password for each administrator and logs it once, at
  `WARN` level. Copy it from the log straight after the upgrade. It is not stored anywhere and not logged again:

  ```bash
  docker logs repsy 2>&1 | grep "Admin password has been reset"
  ```

  ```text
  Admin password has been reset for user admin. New password: <password>
  ```

- **Other users.** They cannot sign in until an administrator resets their password: sign in with an administrator
  account, open **Users** and use **Reset password**. See [Managing Users](../managing-users/). Tell your users, and
  update the passwords in CI jobs that use an account instead of a deploy token.
- If no administrator can sign in, use one of the methods in
  [Recovering a Lost Password](../recovering-a-lost-password/).

Deploy tokens are not affected.

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
- **The web UI sends a Content-Security-Policy header and its CORS setting is configurable.** By default any origin is
  still allowed to call the API, as before, but the web UI can no longer be shown in a frame. See
  [Security Headers and CORS](../security-headers-and-cors/).
- **Uploads are checked more strictly.** Repsy refuses uploads that earlier releases accepted, for example Maven files
  outside the artifact layout and POMs whose group id does not match their path (both answered with `400`). See the pages
  of the package formats.
- **The API of the web UI changed.** Some routes were removed or reshaped. The web UI is the supported way to manage
  Repsy, and its API is still in beta: scripts that call it directly need to be checked.

### New settings

The next release adds settings you may want to know about: `REPO_BASE_URL` and `API_BASE_URL`, the upload size limits,
`TRASH_RETENTION`, the cleanup jobs, `PASSWORD_RESET_MARKER_DIR`, `APP_ALLOWED_ORIGINS` and the `APP_CSP_*` settings, and
the `AUTH_THROTTLE_*` and `BASIC_AUTH_CACHE_*` settings. They are described in the pages of this section.

The remaining database migrations of the release only add tables, columns and indexes for new features.
