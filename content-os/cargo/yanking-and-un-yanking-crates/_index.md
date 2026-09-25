+++
title = "Yanking and Un-yanking Crates"
weight = 770
description = "Yank and un-yank crate versions with Cargo, see what a yank changes for clients and when to delete a version instead."
+++

A published version can never be replaced, see [Publishing and Using Crates with Cargo](../publishing-and-using-crates-with-cargo/#publishing-a-version-twice). When a version turns out to be a mistake, you have two tools: **yanking**, which keeps the version but stops new projects from choosing it, and **deleting**, which removes it. This page shows how to yank and un-yank a version with `cargo` and what each of them does.

### Prerequisites

- A crate that you published to your Repsy Open Source Cargo repository, and `cargo` set up for the registry, see [Publishing and Using Crates with Cargo](../publishing-and-using-crates-with-cargo/). The examples call the registry `repsy` and the crate `hello_repsy`.
- A **Read/Write** [deploy token](../creating-a-private-cargo-registry/#get-your-token) of the repository. A **Read Only** token can not yank: Repsy refuses it with `401`.

### Yank a Version

Name the registry, the version and the crate:

```bash
cargo yank --registry repsy --version 0.1.0 hello_repsy
```

```text
    Updating `repsy` index
        Yank hello_repsy@0.1.0
```

`--version` is required. If the version does not exist in the repository, `cargo` reports the answer of Repsy, `crateVersionNotFound` with status `400 Bad Request`.

### What a Yank Changes

A yank changes one flag of the version in the index of the registry, `yanked`, from `false` to `true`. Nothing is removed:

- **New resolution skips the version.** When Cargo has to choose a version for a requirement, for example in `cargo update` or in a build of a project that has no `Cargo.lock` yet, it does not choose a yanked version. If another version satisfies the requirement, Cargo takes that one. If the yanked version was the only match, Cargo stops:

  ```text
  error: failed to select a version for the requirement `hello_repsy = "^0.1"`
    version 0.1.0 is yanked
  location searched: `repsy` index
  ```

- **Existing projects keep building.** A project whose `Cargo.lock` already names the yanked version keeps using it, and Repsy still serves the file, so its builds and its CI keep working, also with an empty Cargo cache. This is the point of a yank: it does not break anybody who depends on the version already.
- **The version stays in the repository.** It is still listed in the web UI, marked **yanked** in the list of versions and **(yanked)** next to the version on its page. Its file stays on disk.
- **Nobody can publish that version again.** The number stays taken, as for any published version.

A yank does not tell the people who use the version. If the reason is a defect or a vulnerability, publish a fixed version, so that `cargo update` has something to move to, and say so in your release notes.

### Un-yank a Version

Add `--undo` to bring the version back:

```bash
cargo yank --undo --registry repsy --version 0.1.0 hello_repsy
```

```text
    Updating `repsy` index
      Unyank hello_repsy@0.1.0
```

The `yanked` flag goes back to `false`. New resolution can choose the version again, and the mark disappears from the web UI. You can yank and un-yank the same version as often as you need.

### Yank or Delete

| | Yank | Delete |
| --- | --- | --- |
| Who | Anyone with a **Read/Write** deploy token of the repository, with `cargo yank` | An administrator, in the web UI |
| New projects | Do not choose the version | Cannot find the version |
| Projects that locked the version | Keep building | Fail to download the file, unless they have it in their Cargo cache |
| The file | Stays | Is removed |
| Reversible | Yes, with `--undo` | No |

Yank first. Deleting a version removes it for everyone, including the projects that depend on it, and the number becomes free to publish again. Do not publish different content under a number that projects already locked: their `Cargo.lock` remembers the checksum of the old file. Delete a version only when it must not be available at all, for example because it contains a secret. Then also rotate the secret.
