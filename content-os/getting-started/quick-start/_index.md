+++
title = "Quick Start"
weight = 112
+++

# Quick Start

This page gets Repsy Open Source running on your machine with one Docker command, and publishes a first package to it.
It uses the embedded H2 database, which is meant for trying Repsy out; for a long-lived instance, see
[Installation](../../installation/). You need [Docker](https://docs.docker.com/get-docker/)
and the free ports 8080 and 9090.

{{< steps >}}
### Start Repsy

Run the image with a volume for its data:

```bash
docker run -d \
  --name repsy \
  -p 8080:8080 \
  -p 9090:9090 \
  -v repsy-data:/app/data \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -e ADMIN_INITIAL_PASSWORD=<admin-password> \
  repo.repsy.io/repsy/os/repsy:latest
```

Replace `<admin-password>` with a password of your choice. It needs at least one uppercase letter, one lowercase
letter and one digit, and no whitespace, otherwise Repsy refuses to start.

What the options do:

| Option | Purpose |
| --- | --- |
| `-p 8080:8080` | The web UI. |
| `-p 9090:9090` | The package protocols: the address your build tools and `docker` talk to. See [Ports and Repository URLs](../ports-and-repository-urls/). |
| `-v repsy-data:/app/data` | Keeps the embedded database in a Docker volume, so it survives a restart or a new container. |
| `-e STORAGE_BASE_PATH=/app/data/storage` | Keeps the packages in the same volume. Without it they are stored inside the container's own file system and are lost when the container is removed. |
| `-e ADMIN_INITIAL_PASSWORD=...` | The password of the first administrator, `admin`. It is only read while no administrator exists, that is, on the very first start. |

If you leave out `ADMIN_INITIAL_PASSWORD`, Repsy generates a random password for `admin` and writes it to the
container log once, when it starts for the first time. Read it with `docker logs repsy 2>&1 | grep password`, which prints one line:

```text
... Admin user created successfully with username: admin and temporarily generated password: <generated-password>
```

### Sign in

Open [http://localhost:8080](http://localhost:8080) and sign in with the username `admin` and your password. You arrive
on the dashboard.

Open **Profile** in the menu behind your avatar at the top right and change the password to one only you know.

### Look at the default repositories

Choose **Repositories** in the sidebar. Repsy created one private repository for every package format on its first
start: `maven`, `npm`, `pypi`, `docker`, `cargo`, `go`, `helm`, `nuget` and `ruby`. To create your own, see
[Creating Your First Repository](../creating-your-first-repository/).

### Publish a first package

This example pushes a Docker image to the default `docker` repository. Docker accepts a plain-HTTP registry on
`localhost`, so no extra setup is needed. Log in with your `admin` account, then tag and push any local image:

```bash
docker login localhost:9090 -u admin
docker pull hello-world
docker tag hello-world localhost:9090/docker/hello-world:1.0
docker push localhost:9090/docker/hello-world:1.0
```

Open the `docker` repository in the web UI: the `hello-world` image is listed there.

For the other package formats, open a repository in the web UI and click **Configure**. It shows the commands and
configuration files for that format, filled in with the address of your repository.
{{< /steps >}}

# Stop or Remove Repsy

`docker stop repsy` stops the container and `docker start repsy` starts it again with its data. To start over from
scratch, remove the container and the volume:

```bash
docker rm -f repsy
docker volume rm repsy-data
```
