+++
title = "Yanking Gems"
weight = 1080
description = "Yank a gem version so that new installs skip it, see who may yank, and delete a version in the web UI."
+++

Yanking takes a version of a gem out of the index, so that nobody installs it any more, without deleting it. This page explains how to yank a version, who may do it, what `gem`, Bundler and the web UI do with a yanked version, and how it differs from deleting the version in the web UI.

### When to Yank

Yank a version that you published by mistake or that is broken, so that new installs and updates skip it. The version number stays taken: nobody can push another gem under it. Existing installs are not touched, and a project that is locked to the version and has it installed keeps working.

Yanking does **not** remove the `.gem` file: it can still be downloaded from its exact address. If you published a secret in a gem, yank is not enough. Delete the version in the web UI as described [below](#delete-a-version-in-the-web-ui), and change the secret.

### Yank a Version

Use `gem yank` with the same `--host` and `--key` as for `gem push`, see [Publishing and Installing Gems with gem](../publishing-and-installing-gems-with-gem/#store-the-key):

```bash
gem yank my_gem -v 1.0.0 \
  --host {{% repo-url %}}/<repo-name> \
  --key repsy
```

```text
Yanking gem from https://<your-repsy-host>/<repo-name>...
Successfully yanked gem: my_gem (1.0.0)
```

Add `--platform <platform>` for a gem that was built for a platform other than `ruby`, for example `--platform java`. Without it, Repsy looks for the `ruby` platform of that version, and answers `Gem version not found.` when there is none. Current versions of `gem yank` have no `--pre` option: name a pre-release version like any other, for example `-v 1.0.0.pre1`.

Yanking is a management operation, so it needs more than publishing does:

| Credential | Can yank |
| --- | --- |
| The password of a user with the `ADMIN` role | Yes |
| A deploy token with the **Read/Write** access type, of this repository | Yes |
| The password of a user with the `USER` role | No. The user can publish, but the answer to a yank is `unAuthorized`. |
| A **Read Only** deploy token | No, `unAuthorized`. |

{{% notice warning %}}
`gem yank` exits with `0` even when Repsy refuses the request: it prints the answer of Repsy and does not treat it as a failure. A script or a CI job has to read the output and look for `Successfully yanked gem`, see [Using Ruby in CI](../using-ruby-in-ci/).
{{% /notice %}}

Repsy answers a request that it refuses with one of these:

| Answer | Cause |
| --- | --- |
| `401`, `unAuthorized`: `The user has logged in but has no permissions.` | The credential is not accepted, or it is not allowed to yank, see the table above. The text is the same for a wrong password. |
| `404`, `gemNotFound`: `Gem not found.` | The repository has no gem with that name. |
| `404`, `gemVersionNotFound`: `Gem version not found.` | The gem has no such version, or none for that platform. |
| `400`, `gemVersionAlreadyYanked`: `Gem version has already been yanked.` | The version is yanked already. |

There is no way to undo a yank. If you yanked the wrong version, delete it in the web UI and push it again, see below.

### What a Yanked Version Looks Like

| Where | What happens |
| --- | --- |
| The index of the repository | `/info/<gem-name>` no longer lists the version, and `/versions` marks it with a leading `-`, as in `1.0.0,1.1.0,-1.2.0`. |
| `gem install my_gem` | Installs the newest version that is not yanked. |
| `gem install my_gem -v <yanked-version>` | Fails with `Could not find a valid gem 'my_gem' (= <version>) in any repository`. |
| `gem list --remote`, `gem search`, `gem fetch` | The version is not listed and cannot be fetched. |
| Bundler, a new resolution | Picks the newest version that is not yanked. A version that you name in the `Gemfile` fails with `Could not find gem 'my_gem (= <version>)' ...` and the list of the versions that the source has. |
| Bundler, a `Gemfile.lock` that names the version | Stops with `Your bundle is locked to ... but that version can no longer be found in that source`, unless the gem is installed already. `bundle update my_gem` moves the lock to a version that exists, see [Using Repsy with Bundler](../using-repsy-with-bundler/#lock-files-and-updates). |
| The `.gem` file, at `{{% repo-url %}}/<repo-name>/gems/my_gem-1.0.0.gem` | Still served, to everybody who may read the repository. |
| A push of the same version | Refused with `409`, `gemVersionAlreadyExists`, also when **Package Override** of the repository is on **Allow**. |
| The web UI | The version stays in the list of the versions of the gem with a red **yanked** badge, and its page shows **(yanked)** next to the version number. |
| The **Latest** version of the gem | If the yanked version was the latest, the gem shows the newest version that is not yanked instead. |

### Delete a Version in the Web UI

Deleting removes the version and its `.gem` file for good, and it is the only way to free a version number that was yanked. It needs the `ADMIN` role.

1. Sign in to the web UI and open the **Repositories** tab. Open your repository.
2. Open the gem, and use the menu (⋮) of the version row, or open the version and click **Delete Version**.
3. Confirm the dialog.

After a delete, the version is no longer in the index, its `.gem` file answers `404`, and the disk usage of the repository drops by its size. You can push the version number again, also when **Package Override** is on **Deny**. Delete a whole gem with the menu (⋮) of its row in the list of gems.

When the gem has at most one version that is not yanked, deleting any version of it deletes the whole gem, all its versions included, so look at the versions of the gem before you delete a yanked one.

Clients that have installed the version, or have it in their Bundler cache, keep it: a delete does not reach into their machines.
