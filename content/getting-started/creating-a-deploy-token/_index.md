+++
title = "Creating a Deploy Token"
weight = 14
chapter = true
+++


### Creating a Deploy Token

A deploy token is a credential that belongs to a single repository. Use it instead of a user account password in CI
jobs and when you give an external party access to a repository: it opens that repository and nothing else, and you can
rotate or revoke it without touching any user account. See
[Keeping Repositories Apart](../understanding-public-vs-private/#keeping-repositories-apart) for when to choose a
deploy token over a user account.

Anyone can already download from a public repository without credentials, so deploy tokens matter most for private
repositories and for publishing.

### What a Deploy Token Can Do

- **One repository only.** A token works for the repository it was created in. Repsy rejects it for every other
  repository.
- **Read/Write or Read Only.** A read-only token can download packages but is rejected for publishing and for any change
  to the repository.
- **Expires within one year.** Every token has an expiry date, at most 365 days after you create it. There is no token
  that never expires.
- **Works with every package type.** Package manager clients accept the token in place of your password. See
  [Use the token in your client](#use-the-token-in-your-client) below.

{{< steps >}}
### Create the token

You need the `ADMIN` role. Only administrators can create, list, rotate or revoke deploy tokens.

1. Go to the **Repositories** tab.
2. Open the more options menu (⋮) next to the repository.
3. Click **Settings**.
4. In the **Deploy Tokens** section, click **Create Token**.
5. Fill in the form and click **Create**.

The form has these fields:

| Field | Required | Details |
| --- | --- | --- |
| Name | Yes | 1 to 80 characters. |
| Username | No | 3 to 25 characters: lowercase letters, digits, `_` and `-`. If you leave it empty, Repsy generates one that starts with `repsy-deploy-token-`. |
| Description | No | Up to 500 characters. |
| Access Type | No | **Read/Write** (the default) or **Read Only**. |
| Expiration Date | No | From tomorrow up to 365 days from today. The form starts at 365 days from today. |

The **Deploy Tokens** table then lists each token with its name, username, creation date, expiry date and permissions
(`R/W` or `R/O`).

### Save the token

Repsy shows the token username and the token itself once, right after you create it. Copy both and store the token in
your CI system's secret store or in a password manager. Do not commit it to version control.

Repsy keeps only a hash of the token, so it cannot show you the token again. If you lose it, [rotate the token](#rotating-and-revoking)
to get a new one.

### Use the token in your client

Wherever a client configuration asks for your Repsy password, enter the deploy token instead. The token value is the
credential: Repsy matches only the token and does not check the username. The username shown in the **Username** column
of the **Deploy Tokens** table is a label that helps you tell tokens apart. Clients that require a username can send
any value, and the configure action in the **Actions** column of that table shows client snippets that already contain
the token's username. Cargo takes only the token. If the value in the password field is not a valid deploy token of that
repository, Repsy checks the pair as an account username and password instead.

| Package type | Where the credential goes | Username | Password |
| --- | --- | --- | --- |
| [Maven](../../maven/using-private-maven-repository/) | The `<server>` entry with the id `repsy` in `~/.m2/settings.xml` | Any value | Token |
| [npm](../../npm/publishing-an-npm-package/) | The prompts of `npm login` | Any value | Token |
| [PyPI](../../pypi/publishing-a-pypi-package/) | The `[repsy]` section of `~/.pypirc` | Any value | Token |
| [Docker](../../docker/publishing-a-docker-image/) | The prompts of `docker login repo.repsy.io` | Any value | Token |
| [Cargo](../../cargo/publishing-a-cargo-crate/) | `cargo login --registry repsy <token>` | Not used | Token |
| [Go](../../go/installing-a-go-module/) | The `machine repo.repsy.io` entry in `~/.netrc` | Any value | Token |
| [Helm](../../helm/publishing-a-helm-chart/) | The `--password` option of `helm repo add` or `helm registry login` | Any value | Token |
| [NuGet](../../nuget/publishing-a-nuget-package/) | The `ClearTextPassword` value in your user-level `NuGet.Config` | Any value | Token |
| [Ruby](../../ruby/publishing-a-ruby-gem/) | The Base64-encoded `username:password` value in `~/.gem/credentials` | Any value | Token |

Each package type's page shows the full client configuration. In CI, pass the token through a secret environment
variable instead of writing it into a file that you commit.
{{< /steps >}}

### Rotating and Revoking

Both actions are in the **Actions** column of the **Deploy Tokens** table and need the `ADMIN` role.

- **Rotate** issues a new token for the same entry. The old token stops working, so update every place that uses it.
  Repsy shows the new token once, like when you created the token.
- **Delete** revokes the token. It stops working immediately, and clients that still use it are refused.

Rotate a token when it may have leaked or when someone who knew it no longer needs access. Delete it when nothing should
use it any more.

### When a Token Expires

After its expiry date, Repsy rejects the token with a `401` response and the message "Deploy token expired." The
**Expires** column marks tokens that have expired or that expire within 7 days.

You cannot extend the expiry date of a token, and a token is never valid for more than one year. To keep a client
working, do one of these:

- **Create a new token.** It can be valid for up to 365 days from the day you create it.
- **Rotate the expired token.** Its validity starts again for the length it was created with, and it gets a new
  generated username. Because Repsy does not check the username, update only the token in your client configuration.
