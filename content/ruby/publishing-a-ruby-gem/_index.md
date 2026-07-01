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

Gem push credentials are kept in `~/.gem/credentials`. Repsy expects a **Basic auth** value (Base64-encoded `username:password`). Run the following command — replace `{MY_REPSY_USERNAME}` and `{MY_REPSY_PASSWORD_OR_DEPLOY_TOKEN}` with your actual values:

```bash
echo ":repsy: Basic $(echo -n '{MY_REPSY_USERNAME}:{MY_REPSY_PASSWORD_OR_DEPLOY_TOKEN}' | base64)" \
  >> ~/.gem/credentials
chmod 0600 ~/.gem/credentials
```

The `echo -n` flag suppresses the trailing newline so the base64 encoding is correct. After running the command, `~/.gem/credentials` will contain a line like:

```yaml
---
:repsy: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
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

**Note:** Yanking a version permanently removes it from the index. Yanked versions cannot be downloaded and cannot be re-published under the same version number.

{{< /steps >}}
