+++
title = "Installing with Docker Compose"
weight = 153
+++

# Installing with Docker Compose

Docker Compose describes the whole installation in one file: Repsy, PostgreSQL 18, their volumes and their health
checks. You start it with one command and keep the file next to your other infrastructure files. It is a convenient way to run Repsy on a single server.

## What You Need

- Docker with Docker Compose v2, the `docker compose` command. Check it with `docker compose version`.
- The free ports `8080` (web panel and REST API) and `9090` (all package protocols).

{{< steps >}}
### Create a Directory

Create a directory for the installation and change into it. The two files you create next belong in it.

```bash
mkdir repsy && cd repsy
```

### Create the Settings File

The `docker-compose.yml` in the next step does not contain any secret. It reads them from a file named `.env` in the same
directory. Create it with a generated database password and session secret, and choose the admin password:

```bash
cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
REPSY_JWT_SECRET=$(openssl rand -base64 32)
REPSY_ADMIN_PASSWORD=ChangeMe123
REPSY_TAG=latest
REPSY_REPO_BASE_URL=http://localhost:9090
EOF
chmod 600 .env
```

Edit the file to your needs:

| Setting | Meaning |
| --- | --- |
| `POSTGRES_PASSWORD` | The password of the database user. Compose gives it to both containers. |
| `REPSY_JWT_SECRET` | The secret that signs the sessions of the panel. Keep it unchanged, otherwise everybody has to sign in again. |
| `REPSY_ADMIN_PASSWORD` | The password of the first `admin` user. It needs an uppercase letter, a lowercase letter and a digit, no whitespace, and at most 72 bytes. Avoid the `$` character in it, because Compose treats it as the start of a variable. |
| `REPSY_TAG` | The image tag. Use `latest` to try Repsy and a release tag in production, so that a new release only reaches you when you choose it. |
| `REPSY_REPO_BASE_URL` | The address under which your users reach port `9090`, for example `https://repo.example.com`. The panel shows it in the configuration snippets of the package managers. |

Do not commit the `.env` file to version control.

### Create the Compose File

Save this as `docker-compose.yml`:

```yaml
name: repsy

services:
  postgres:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: repsy
      POSTGRES_USER: repsy
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in the .env file}
    volumes:
      # The postgres:18 image keeps its data below /var/lib/postgresql, not /var/lib/postgresql/data.
      - postgres-data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U repsy -d repsy"]
      interval: 5s
      timeout: 5s
      retries: 30

  repsy:
    image: repo.repsy.io/repsy/os/repsy:${REPSY_TAG:-latest}
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"
      - "9090:9090"
    environment:
      DB_URL: jdbc:postgresql://postgres:5432/repsy
      DB_USERNAME: repsy
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      ADMIN_INITIAL_PASSWORD: ${REPSY_ADMIN_PASSWORD:?Set REPSY_ADMIN_PASSWORD in the .env file}
      OS_APP_JWT_SECRET: ${REPSY_JWT_SECRET:?Set REPSY_JWT_SECRET in the .env file}
      STORAGE_BASE_PATH: /app/data/storage
      REPO_BASE_URL: ${REPSY_REPO_BASE_URL:-http://localhost:9090}
    volumes:
      - repsy-data:/app/data
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:8080/"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

volumes:
  postgres-data:
  repsy-data:
```

Compose stops with a message when one of the required values is missing from `.env`. To check the file before you start
anything, run `docker compose config`: it prints the file with all values filled in, or the error.

### Start It

```bash
docker compose up -d
```

Compose creates the network and the two volumes, starts PostgreSQL, waits until its health check passes and only then
starts Repsy. Follow the start with:

```bash
docker compose ps
docker compose logs -f repsy
```

`docker compose ps` shows `healthy` for both services when the installation is ready. The first start takes a little
longer, because Repsy creates its database tables.

### Sign In

Open [http://localhost:8080](http://localhost:8080) and sign in as `admin` with the value of `REPSY_ADMIN_PASSWORD`. The
instance already has nine private repositories, one for every package type.
{{< /steps >}}

## How the File Works

- **`postgres`** runs PostgreSQL 18 with a database and a user named `repsy`. Its data lives in the volume
  `postgres-data`. Its health check tells Compose when the database accepts connections. The port `5432` is not published,
  so only the other containers of the project can reach the database.
- **`repsy`** runs the Repsy image. It reaches the database as `postgres`, the name of the service. `DB_URL`,
  `DB_USERNAME` and `DB_PASSWORD` select PostgreSQL; without `DB_URL` the image would use its embedded H2 database.
- **`STORAGE_BASE_PATH: /app/data/storage`** and the volume `repsy-data` on `/app/data` keep the package files outside
  the container. **Always set both.** The image does not set `STORAGE_BASE_PATH` for you. Without it, Repsy stores the
  files inside the container, where they are deleted when the container is recreated, and the database still lists the
  packages.
- **The health check** of `repsy` requests the panel's start page. Repsy has no separate health endpoint: the start
  page answers with `200` once the application is up.
- **`restart: unless-stopped`** starts both containers again after a reboot of the server or a crash.

Every setting of Repsy can be added under `environment`. The [Configuration Reference](../configuration-reference/) lists
them all.

## Everyday Commands

Run these in the directory of the Compose file:

```bash
docker compose ps                 # state of the services
docker compose logs -f repsy      # follow the log of Repsy
docker compose stop               # stop both containers
docker compose start              # start them again
docker compose down               # remove the containers and the network, keep the volumes
```

`docker compose down` keeps the volumes, so the next `docker compose up -d` continues with the same users and packages.
`docker compose down --volumes` also deletes the volumes, and with them the database and all packages, for good.

Repsy writes only warnings and errors to its log by default, so a healthy start is quiet. Add `LOGGING_LEVEL_ROOT: INFO`
under `environment` to see more, for example the database migrations. Do not raise it above `WARN`: the generated
passwords of a reset are logged as warnings.

## Changing the Release

Change `REPSY_TAG` in `.env` and run `docker compose up -d` again: Compose recreates the `repsy` container with the new
image and keeps the volumes. Take a backup of the database and of the package files first. Database migrations only go
forward, so an older release may not work with a database that a newer one has already migrated. The Administration
section describes backups and upgrades in detail.

## Back Up Both Volumes

A working installation has two things to keep: the volume `postgres-data` and the volume `repsy-data`. A backup of only
one of them does not restore a consistent instance. Back up both, and back them up together.
