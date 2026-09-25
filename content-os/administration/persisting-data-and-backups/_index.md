+++
title = "Persisting Data and Backups"
weight = 167
description = "Persist the database and the storage directory, back them up, restore them and move an instance to another host."
+++

# Persisting Data and Backups

A Repsy Open Source instance keeps its state in two places: a **database** for users, repositories, versions and tokens,
and a **storage directory** for the package files. You need both to restore an instance. This page shows what to persist,
what to back up, and how to restore an instance or move it to another host.

## What holds your data

| What | Where | Back it up |
| --- | --- | --- |
| Database | The embedded H2 file `/app/data/repsy.mv.db` (default), or your PostgreSQL database | Yes |
| Package files | The directory set by `STORAGE_BASE_PATH` | Yes |
| Configuration | Your environment variables, and certificate files if you enabled HTTPS | Yes, keep them with your deployment files |
| Password reset markers | `/app/data/password-reset` | No, it is empty except while a reset is pending |

The database and the storage directory belong together: the database records which packages exist and the storage
directory holds their files. Restore both from the same moment.

### Set `STORAGE_BASE_PATH` explicitly

The Docker image declares `/app/data` as a volume. Put the package files inside it as well, so that a single volume
holds everything, by always starting Repsy with:

```bash
docker run -d \
  --name repsy \
  -p 8080:8080 -p 9090:9090 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:latest
```

If `STORAGE_BASE_PATH` is not set, Repsy stores package files in `.repsy` in the home directory of its user, which is
`/home/appuser/.repsy` in the image. That path is not inside the volume, so the files are lost when the container is
removed. Do not rely on the default: set the variable and use a named volume or a directory that you back up.

With `STORAGE_BASE_PATH=/app/data/storage` and the default H2 database, the volume looks like this:

```text
/app/data
├── repsy.mv.db          the H2 database
├── storage/             the package files, see "Managing Storage and Cleanup"
└── password-reset/      marker files for password recovery
```

### Choosing the database

- **Embedded H2** needs nothing else and is the default of the image. It suits evaluation and development. Only one
  process can open the database file at a time.
- **PostgreSQL 18** is the database for a production instance. Point Repsy at it with `DB_URL`, `DB_USERNAME` and
  `DB_PASSWORD`, for example `DB_URL=jdbc:postgresql://repsy-postgres:5432/repsy`. `DB_HOST`, `DB_PORT` and `DB_DATABASE`
  are not read: set `DB_URL`.

Run one Repsy instance for a database and a storage directory. Repsy is not designed to run as several instances on the
same data.

### Bind mounts and file ownership

Repsy runs as the user `appuser` (user id `100`, group id `101` in the image). If you mount a directory of the host
instead of a named volume, that user must be able to write to it, or Repsy fails to start:

```bash
mkdir -p /srv/repsy/data
sudo chown -R 100:101 /srv/repsy/data
docker run -d --name repsy -v /srv/repsy/data:/app/data ...
```

You can check the ids in your image with `docker run --rm --entrypoint id repo.repsy.io/repsy/os/repsy:latest`.

### Sessions and `OS_APP_JWT_SECRET`

Repsy signs web UI sessions with a secret. If you do not set `OS_APP_JWT_SECRET`, it generates a new random secret at
every start, and every restart signs all web UI users out. Set it to a fixed random value, for example the output of
`openssl rand -base64 32`, and keep it with your other configuration. It is not part of the data, so restoring a backup
does not depend on it.

## Backing up

The safe backup is a **cold backup**: stop Repsy, copy the database and the storage directory, start Repsy again. Repsy
stops accepting requests for that time, so schedule it for a quiet hour.

### With the embedded H2 database

The H2 file is only consistent when nothing is writing to it, so stop the container. Everything is in one volume:

```bash
docker stop repsy

docker run --rm \
  -v repsy-data:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/repsy-$(date +%F).tgz -C /data .

docker start repsy
```

The archive holds the database, the package files and the password reset directory. Copy it off the host.

### With PostgreSQL

Dump the database with `pg_dump` and archive the storage volume:

```bash
docker stop repsy

docker exec repsy-postgres pg_dump -U repsy -d repsy -Fc > repsy-$(date +%F).dump

docker run --rm \
  -v repsy-data:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/repsy-storage-$(date +%F).tgz -C /data .

docker start repsy
```

`-Fc` writes the compact custom format that `pg_restore` reads. The dump includes the record of which database
migrations have run.

If you cannot stop Repsy, take the database dump **first** and archive the storage directory **afterwards**. The database
refers to files, not the other way round: a file that is in the archive but not in the dump is harmless, but a dump that
refers to a file the archive does not have would leave a package that cannot be downloaded. Deleted files stay in the
trash for a while, see [Managing Storage and Cleanup](../managing-storage-and-cleanup/#the-trash), which further reduces
the risk. Test a restore before you rely on an online backup.

Whichever way you back up, keep several generations, store them away from the host, and test a restore now and then.

## Restoring

Restore into a stopped or new instance. The steps are the same for a restore in place and for moving to another host.

### With the embedded H2 database

Create a volume, unpack the archive into it, and start Repsy on that volume with the same settings as before:

```bash
docker volume create repsy-data

docker run --rm \
  -v repsy-data:/data \
  -v "$PWD/repsy-2026-10-01.tgz":/backup.tgz:ro \
  alpine tar xzf /backup.tgz -C /data

docker run -d \
  --name repsy \
  -p 8080:8080 -p 9090:9090 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:latest
```

`tar` runs as root here and keeps the ownership stored in the archive, so the files stay owned by Repsy's user. If you
restore from an archive made another way, run `chown -R 100:101` on the restored directory.

### With PostgreSQL

Create an empty database, load the dump into it, restore the storage archive into a volume, and start Repsy on both:

```bash
docker exec repsy-postgres createdb -U repsy repsy
docker exec -i repsy-postgres pg_restore -U repsy -d repsy --no-owner < repsy-2026-10-01.dump

docker volume create repsy-data
docker run --rm \
  -v repsy-data:/data \
  -v "$PWD/repsy-storage-2026-10-01.tgz":/backup.tgz:ro \
  alpine tar xzf /backup.tgz -C /data

docker run -d \
  --name repsy \
  -p 8080:8080 -p 9090:9090 \
  -e DB_URL=jdbc:postgresql://repsy-postgres:5432/repsy \
  -e DB_USERNAME=repsy \
  -e DB_PASSWORD=<database-password> \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:latest
```

Start a restored instance with the **same version** of Repsy that made the backup, or a newer one. A newer version
applies its database migrations when it starts. Never start an older version on a database that a newer version has
migrated: Repsy does not stop you, but the older code does not understand the newer database. See
[Upgrading Repsy Open Source](../upgrading-repsy-open-source/).

### Check the result

Sign in to the web UI with an account that existed at the time of the backup, open a repository, and download a package.
Users, repositories, deploy tokens and packages come back, because they are in the database and the storage directory.

## Moving to another host

Moving is a backup on the old host and a restore on the new one:

1. Stop Repsy on the old host and take a cold backup as above.
2. Restore it on the new host with the same environment variables, the same certificate files if you use HTTPS, and,
   preferably, the same `OS_APP_JWT_SECRET`.
3. If the public address changed, set `REPO_BASE_URL` to the new address, see
   [Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#tell-repsy-its-public-addresses).
4. Point your DNS name or proxy at the new host and stop the old instance for good, so that nobody keeps writing to it.

## Moving artifacts to the volume

If you started an instance without `STORAGE_BASE_PATH` and want the package files in the volume from now on, copy them
into the volume once and then start Repsy with the variable set. The files of an existing container are in its own file
system, so copy them out of the stopped container first:

```bash
docker stop repsy
docker cp repsy:/home/appuser/.repsy ./repsy-storage

docker run --rm \
  -v repsy-data:/app/data \
  -v "$PWD/repsy-storage":/src:ro \
  --entrypoint sh repo.repsy.io/repsy/os/repsy:latest \
  -c 'mkdir -p /app/data/storage && cp -a /src/. /app/data/storage/'

docker rm repsy
docker run -d \
  --name repsy \
  -p 8080:8080 -p 9090:9090 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:latest
```

Use the volume that already holds the database, and start the new container with your other settings unchanged. The
database does not contain the storage path, so nothing else has to change. The same steps move the files to any other
`STORAGE_BASE_PATH`: copy the directory, then start Repsy with the new value.
