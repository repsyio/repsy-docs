+++
title = "Installing a Ruby Gem"
weight = 1030
+++

When you create a repository, it will be private by default. Before you install a gem from a private repository, you first need to configure credentials as shown in the previous page. If your repository is public, you can skip the credentials part, but you must still provide the source URL.

{{< product "os" >}}
The address of a repository has no username: it is `{{% repo-url %}}/<repo-name>`, where `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). Keep the scheme of your instance in the examples below: an instance that serves plain HTTP needs `http://` where they show `https://`. A private repository takes a user name and password, or a [deploy token](../../getting-started/creating-a-deploy-token/) in place of the password, and a **Read Only** token is enough to install. For complete walk-throughs, see [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/) and [Using Repsy with Bundler](../using-repsy-with-bundler/).
{{< /product >}}

{{< steps >}}
### Install with gem install

You can install a gem directly from your Repsy repository using the `--source` flag:

**Public repository:**

```bash
gem install my_gem --source {{% repo-url %}}/<repo-name>
```

**Private repository** — embed credentials in the URL:

```bash
gem install my_gem \
  --source https://<username>:<password>@{{% repo-url scheme="false" %}}/<repo-name>
```

### Install with Bundler

Bundler is the recommended way to manage gem dependencies in a project. Add your Repsy repository as a source in your `Gemfile`.

**Public repository:**

```ruby
# Gemfile
source "{{% repo-url %}}/<repo-name>"

gem "my_gem", "~> 1.0"
```

**Private repository** — store credentials in Bundler's local config instead of the `Gemfile` so they are never committed to version control:

```bash
bundle config set --local \
  {{% repo-url %}}/<repo-name> \
  "<username>:<password>"
bundle config set --local path ~/.gem/bundle
```

Then reference the source in your `Gemfile` without credentials:

```ruby
# Gemfile
source "{{% repo-url %}}/<repo-name>"

gem "my_gem", "~> 1.0"
```

Run Bundler to install dependencies:

```bash
bundle install
```

**Tip:** For CI/CD pipelines, use a [Deploy Token](../../getting-started/creating-a-deploy-token/) as the password and inject it via an environment variable:

```bash
bundle config set --local \
  {{% repo-url %}}/<repo-name> \
  "<username>:${REPSY_DEPLOY_TOKEN}"
bundle config set --local path ~/.gem/bundle
```

That is all! If you have completed all required steps as described, gem and Bundler will install your gems from your Repsy repository successfully.

{{< /steps >}}

## Compact Index Endpoints Reference

Repsy implements the [Bundler Compact Index protocol](https://github.com/rubygems/compact_index). Bundler uses these endpoints automatically when you point it at a Repsy source URL.

| Endpoint | Method | Description |
|---|---|---|
| `/names` | `GET` | Returns a newline-separated list of all gem names available in the repository. |
| `/versions` | `GET` | Returns a space-separated three-column file: `name versions_csv md5`. Each row lists a gem name, a comma-separated list of its available versions, and an MD5 checksum. Bundler uses this to build a local dependency graph without downloading individual gem files. |
| `/info/<gem-name>` | `GET` | Returns detailed dependency and platform information for every version of the specified gem. |

These endpoints are served relative to your repository base URL:

```
{{% repo-url %}}/<repo-name>/names
{{% repo-url %}}/<repo-name>/versions
{{% repo-url %}}/<repo-name>/info/my_gem
```

Bundler caches the responses from `/versions` and `/info/<gem-name>` locally in `~/.bundle/cache/compact_index/` for faster subsequent runs.

{{< product "os" >}}
The Compact Index leaves a [yanked](../yanking-gems/) version out of `/info/<gem-name>` and marks it in `/versions` with a leading `-`, so Bundler and `gem` no longer resolve it. `gem` also uses the older index files `/specs.4.8.gz`, `/latest_specs.4.8.gz` and `/prerelease_specs.4.8.gz`, and `/quick/Marshal.4.8/<gem-name>-<version>.gemspec.rz` for the metadata of one version. The `.gem` files are served from `/gems/<gem-name>-<version>.gem`, with `-<platform>` before `.gem` for a gem that is not built for the `ruby` platform.
{{< /product >}}
