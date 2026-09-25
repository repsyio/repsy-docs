+++
title = "Installing with Docker"
weight = 151
+++

# Installing with Docker

The quickest way to run Repsy Open Source is a single Docker container. It uses an embedded H2 database, so it needs no
other service, and it keeps the database and your packages on one Docker volume.

This setup suits an evaluation and a small instance. For a long-lived installation that several people depend on, keep
the database in PostgreSQL instead: see [Installing with Docker and PostgreSQL](../installing-with-docker-and-postgresql/).

## Before You Start

You need a machine with [Docker](https://docs.docker.com/get-docker/) and these ports free:

| Port | Used for |
| --- | --- |
| `8080` | The web panel and its REST API. |
| `9090` | All package protocols: this is where `mvn`, `npm`, `docker` and the other clients connect. |

Two more ports, `8443` and `9443`, serve the panel and the package protocols over HTTPS. They are off until you
configure a certificate.

## The Image

Repsy Open Source is published as `repo.repsy.io/repsy/os/repsy`. The image can be pulled without signing in.

| Tag | Meaning |
| --- | --- |
| `latest` | The most recent release. |
| `<release-tag>` | One release only. |

Use `latest` to try Repsy. In production, always use a release tag, so that restarting or recreating the container never
moves you to a release you did not choose. The releases are listed on the
[repsyio/repsy releases page](https://github.com/repsyio/repsy/releases). The image tag of a release is its Git tag
without the leading `v`.

The examples on this page use `latest` for brevity. Replace it with a release tag when you set up a production instance.

{{< steps >}}
### Start Repsy

Run the container. Replace `ChangeMe123` with a password of your own: it becomes the password of the `admin` user.

```bash
docker run -d \
  --name repsy \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 9090:9090 \
  -e ADMIN_INITIAL_PASSWORD=ChangeMe123 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:latest
```

What the options do:

- `ADMIN_INITIAL_PASSWORD` sets the password of the first administrator. See [The Admin Password](#the-admin-password).
- `STORAGE_BASE_PATH=/app/data/storage` puts the files of your packages in the volume. **Always set it together with
  the volume.** See [What Is Kept and What Is Lost](#what-is-kept-and-what-is-lost).
- `-v repsy-data:/app/data` mounts a named Docker volume where Repsy keeps its data.

### Wait Until It Is Running

Give Repsy a few seconds to start: on the first run it also creates its database tables. Then check that the panel
answers:

```bash
docker ps --filter name=repsy
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```

`docker ps` shows `Up` for the container and `curl` prints `200`. If it does not, read the log: see [Logs](#logs).

### Sign In

Open [http://localhost:8080](http://localhost:8080) and sign in as `admin` with the password you set. The instance
already has nine private repositories, one for every package type. To use them, see the page of your package type, for
example Maven or npm.

Package clients connect to port `9090`, for example `http://localhost:9090/maven` for the `maven` repository.
{{< /steps >}}

## The Admin Password

On the first start, when no administrator exists yet, Repsy creates the user `admin`:

- With `ADMIN_INITIAL_PASSWORD` set, that value is the password. It must contain at least one uppercase letter, one
  lowercase letter and one digit, must not contain whitespace, and must not be longer than 72 bytes. If the value does
  not qualify, Repsy stops with an error instead of starting.
- Without `ADMIN_INITIAL_PASSWORD`, Repsy generates a random password and writes it once to the log:

  ```bash
  docker logs repsy 2>&1 | grep "generated password"
  ```

  The line reads `Admin user created successfully with username: admin and temporarily generated password: ...`.

`ADMIN_INITIAL_PASSWORD` only matters while no administrator exists. Changing it later does not change the password of
an existing `admin` user: change the password in your profile in the panel. If you lose the password of an
administrator, [Recovering a Lost Password](../../administration/recovering-a-lost-password/) explains how to reset it.

## Running It for Other Users

The command above is enough for a first look on your own machine. Before other people use the instance, add these
settings:

- `REPO_BASE_URL` is the address under which your users reach port `9090`. The panel shows it in the configuration
  snippets for Maven, npm and the other clients, and the npm registry uses it in the download links of packages. By
  default it is `http://localhost:9090`, which is wrong for everyone else.
- `OS_APP_JWT_SECRET` is the secret that signs the sessions of the panel. If you leave it out, Repsy picks a new random
  secret on every start and everybody has to sign in again after each restart. Create a value with
  `openssl rand -base64 32` and keep it unchanged.
- A release tag instead of `latest`.

```bash
docker run -d \
  --name repsy \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 9090:9090 \
  -e ADMIN_INITIAL_PASSWORD=ChangeMe123 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -e REPO_BASE_URL=https://repo.example.com \
  -e OS_APP_JWT_SECRET=<a-long-random-value> \
  -v repsy-data:/app/data \
  repo.repsy.io/repsy/os/repsy:<release-tag>
```

The [Configuration Reference](../configuration-reference/) lists every other setting. To serve Repsy over HTTPS or behind
a reverse proxy, see [Enabling HTTPS](../../administration/enabling-https/) and
[Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/).

## What Is Kept and What Is Lost

The container writes its data below `/app/data`. With `-v repsy-data:/app/data` and `STORAGE_BASE_PATH=/app/data/storage`
that directory contains everything worth keeping:

| Path | Content |
| --- | --- |
| `/app/data/repsy.mv.db` | The embedded H2 database: users, repositories, package metadata and deploy tokens. |
| `/app/data/storage` | The files of your packages, one directory per package type, plus a `trash` directory in each for deleted items. |
| `/app/data/password-reset` | The directory Repsy watches for the marker files of a password reset. |

Removing the container, for example to use a new image, does not touch the volume. Start a new container with the same
`-v` and `-e STORAGE_BASE_PATH` options and it continues with the same users and packages.

{{% notice warning %}}
**Always set `STORAGE_BASE_PATH` together with the volume.** The image does not set it for you. Without it Repsy stores
the files of your packages in `/home/appuser/.repsy`, inside the container itself and outside the volume. They survive
`docker stop` and `docker start`, but they are deleted with the container. The database is on the volume and survives,
so after you recreate the container it still lists packages whose files are gone.
{{% /notice %}}

If you leave out `-v` altogether, Docker still creates an unnamed volume for `/app/data`, because the image declares it.
The data then survives a restart of the container, but the volume has no name you can reuse, so a new container starts
with an empty instance. Give the volume a name, as in the command above.

Use only one container at a time on a volume. The embedded H2 database can be opened by one process only.

### Using a Directory of Your Host

To keep the data in a directory of the host, use a bind mount instead of a named volume. The container runs as the
non-root user `appuser`, which must be able to write to the directory, otherwise Repsy fails to start with an
`AccessDeniedException` for a file in `/app/data`. Give the directory to that user first. The command uses the image
itself to find the user and group:

```bash
mkdir -p /srv/repsy
docker run --rm --user root --entrypoint sh \
  -v /srv/repsy:/app/data \
  repo.repsy.io/repsy/os/repsy:latest \
  -c 'chown -R appuser:appgroup /app/data'
```

Then start Repsy with `-v /srv/repsy:/app/data` in place of `-v repsy-data:/app/data`. A named volume does not need this
step: Docker creates it with the owner of `/app/data` in the image.

## Health Check

Repsy has no separate health endpoint. The panel's start page on port `8080` answers with `200` once the application is
up, so use that address. To let Docker check it, add these options to `docker run`:

```bash
  --health-cmd 'wget -q -O /dev/null http://localhost:8080/' \
  --health-interval 10s \
  --health-start-period 30s \
```

`docker ps` then shows `(healthy)` next to the container.

## Logs

Repsy writes its log to the standard output of the container:

```bash
docker logs -f repsy
```

By default only warnings and errors are logged, so a healthy start is quiet. It prints the banner and a few `WARN`
lines, among them a note that the H2 version is newer than the one the migration tool was tested with; that is expected.
To see more, add `-e LOGGING_LEVEL_ROOT=INFO` and recreate the container. Do not raise it above `WARN`, for example to `ERROR`: the
generated admin password and the passwords created by a reset are logged as warnings.

## Stopping and Starting

```bash
docker stop repsy       # stop the container
docker start repsy      # start it again, with the same data
docker restart repsy    # stop and start
docker rm -f repsy      # remove the container; the volume and its data stay
```

To remove the data as well, remove the volume with `docker volume rm repsy-data`. This deletes your database and all
packages for good.

## Next Steps

- Move to [PostgreSQL](../installing-with-docker-and-postgresql/) when the instance grows.
- Describe the installation in a file with [Docker Compose](../installing-with-docker-compose/).
- Look up a setting in the [Configuration Reference](../configuration-reference/).
