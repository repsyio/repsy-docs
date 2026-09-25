+++
title = "Using Repsy with Bundler"
weight = 1070
+++

This tutorial shows how to install gems from a Repsy Open Source Ruby repository with Bundler: the `source` lines of the `Gemfile`, the ways to give Bundler your credentials, what happens to dependencies, lock files and yanked versions, and what to do when an install fails. It complements [Installing a Ruby Gem](../installing-a-ruby-gem/), which shows the same in short. To publish a gem, see [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/).

### Prerequisites

- A Ruby repository on your Repsy Open Source instance with at least one gem in it, see [Creating a Private Ruby Registry](../creating-a-private-ruby-registry/) and [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/). The address of the repository is `{{% repo-url %}}/<repo-name>`. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start.
- For a private repository, a credential: your username and password, or a [deploy token](../creating-a-private-ruby-registry/#get-your-credentials). A **Read Only** token is enough to install, and the username can be any non-empty value. A public repository can be read without credentials.

### Write the Gemfile

Name the repository in a `source` block, and list the gems that come from it inside the block:

```ruby
# Gemfile
source "https://rubygems.org"

source "{{% repo-url %}}/<repo-name>" do
  gem "my_gem", "~> 1.0"
end
```

The block is the important part. Bundler installs the gems inside a block only from that source, so a gem of the same name on rubygems.org can never replace yours. Every source after the first one has to have a block: a `Gemfile` with two global `source` lines is refused with `This Gemfile contains multiple global sources. Each source after the first must include a block to indicate which gems should come from that source`.

The first line, the global source, is for everything else. It is needed when your gem has dependencies that are not in your repository: the repository has only the gems that you pushed, and without `source "https://rubygems.org"` Bundler stops with `Could not find compatible versions ... rainbow ~> 3.0 could not be found in locally installed gems`. The `Gemfile` shown in the **Configure** dialog is only the block, which is enough for a gem without dependencies. A dependency that is in the same repository needs no line of its own: Bundler finds it there.

Then install:

```bash
bundle install
```

```text
Fetching gem metadata from https://<your-repsy-host>/<repo-name>/.
Resolving dependencies...
Fetching my_gem 1.0.0
Installing my_gem 1.0.0
Bundle complete! 1 Gemfile dependency, 1 gem now installed.
```

A public repository needs nothing else. A private one needs credentials.

### Give Bundler the Credentials

Without credentials, a private repository makes Bundler stop and tell you what to do:

```text
Authentication is required for <your-repsy-host-name>.
Please supply credentials for this source. You can do this by running:
`bundle config set --global <your-repsy-host-name> username:password`
or by storing the credentials in the `BUNDLE_<YOUR-REPSY-HOST-NAME>` environment
variable
```

Bundler needs both parts, `<username>:<password-or-token>`: a token on its own is refused with `Bad username or password`. With a deploy token, the username can be any non-empty value. Percent-encode characters that have a meaning in a URL, such as `@`, `:` and `/`, in the username and the password.

There are four places for them:

| Where | How | Use it for |
| --- | --- | --- |
| The Bundler configuration of your user | `bundle config set --global <address> "<username>:<password-or-token>"` | Your own machine. The value is stored in `~/.bundle/config`, outside of any project. |
| An environment variable | `BUNDLE_<HOST>="<username>:<password-or-token>"` | CI jobs, containers and everything that has secrets in its environment. |
| The Bundler configuration of the project | `bundle config set --local <address> "<username>:<password-or-token>"` | Not recommended: it writes `.bundle/config` into the project, which is easy to commit by mistake. |
| The address in the `Gemfile` | `source "https://<username>:<password-or-token>@..."` | Not recommended: the secret ends up in the `Gemfile`, and so in version control. Bundler leaves it out of `Gemfile.lock`. |

`<address>` in the first and the third row is the address of the repository, or only the host name:

```bash
bundle config set --global {{% repo-url %}}/<repo-name> "<username>:<password-or-token>"
bundle config set --global <your-repsy-host-name> "<username>:<password-or-token>"
```

Bundler looks for the credentials of the full address first and then for those of the host. A deploy token belongs to one repository, so give it with the full address. The host name form is for a user account, which opens every repository of the instance. The host name is the host without the scheme, the port and the path: the port is not part of the key.

The name of the environment variable is `BUNDLE_` followed by the host name in upper case, with every `.` written as `__` and every `-` as `___`. The host `repsy.example.com` gives `BUNDLE_REPSY__EXAMPLE__COM`, and `my-repsy` gives `BUNDLE_MY___REPSY`. When Bundler asks for credentials, it prints the name of the variable that it looks for:

```bash
export BUNDLE_REPSY__EXAMPLE__COM="<username>:${REPSY_TOKEN}"
bundle install
```

The **Configure** dialog of a repository shows `bundle config <address> <username>:<DEPLOY_TOKEN>`, without `set`. Bundler 4 prints `[DEPRECATED] Using the config command without a subcommand ... is deprecated` for that form and tells you to use `bundle config set`, as the commands above do.

Check what Bundler knows with `bundle config list`. It shows the password of a credential as `[REDACTED]`.

### Plain HTTP and HTTPS

The default setup of Repsy Open Source uses plain HTTP, and Bundler works with it, with credentials, and without a warning. Your credentials cross the network unencrypted, so serve a shared instance over HTTPS, and use `https://` in the `Gemfile`, see [Enabling HTTPS](../../administration/enabling-https/).

### Lock Files and Updates

`bundle install` writes the source to `Gemfile.lock`, without credentials, and records the SHA-256 checksum that Repsy serves for each gem of the repository, in the `CHECKSUMS` section:

```text
GEM
  remote: https://<your-repsy-host>/<repo-name>/
  specs:
    my_gem (1.0.0)
```

Commit `Gemfile.lock`. The next `bundle install`, on your machine or in CI, installs exactly the locked versions. To move to a newer version, publish it and run `bundle update my_gem`.

The lock file also decides what happens to a [yanked](../yanking-gems/) version. A yanked version is not in the index any more, so a project that is locked to it and does not have the gem installed already stops:

```text
Your bundle is locked to my_gem (1.0.0) from rubygems repository
https://<your-repsy-host>/<repo-name>/ or installed locally, but that version can no
longer be found in that source. That means either the author of
my_gem (1.0.0) has removed it, or you no longer have access to that
source. ...
```

When the `Gemfile` has only the `source` block, Bundler's message is a different one, and it says that the gem is `not installed` and asks for a global remote source. It means the same. Run `bundle update my_gem` to move to a version that exists: Bundler installs the newest version that is not yanked, even when that is older than the locked one (`Note: my_gem version regressed from 1.1.0 to 1.0.0`). A machine that has the gem installed already keeps working.

### Versions That Need Another Ruby

Repsy stores the `required_ruby_version` of a gem, but it does not put it into the index that Bundler reads. Bundler therefore cannot skip a version that does not fit your Ruby and pick an older one. If the newest version needs a newer Ruby than yours, `bundle install` stops with `my_gem-2.0.0 requires ruby version >= 3.4, which is incompatible with the current version`. Name the version that fits in the `Gemfile`: `gem "my_gem", "~> 1.0"`.

### Troubleshooting

| What you see | Cause |
| --- | --- |
| `Authentication is required for <host>` | The repository is private and Bundler has no credentials for it. Set them as described above. |
| `Bad username or password for <host>` | The credentials are wrong, or the value has no username, or the deploy token is expired, revoked or belongs to another repository. |
| `Could not fetch specs from <address> due to underlying error <bad response 404 (...)>` | There is no Ruby repository at that address: check the name of the repository and its type. |
| `Could not find gem 'my_gem' in rubygems repository <address>` | The gem or the version you named is not in the repository, or it was yanked. |
| `Could not find compatible versions ... could not be found in locally installed gems` | A dependency of your gem is not in the repository. Add `source "https://rubygems.org"` as the first line of the `Gemfile`. |
| `This Gemfile contains multiple global sources` | More than one `source` line has no block. Put the gems of the repository in a `source ... do` block. |
| `Your bundle is locked to ... that version can no longer be found in that source` | The locked version was yanked, see [Lock Files and Updates](#lock-files-and-updates). |
| `... requires ruby version >= ..., which is incompatible with the current version` | See [Versions That Need Another Ruby](#versions-that-need-another-ruby). |
| A `429` answer | Too many requests with wrong credentials came from your address, see [Authenticating from CI](../../administration/authenticating-from-ci/#the-failed-login-limit). |
