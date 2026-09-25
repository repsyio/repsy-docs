+++
title = "Ruby"
chapter = true
weight = 1000
description = "Guides for hosting Ruby gem repositories: create one, publish and install gems with gem and Bundler, yank versions and use CI."
+++

# Ruby

This documentation contains a user guide and samples regarding the use of private and public RubyGems repositories in Repsy Open Source. A Ruby repository serves the RubyGems push and yank API and the Bundler Compact Index protocol, so `gem` and Bundler can publish to it and install from it.

The address of a Ruby repository is the address of your instance's repository port followed by the name of the repository, `{{% repo-url %}}/<repo-name>`. There is no username in the address. You use the same address for `gem push --host`, `gem install --source` and the `source` line of a `Gemfile`.

A repository has only the gems that you push to it. Bundler and `gem` fetch the dependencies of your gems from the other sources that you configure, such as rubygems.org.

### Getting Started

- [Creating a Private Ruby Registry](creating-a-private-ruby-registry/): create a repository and get your credentials.
- [Publishing a Ruby Gem](publishing-a-ruby-gem/) and [Installing a Ruby Gem](installing-a-ruby-gem/): a short setup for `gem` and Bundler.

### Tutorials

- [Publishing and Installing Gems with gem](publishing-and-installing-gems-with-gem/): build a gem, store the key, `gem push`, `gem install --source`, `gem sources`, and what each refusal looks like.
- [Using Repsy with Bundler](using-repsy-with-bundler/): `source` blocks, credentials with `bundle config` and environment variables, dependencies, lock files and troubleshooting.
- [Yanking Gems](yanking-gems/): what a yanked version means for `gem`, Bundler and the web UI, who may yank, and what you can do afterwards.
- [Using Ruby in CI](using-ruby-in-ci/): deploy tokens and secrets in a pipeline that publishes or installs gems.
