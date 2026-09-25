+++
title = "Installing with Docker and PostgreSQL"
weight = 152
+++

# Installing with Docker and PostgreSQL

For an installation that people rely on, run Repsy with a PostgreSQL database in its own container. The database is then a
separate service that you can back up, monitor and move on its own, and Repsy does not keep it inside its data volume.

This page starts two containers on a Docker network: PostgreSQL 18 and Repsy. You do not need Docker Compose. If you
prefer a file that describes both containers, use [Installing with Docker Compose](../installing-with-docker-compose/).

The page sets up a new, empty instance. It does not move the data of an existing installation from one database to
another.

## What You Need

- [Docker](https://docs.docker.com/get-docker/) and the free ports `8080` and `9090`. Repsy serves the web panel on `8080`
  and all package protocols on `9090`.
- PostgreSQL **18**. Repsy is built and tested against this version.
- Repsy still needs a volume for the files of your packages. The database only holds the metadata.

{{< steps >}}
### Create a Network

Both containers must reach each other by name. A user-defined Docker network provides that:

```bash
docker network create repsy-network
```

### Start PostgreSQL

Choose a password for the database user and keep it, because Repsy needs it in the next step.

```bash
docker run -d \
  --name repsy-postgres \
  --restart unless-stopped \
  --network repsy-network \
  -e POSTGRES_DB=repsy \
  -e POSTGRES_USER=repsy \
  -e POSTGRES_PASSWORD=<database-password> \
  -v repsy-postgres-data:/var/lib/postgresql \
  postgres:18
```

The container does not publish port `5432`, so nothing outside the Docker network can reach the database. Only publish it
(`-p 5432:5432`) if you have to connect from the host, and then restrict it with a firewall.

The `postgres:18` image keeps its data below `/var/lib/postgresql`, so the volume goes there and not on
`/var/lib/postgresql/data` as in older PostgreSQL images.

Wait until the database accepts connections:

```bash
docker exec repsy-postgres pg_isready -U repsy -d repsy
```

It prints `accepting connections` when it is ready.

### Start Repsy

Start Repsy and point it at the database with `DB_URL`, `DB_USERNAME` and `DB_PASSWORD`. The host in the URL is the name
of the PostgreSQL container.

```bash
docker run -d \
  --name repsy \
  --restart unless-stopped \
  --network repsy-network \
  -p 8080:8080 \
  -p 9090:9090 \
  -e DB_URL=jdbc:postgresql://repsy-postgres:5432/repsy \
  -e DB_USERNAME=repsy \
  -e DB_PASSWORD=<database-password> \
  -e ADMIN_INITIAL_PASSWORD=ChangeMe123 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -e REPO_BASE_URL=http://localhost:9090 \
  -e OS_APP_JWT_SECRET=<a-long-random-value> \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:latest
```

Replace `<database-password>` with the password from the previous step. The other values are described in
[Installing with Docker](../installing-with-docker/): `ADMIN_INITIAL_PASSWORD` is the password of the first `admin` user,
`REPO_BASE_URL` is the address under which your users reach port `9090`, and `OS_APP_JWT_SECRET` keeps sessions valid across
restarts. Use a release tag instead of `latest` in production.

`STORAGE_BASE_PATH` together with `-v repsy-data:/app/data` keeps the package files on a volume. **Always set both.** Without
them the files are stored inside the container and are deleted with it, while the database still lists the packages.

### Check the Result

Give Repsy a few seconds, then open [http://localhost:8080](http://localhost:8080) and sign in as `admin`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```

The command prints `200`. If Repsy does not come up, read its log with `docker logs repsy`.
{{< /steps >}}

## The Database Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `DB_URL` | The image uses an embedded H2 database in `/app/data`. | The JDBC URL of the database. For PostgreSQL it looks like `jdbc:postgresql://<host>:5432/<database>`. |
| `DB_USERNAME` | `repsy` | The database user. |
| `DB_PASSWORD` | `repsy123` | The password of the database user. Always set your own. |

Two things are easy to get wrong:

- **Setting `DB_URL` is what switches Repsy from H2 to PostgreSQL.** The image starts with H2 unless it gets a PostgreSQL
  URL. Repsy has no separate host, port or database name variables: they are all part of `DB_URL`.
- **The user must be able to create tables in the `public` schema** of the database. Repsy uses that schema. The
  user in the example owns the database, which is the simplest way to satisfy this.

The [Configuration Reference](../configuration-reference/) has the full list of settings.

## What Happens on the First Start

Repsy manages its own database schema with Flyway migrations. When it starts it looks at the database and applies every
migration that has not been applied yet:

- On an empty database, the first start creates all tables, then creates the `admin` user and the nine default
  repositories. This takes a few seconds.
- After you start a newer release, the first start applies the migrations that came with the release, before Repsy
  accepts requests.
- If a migration fails, or the database cannot be reached, Repsy stops with an error and the container exits. With
  `--restart unless-stopped`, Docker starts it again. Look at `docker logs repsy` to see the reason.

Migrations only go forward, and an older release may not work with a schema that a newer release has already migrated,
so do not start an older release on such a database. Take a backup of the database and of the
storage before you start a new release, so that you can go back by restoring it. The Administration section describes
backups and upgrades.

Migration messages are logged at the `INFO` level, which is not shown by default. Add `-e LOGGING_LEVEL_ROOT=INFO` to
`docker run` if you want to see them.

## Stopping and Starting

Stop Repsy before PostgreSQL and start PostgreSQL before Repsy:

```bash
docker stop repsy repsy-postgres
docker start repsy-postgres
docker start repsy
```

Removing the containers does not remove the volumes `repsy-data` and `repsy-postgres-data`, so a new pair of containers
with the same options continues with the same data. Removing the volumes deletes the database or the packages for good.

## Back Up Both Volumes

A working installation has two things to keep: the PostgreSQL data and the package files in `/app/data/storage`. A backup
of only one of them does not restore a consistent instance. Back up both, and back them up together.
