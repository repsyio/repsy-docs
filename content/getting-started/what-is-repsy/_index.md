+++
title = "What is Repsy?"
weight = 11
chapter = true
+++


# What is Repsy?

Repsy is a cloud-native artifact repository service for developers and teams.  
It supports publishing and hosting packages in the following formats:

- [Maven](../../maven/)
- [Npm](../../npm/)
- [PyPI](../../pypi/)
- [Docker](../../docker/)
- [Cargo](../../cargo/)
- [Go](../../go/)
- [Helm](../../helm/)
- [NuGet](../../nuget/)
- [Ruby](../../ruby/)


# Key Features

1. **Multi-format support**  
   Host packages for different ecosystems from one account.

2. **Token-based authentication**  
   Secure and flexible access management.

3. **Unlimited repositories**  
   Create as many public or private repositories as you need.

4. **Public or private access**  
   Public repositories can be downloaded by anyone. Private repositories require a signed-in account or a deploy token.
   A deploy token is scoped to a single repository, so use one to give a CI job or an external party access to just
   that repository. Repsy has no per-repository collaborator lists; see
   [Understanding Public vs Private](../understanding-public-vs-private/) for who can do what.

5. **Generous free tier**  
   20 GB of free storage per user.

6. **CI/CD ready**  
   Easily integrate with your existing build pipelines.


# Supported Use Cases

- Private internal package hosting
- Open-source libraries
- CI/CD workflows
- Docker image publishing


# Infrastructure Highlights

- Global redundancy
- Fast CDN-based delivery
- High availability and uptime
- Scalable storage with up to 5TB for enterprise plans
