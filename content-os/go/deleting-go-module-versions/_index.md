+++
title = "Deleting Go Module Versions"
weight = 890
description = "Delete Go module versions or whole modules in the web UI, see who may delete and what the go command sees afterwards."
+++

A version of a Go module cannot be overwritten, so deleting it is the only way to take it out of a Go repository. This page explains what deleting a version or a module does in the web UI, and what the `go` command sees afterwards.

### Who Can Delete

Deleting needs the `ADMIN` role. Users with the `USER` role do not see the delete buttons. A deploy token cannot delete: Repsy has no delete request for the `go` command or for `curl`, and only the web UI deletes Go modules.

### Deleting a Version or a Module

Open the **Repositories** tab and open your Go repository. Every row is a module.

| You delete | Where | What happens |
| --- | --- | --- |
| A version | The menu (⋮) of a version on the versions page of a module, or **Delete Version** on the page of a version | The version, with its zip, its `go.mod` and its `.info` file, is removed. The other versions of the module stay. |
| The last version of a module | The same buttons | The version is removed, and the module goes with it. It disappears from the module list, and you land on the module list. |
| A module | The menu (⋮) of a module in the module list | The module is removed with all its versions. |

The web UI asks for a confirmation before it deletes anything. The size of the deleted files is given back to the usage of the repository.

Deleting the module `example.com/hello` does not touch `example.com/hello/v2`. It is a module of its own, with its own row.

The files are moved into the `trash` directory of the Go files, and Repsy removes them for good after `TRASH_RETENTION`, seven days by default. The trash is not an undelete function: the database records are gone, and there is no way to bring a deleted version back. Treat a deletion as permanent, and see [Managing Storage and Cleanup](../../administration/managing-storage-and-cleanup/#the-trash) for how the trash works.

### What the go Command Sees Afterwards

The answers of the repository change at once:

| Request | After the delete |
| --- | --- |
| `.../@v/<version>.info`, `.mod` and `.zip` of the deleted version | `404`. |
| `.../@v/list` | The version is no longer in the list. When it was the last version, the answer is `200` with an empty body, the same as for a module that never existed. |
| `.../@latest` | The highest version that is left. `404` when the module has no version left. |

What this means for the projects that use the module:

- A project that needs the deleted version can no longer download it from the repository. On a machine that has it in its module cache, `go` still finds it there. On any other machine, for example a new CI runner, `go build` fails with `module lookup disabled by GOPROXY=off`, or, when `GOPROXY` ends with `,direct`, `go` looks for the source of the module. Tell the users of the module before you delete a version they depend on.
- A version that was deleted and uploaded again with other content is refused by every project that has recorded the old one: the `go` command reports `SECURITY ERROR` and `This download does NOT match an earlier download recorded in go.sum`. Repsy allows the upload, since the version is gone, but Repsy has no checksum database that could vouch for the change. Publish a fixed module as a new version, and delete the wrong one if it must not be used.
- The other versions keep working, and `@latest` moves to the next highest version.

A publish of a module and the deletion of its last version can meet: an upload that loses this race is refused with `409` and the identifier `goModuleBusy`. Upload again, and the module is created anew.

### Deleting a Repository

Deleting the whole repository (the menu (⋮) of the repository in the **Repositories** tab) removes all its modules at once. See [Navigating the Web UI](../../getting-started/navigating-the-web-ui/).
