+++
title = "Installing a Ruby Gem"
weight = 93
+++

When you create a repository, it will be private by default. Before you install a gem from a private repository, you first need to configure credentials as shown in the previous page. If your repository is public, you can skip the credentials part, but you must still provide the source URL.

{{< steps >}}
### Install with gem install

You can install a gem directly from your Repsy repository using the `--source` flag:

**Public repository:**

```bash
gem install my_gem --source https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}
```

**Private repository** — embed credentials in the URL:

```bash
gem install my_gem \
  --source https://{MY_REPSY_USERNAME}:{MY_REPSY_PASSWORD}@repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}
```

### Install with Bundler

Bundler is the recommended way to manage gem dependencies in a project. Add your Repsy repository as a source in your `Gemfile`.

**Public repository:**

```ruby
# Gemfile
source "https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}"

gem "my_gem", "~> 1.0"
```

**Private repository** — store credentials in Bundler's local config instead of the `Gemfile` so they are never committed to version control:

```bash
bundle config set --local \
  https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME} \
  "{MY_REPSY_USERNAME}:{MY_REPSY_PASSWORD}"
bundle config set --local path ~/.gem/bundle
```

Then reference the source in your `Gemfile` without credentials:

```ruby
# Gemfile
source "https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}"

gem "my_gem", "~> 1.0"
```

Run Bundler to install dependencies:

```bash
bundle install
```

**Tip:** For CI/CD pipelines, use a [Deploy Token](https://repsy.io) as the password and inject it via an environment variable:

```bash
bundle config set --local \
  https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME} \
  "{MY_REPSY_USERNAME}:${REPSY_DEPLOY_TOKEN}"
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
| `/info/{gemname}` | `GET` | Returns detailed dependency and platform information for every version of the specified gem. |

These endpoints are served relative to your repository base URL:

```
https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}/names
https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}/versions
https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME}/info/my_gem
```

Bundler caches the responses from `/versions` and `/info/{gemname}` locally in `~/.bundle/cache/compact_index/` for faster subsequent runs.
