+++
title = "Installation"
chapter = true
weight = 150
+++

# Installation

Repsy Open Source runs as one application that serves the web panel and every package protocol. You can start it as a
single Docker container in a minute, run it with a PostgreSQL database for a long-lived installation, describe both in a
Docker Compose file, or build it from source.

## Choose How to Install

| Option | Database | Use it when |
| --- | --- | --- |
| [Installing with Docker](installing-with-docker/) | Embedded H2, stored on a Docker volume | You want to try Repsy or run a small instance with no other services. |
| [Installing with Docker and PostgreSQL](installing-with-docker-and-postgresql/) | PostgreSQL 18 in a second container | You run Repsy for a team and want the database to be a separate, backed-up service. |
| [Installing with Docker Compose](installing-with-docker-compose/) | PostgreSQL 18 in the same Compose project | You want the whole installation described in one file that you keep and start with one command. |
| [Installing from Source](installing-from-source/) | PostgreSQL 18 or embedded H2 | You cannot use Docker, or you want to run a build of your own. |

All options run the same application, so everything else in this documentation applies to each of them. The
[Configuration Reference](configuration-reference/) lists every setting you can change with an environment variable.

## What Every Installation Has

- **Two HTTP ports.** The web panel and its REST API listen on port `8080`. All package protocols (Maven, npm, PyPI,
  Docker, Cargo, Go, Helm, NuGet and Ruby) listen on port `9090`. Optional HTTPS listeners on `8443` and `9443` are
  added next to them: HTTP is never turned off.
- **A database.** It holds users, repositories, package metadata and deploy tokens. Repsy creates and updates its tables
  itself when it starts.
- **A storage directory.** It holds the files of your packages. Repsy stores them on the local file system; there is no
  other storage backend.
- **A first administrator.** On the first start Repsy creates a user named `admin` and nine private repositories, one
  for each package type, named `maven`, `npm`, `pypi`, `docker`, `cargo`, `go`, `helm`, `nuget` and `ruby`.

Repsy Open Source has no sign-up page: you create every further account yourself in the panel, as an administrator.

## Before You Go to Production

Whatever option you choose, plan these things before other people start to push packages:

- Keep the database **and** the storage directory on persistent storage, and back both up. Losing only one of them leaves
  an instance whose database lists packages that have no files, or files that nothing lists. See
  [Persisting Data and Backups](../administration/persisting-data-and-backups/).
- Set `OS_APP_JWT_SECRET` to a fixed random value. Without it, Repsy picks a new secret on every start and everybody
  has to sign in again after each restart.
- Set `REPO_BASE_URL` to the address your users reach port `9090` under, so that the panel shows working client
  configuration.
- Serve Repsy over HTTPS, directly or behind a reverse proxy. [Enabling HTTPS](../administration/enabling-https/) and
  [Running Behind a Reverse Proxy](../administration/running-behind-a-reverse-proxy/) describe both.
