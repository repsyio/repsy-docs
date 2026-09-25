+++
title = "Using Ruby in CI"
weight = 1090
description = "Publish, yank and install gems in a pipeline with a deploy token, including a GitHub Actions example."
+++

A pipeline that publishes a gem to your Repsy Open Source Ruby repository, or installs gems from it, needs a credential and the address of the repository. This page shows how to keep both out of your scripts: use a deploy token, store it as a secret of your CI system, and let the job read it from an environment variable. The commands are the ones from [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/) and [Using Repsy with Bundler](../using-repsy-with-bundler/).

### Use a Deploy Token

Do not put the password of a user account into a pipeline. Create a [deploy token](../creating-a-private-ruby-registry/#get-your-credentials) of the repository instead:

- A job that publishes gems needs a token with the **Read/Write** access type.
- A job that yanks a gem needs a **Read/Write** token too.
- A job that only installs gems needs a token with the **Read Only** access type.

Copy the token when Repsy shows it, because it is shown only once, and store it as a secret of your CI system. Repsy checks only the token, so the username can be any non-empty value. The jobs below read four values, which the examples call `REPSY_URL`, `REPSY_REPOSITORY`, `REPSY_USERNAME` and `REPSY_TOKEN`:

| Variable | Value |
| --- | --- |
| `REPSY_URL` | The address of the package protocol port of your instance with its scheme, for example `https://repsy.example.com` or `http://localhost:9090`. |
| `REPSY_REPOSITORY` | The name of the Ruby repository. |
| `REPSY_USERNAME` | Any non-empty value with a deploy token. |
| `REPSY_TOKEN` | The deploy token. Store it as a secret. |

The token travels over HTTP Basic authentication with every request, so serve the instance over HTTPS.

### Publish a Gem

`gem push` reads its key from the environment variable `GEM_HOST_API_KEY`, so the token needs no file and does not appear on the command line. A deploy token can be the value as it stands:

```bash
set -eu

gem build my_gem.gemspec --output my_gem.gem
GEM_HOST_API_KEY="$REPSY_TOKEN" gem push my_gem.gem \
  --host "$REPSY_URL/$REPSY_REPOSITORY" < /dev/null
```

`gem push` exits with a non-zero status when Repsy refuses the gem, so `set -e` stops the job. The `< /dev/null` makes a job with a missing key fail at once: without a key, `gem push` asks you to sign in on the terminal.

To publish with the password of a user account instead of a token, put `Basic <base64 of username:password>` into `GEM_HOST_API_KEY`, as the value of the key in `~/.gem/credentials` is written. Use a token wherever you can.

### Install with Bundler

Bundler reads the credentials of a source from an environment variable named after the host of the source: `BUNDLE_` and the host name in upper case, with `.` written as `__` and `-` as `___`. The host `repsy.example.com` gives `BUNDLE_REPSY__EXAMPLE__COM`. Set it to `<username>:<token>` and run Bundler, with a `Gemfile` that has the source in a block, see [Using Repsy with Bundler](../using-repsy-with-bundler/#write-the-gemfile):

```bash
set -eu

export BUNDLE_REPSY__EXAMPLE__COM="$REPSY_USERNAME:$REPSY_TOKEN"
bundle install
```

If the host name of your instance is not fixed in the script, derive the name of the variable from `REPSY_URL`:

```bash
host=${REPSY_URL#*://}; host=${host%%/*}; host=${host%%:*}
export "BUNDLE_$(printf '%s' "$host" | sed 's/-/___/g; s/\./__/g' | tr 'a-z' 'A-Z')=$REPSY_USERNAME:$REPSY_TOKEN"
bundle install
```

Do not put the token into the `Gemfile` or into a committed `.bundle/config`. The `Gemfile.lock` has no credentials, so commit it: CI then installs exactly the versions that you tested.

### Install with gem

`gem install` takes the credentials in the address of the source, which shows up in the process list of the runner. Prefer Bundler in a pipeline. If you need `gem install`, add `--clear-sources`, so that the job cannot take a gem of the same name from rubygems.org:

```bash
gem install my_gem --clear-sources \
  --source "https://$REPSY_USERNAME:$REPSY_TOKEN@${REPSY_URL#*://}/$REPSY_REPOSITORY"
```

Use `http://` where your instance serves plain HTTP.

### Yank a Gem

`gem yank` exits with `0` even when Repsy refuses the request, so a job has to read its output. This function fails when the answer is not the success message:

```bash
yank_gem() {
  out=$(GEM_HOST_API_KEY="$REPSY_TOKEN" gem yank "$1" -v "$2" \
    --host "$REPSY_URL/$REPSY_REPOSITORY" < /dev/null 2>&1)
  printf '%s\n' "$out"
  case "$out" in
    *"Successfully yanked gem"*) ;;
    *) return 1 ;;
  esac
}

yank_gem my_gem 1.0.0
```

A **Read Only** token, or the password of a user without the `ADMIN` role, is refused with `unAuthorized`, see [Yanking Gems](../yanking-gems/).

### A GitHub Actions Example

The steps are the same in every CI system. In GitHub Actions the secret becomes an environment variable of the step:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.4"
      - name: Publish the gem
        env:
          REPSY_URL: https://repsy.example.com
          REPSY_REPOSITORY: ruby
          GEM_HOST_API_KEY: ${{ secrets.REPSY_TOKEN }}
        run: |
          gem build my_gem.gemspec --output my_gem.gem
          gem push my_gem.gem --host "$REPSY_URL/$REPSY_REPOSITORY" < /dev/null
```

And in GitLab CI, with a masked variable `REPSY_TOKEN` under **Settings > CI/CD > Variables**:

```yaml
publish:
  image: ruby:3.4
  variables:
    REPSY_URL: https://repsy.example.com
    REPSY_REPOSITORY: ruby
  script:
    - gem build my_gem.gemspec --output my_gem.gem
    - GEM_HOST_API_KEY="$REPSY_TOKEN" gem push my_gem.gem --host "$REPSY_URL/$REPSY_REPOSITORY" < /dev/null
```

### Version Your Gems in the Pipeline

A publish job that runs again for a version that already exists fails with `409`, `gemVersionAlreadyExists`, when the repository has **Package Override** on **Deny**, and it replaces the gem when it is on **Allow**, see [Pushing a Version Again](../publishing-and-installing-gems-with-gem/#pushing-a-version-again). A yanked version is refused in both cases. Give every build its own version in the gemspec, for example a pre-release version such as `1.0.0.pre42` for a build of a branch, and pin the version in the jobs that install it. A pipeline that keeps sending a token that was rotated or revoked counts as a failed login, and is blocked for a while, see [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit).
