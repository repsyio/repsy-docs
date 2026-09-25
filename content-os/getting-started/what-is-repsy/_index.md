+++
title = "What is Repsy Open Source?"
weight = 110
+++

# What is Repsy Open Source?

Repsy Open Source is the open-source, self-hosted edition of Repsy, a universal package repository. You run it on your
own infrastructure, and your build tools publish packages to it and install packages from it. The source code is
available on [GitHub](https://github.com/repsyio/repsy) under the Apache License 2.0.

It hosts packages in these formats, all from one instance:

- Maven
- npm
- PyPI
- Docker
- Cargo
- Go
- Helm
- NuGet
- Ruby

# Key Features

1. **Multi-format support**  
   Every package format has its own kind of repository, and you can create as many repositories of each kind as you need.

2. **One container**  
   Repsy Open Source ships as a single Docker image that serves the web UI and every package protocol. It needs no
   other service to run.

3. **Your choice of database**  
   The image uses an embedded H2 database by default, which is convenient for evaluation and development. For
   production you can point it at PostgreSQL instead.

4. **Storage on the local file system**  
   Packages are stored as files in a directory you choose. Mount a volume or a host directory there to keep them.

5. **Users, roles and deploy tokens**  
   Administrators create the user accounts. A user has the `ADMIN` or the `USER` role. A
   [deploy token](../creating-a-deploy-token/) gives a CI job or an external party access to a single repository
   without a user account.

6. **Public or private repositories**  
   Public repositories can be downloaded by anyone. Private repositories require a signed-in account or a deploy token.
   Repsy has no per-repository collaborator lists; see [Understanding Public vs Private](../understanding-public-vs-private/)
   for who can do what.

7. **Web UI**  
   Browse repositories and packages, create repositories, manage deploy tokens and users, and copy the client
   configuration for each repository. See [Navigating the Web UI](../navigating-the-web-ui/).

8. **Optional vulnerability scanning**  
   Repsy can scan Maven, npm, PyPI and Docker packages for known vulnerabilities with a separate, Trivy-based scanner
   service. Scanning is switched off by default and adds no requirement to a plain installation.


# Good to Know

- There is no self-service sign-up. The first administrator account is created when Repsy starts for the first time,
  and administrators create every other account.
- The web UI always asks for a sign-in, also for public repositories. Public repositories can be read without
  credentials only through package manager clients.
- Every signed-in user can read and write every repository, private ones included. Use deploy tokens, not user
  accounts, to give someone access to just one repository.


# Where to Go Next

- [Quick Start](../quick-start/): run Repsy Open Source with Docker and publish your first package.
- [Ports and Repository URLs](../ports-and-repository-urls/): which port serves what, and how the address of a repository
  is formed.
- [Creating Your First Repository](../creating-your-first-repository/)
