+++
title = "Publishing a Ruby Gem"
weight = 92
+++

You have registered and created a repository on [Repsy](https://repsy.io/). You are now ready to publish Ruby gems to your repository.

{{< steps >}}
### Create a gem project

To create a new gem skeleton, use Bundler's `gem` command:

```bash
bundle gem my_gem
cd my_gem
```

This generates a `my_gem.gemspec` file. Fill in the required metadata before building:

```ruby
Gem::Specification.new do |spec|
  spec.name    = "my_gem"
  spec.version = "1.0.0"
  spec.authors = ["Your Name"]
  spec.email   = ["you@example.com"]
  spec.summary = "A sample gem published to Repsy."
  spec.files   = Dir["lib/**/*", "README.md"]
end
```

Build the `.gem` archive:

```bash
gem build my_gem.gemspec
```

This produces `my_gem-1.0.0.gem` in the current directory.

### Store credentials

Gem push credentials are kept in `~/.gem/credentials`. Create or edit that file and add an entry for Repsy. Replace `{MY_REPSY_PASSWORD_OR_DEPLOY_TOKEN}` with your Repsy account password or a [Deploy Token](https://repsy.io):

```yaml
---
:repsy: {MY_REPSY_PASSWORD_OR_DEPLOY_TOKEN}
```

Set the file permissions so that only your user can read it:

```bash
chmod 0600 ~/.gem/credentials
```

**Tip:** For CI/CD pipelines, use a [Deploy Token](https://repsy.io) instead of your account password.

### Push the gem

Use `gem push` with the `--host` flag pointing to your Repsy repository and `--key` matching the credential entry you added above:

```bash
gem push my_gem-1.0.0.gem \
  --host https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME} \
  --key repsy
```

Replace `{MY_REPSY_USERNAME}` and `{MY_REPOSITORY_NAME}` with your actual values.

Congratulations, you have published a gem to your Repsy repository! You can now install it in any Ruby project.

### Yank a gem version

If you need to remove a specific version from your repository, use `gem yank`:

```bash
gem yank my_gem -v 1.0.0 \
  --host https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME} \
  --key repsy
```

To yank a pre-release version, add the `--pre` flag:

```bash
gem yank my_gem -v 1.0.0.pre \
  --host https://repo.repsy.io/{MY_REPSY_USERNAME}/{MY_REPOSITORY_NAME} \
  --key repsy \
  --pre
```

**Note:** Yanking a version makes it unavailable for new installs but does not delete it from the repository storage.

{{< /steps >}}
