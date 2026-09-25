+++
title = "Publishing a Ruby Gem"
weight = 1020
description = "Build a gem, store your credentials for gem push, push the gem to a repository and yank a version if needed."
+++

{{< product "cloud" >}}You have registered and created a repository on [Repsy](https://repsy.io/).{{< /product >}}{{< product "os" >}}You have created a repository on your Repsy Open Source instance.{{< /product >}} You are now ready to publish Ruby gems to your repository.

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

Gem push credentials are kept in `~/.gem/credentials`. Repsy expects a **Basic auth** value (Base64-encoded `username:password`). Run the following command — replace `<username>` and `<password-or-token>` with your actual values:

```bash
echo ":repsy: Basic $(echo -n '<username>:<password-or-token>' | base64)" \
  >> ~/.gem/credentials
chmod 0600 ~/.gem/credentials
```

The `echo -n` flag suppresses the trailing newline so the base64 encoding is correct. After running the command, `~/.gem/credentials` will contain a line like:

```yaml
---
:repsy: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

**Tip:** For CI/CD pipelines, use a [Deploy Token](../../getting-started/creating-a-deploy-token/) instead of your account password.

{{< product "os" >}}With a deploy token, the username can be any value: Repsy checks only the token. If the `~/.gem` directory does not exist yet, create it first with `mkdir -p ~/.gem`. RubyGems refuses to use a credentials file that other users can read, which is why the commands end with `chmod 0600`. The tutorial [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/) shows the other ways to hand the key to `gem push`.{{< /product >}}

### Push the gem

Use `gem push` with the `--host` flag pointing to your Repsy repository and `--key` matching the credential entry you added above:

```bash
gem push my_gem-1.0.0.gem \
  --host {{% repo-url %}}/<repo-name> \
  --key repsy
```

{{< product "cloud" >}}Replace `<username>` and `<repo-name>` with your actual values.{{< /product >}}{{< product "os" >}}Replace `<repo-name>` with the name of your repository. There is no username in the address, and `https://<your-repsy-host>` stands for the address of the package protocol port of your instance, for example `http://localhost:9090` for a local start, see [Ports and Repository URLs](../../getting-started/ports-and-repository-urls/). If `gem push` refuses the gem because the `allowed_push_host` of the gemspec does not match this address, remove that line from the gemspec or set it to the address of your repository. `bundle gem` generates a gemspec with the line.{{< /product >}}

Congratulations, you have published a gem to your Repsy repository! You can now install it in any Ruby project.

### Yank a gem version

If you need to remove a specific version from your repository, use `gem yank`:

```bash
gem yank my_gem -v 1.0.0 \
  --host {{% repo-url %}}/<repo-name> \
  --key repsy
```

{{< product "cloud" >}}
A pre-release version is yanked the same way: `gem yank` has no separate option for it, so give the full version number, for example `-v 1.0.0.pre`.

**Note:** Yanking a version permanently removes it from the index. Yanked versions cannot be downloaded and cannot be re-published under the same version number.
{{< /product >}}

{{< product "os" >}}
Add `--platform <platform>` for a gem that was built for a platform other than `ruby`, for example `java`; without it, Repsy looks for the `ruby` platform of that version.

**Note:** Yanking a version removes it from the index, so `gem install` and Bundler no longer find it, and it cannot be pushed again under the same version number. Its `.gem` file stays downloadable from its exact address. Yanking needs the password of an administrator or a **Read/Write** deploy token, and `gem yank` exits with `0` even when Repsy refuses the request, so read its output. See [Yanking Gems](../yanking-gems/).
{{< /product >}}

{{< /steps >}}
