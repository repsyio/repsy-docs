+++
title = "Managing Storage and Cleanup"
weight = 168
description = "Learn the layout of the storage directory, how the trash and cleanup jobs work, and how to plan disk space and upload size limits."
+++

# Managing Storage and Cleanup

Repsy Open Source stores package files on the local file system, in the directory you set with `STORAGE_BASE_PATH`. This
page describes how that directory is laid out, what happens to a file when you delete something, which background jobs
clean up, and how to plan disk space. For backups, see [Persisting Data and Backups](../persisting-data-and-backups/).

The examples assume `STORAGE_BASE_PATH=/app/data/storage`, the value used everywhere in this documentation.

## The storage layout

Each package format has its own directory inside the storage directory. Below it, every repository has a folder named
after the repository's internal id (a UUID), not after its name, so a repository keeps its folder when you rename it:

```text
/app/data/storage
├── maven/
│   ├── 01a0d860-a8d5-7e69-961f-212c40565d93/   files of one Maven repository
│   └── trash/                                  deleted Maven files, see below
├── npm/
├── pypi/
├── docker/
├── cargo/
├── golang/
├── helm/
├── nuget/
└── ruby/
```

To find out which folder belongs to which repository, ask the database:

```sql
SELECT id, name, type FROM repo;
```

Inside a repository folder, the files are arranged by format:

| Directory | Contents of a repository folder |
| --- | --- |
| `maven` | The Maven layout: the group id as a path, then the artifact, then the version, with the files of the version. |
| `npm` | One folder per package with its metadata file and the tarballs of its versions. |
| `pypi` | One folder per normalised package name with the distribution files and their checksum files. |
| `docker` | `blobs/` with layers named by their digest, for example `sha256:...`, and `manifests/` with manifests named by their digest. A layer that is still being uploaded is a file named after an upload id. |
| `cargo` | `crates/<name>/<name>-<version>.crate` and the files of the sparse index. |
| `golang` | One folder per module path, with the `.zip` files of its versions under `@v/`. Capital letters in a module path are written as `!` and the lowercase letter, as the Go proxy protocol does. |
| `helm` | `charts/` for charts pushed the classic way, and `oci/blobs/` and `oci/manifests/` for charts pushed as OCI artifacts. |
| `nuget` | `packages/<id>/<version>/` with the `.nupkg` and `.nuspec` files. |
| `ruby` | `gems/<name>/` with the `.gem` files. |

The layout is an internal detail. Read it, back it up, and measure it, but do not add, edit or move files inside it: the
database knows which files it expects, and it may change between releases. While Repsy writes a file, it first writes a
hidden temporary file named `.repsy-write-<id>.tmp` next to the target and then moves it into place, so a download never
sees a half-written file. The trash job (see below) removes such files if a crash left them behind and they are a day old.

To see how much space each format uses, or how much the trash holds:

```bash
docker exec repsy sh -c 'du -sh /app/data/storage/*'
docker exec repsy sh -c 'du -sh /app/data/storage/*/trash'
```

The **Repository Storage** section in the settings of a repository in the web UI shows the disk space of that
repository.

## The trash

Deleting something in Repsy does not delete its files at once. Repsy removes the database records and **moves** the files
into a `trash` directory inside the directory of their format:

```text
/app/data/storage/<format>/trash/<date>/<timestamp>/<original path>
```

For example, deleting a Maven version puts its files under
`maven/trash/2026-10-01/2026-10-01T09:30:12.263957118Z/<repository id>/com/example/demo/1.0/`. What goes to the trash:

| You delete | At file level |
| --- | --- |
| A version of a package | The files of that version are moved into the trash. |
| A package | The files of the package are moved into the trash. |
| A repository | The whole folder of the repository is moved into the trash. |
| Docker layers and manifests, with **Delete Orphan Layers** or **Delete Untagged Manifests** in the repository settings | The files that no manifest or tag uses are moved into the trash. |

{{% notice warning %}}
The trash is not an undelete function. Repsy has no way to bring a deleted item back, because the database records are
gone, and moving the files back by hand does not recreate them. To get back something that was deleted by mistake,
restore a backup. Treat a deletion as permanent.
{{% /notice %}}

Repsy keeps the files for a while, so an operator can still copy them out. It also means that **deleted files keep using
disk space until the trash is emptied**.

### Emptying the trash

A background job empties the trash. It deletes the date directories that are older than the retention period:

| Variable | Default | Meaning |
| --- | --- | --- |
| `TRASH_CLEANUP_ENABLED` | `true` | Runs the job. Set `false` to keep the trash forever. |
| `TRASH_RETENTION` | `P7D` | How long deleted items stay in the trash: an ISO-8601 duration, at least `P1D`. |
| `TRASH_CLEANUP_INTERVAL` | `PT24H` | How often the job runs. |
| `TRASH_CLEANUP_INITIAL_DELAY` | `PT15M` | How long after start the first run happens. |

- The default retention is seven days. Raise it to keep deleted files for longer, for example `TRASH_RETENTION=P30D`.
- A value below `P1D` is refused and Repsy does not start, because the trash is grouped by day.
- The trash is kept in one directory per day, so the job works in whole days: it removes a day once that whole day is
  older than the retention period.
- **The first run after an upgrade deletes the whole backlog.** Releases before the one this documentation describes
  moved deleted files into the trash but never emptied it. If you upgrade such an instance, the first run of the job
  (15 minutes after start) permanently removes everything that is older than `TRASH_RETENTION`. Copy the trash away first,
  or set `TRASH_CLEANUP_ENABLED=false` for the upgrade, if you want to keep it. See
  [Upgrading Repsy Open Source](../upgrading-repsy-open-source/).

By default Repsy logs at `WARN` level, so you do not see the job report. To see it, run Repsy with
`LOGGING_LEVEL_IO_REPSY=INFO`. Each format then reports a line such as
`cleared MAVEN storage trash: 3 directories, 1 files, 3 bytes freed`.

## Other cleanup jobs

Repsy never deletes a package or a version by itself. The only things it removes on its own are the following.

| Job | What it removes | Variables |
| --- | --- | --- |
| Trash | Files deleted by users, after the retention period. See above. | `TRASH_CLEANUP_ENABLED`, `TRASH_RETENTION`, `TRASH_CLEANUP_INTERVAL`, `TRASH_CLEANUP_INITIAL_DELAY` |
| Abandoned uploads | Docker layer and Helm OCI uploads that were started and never finished, and layer files that nothing references any more, for example after an aborted push. | `ABANDONED_UPLOAD_CLEANUP_ENABLED` (`true`), `ABANDONED_UPLOAD_TTL` (`PT24H`), `ABANDONED_UPLOAD_CLEANUP_INTERVAL` (`PT1H`), `ABANDONED_UPLOAD_CLEANUP_INITIAL_DELAY` (`PT10M`) |
| Held Maven signatures | Signatures that arrived for a file that never came. | `PENDING_SIGNATURE_PURGE_ENABLED` (`true`), `PENDING_SIGNATURE_TTL` (`PT24H`), `PENDING_SIGNATURE_PURGE_INTERVAL` (`PT15M`) |
| Docker manifest layout repair | Not a removal: it renames the manifest files of an earlier release once, after an upgrade. | `DOCKER_MANIFEST_LAYOUT_REPAIR_ENABLED` (`true`), `DOCKER_MANIFEST_LAYOUT_REPAIR_INITIAL_DELAY` (`PT10M`), `DOCKER_MANIFEST_LAYOUT_REPAIR_INTERVAL` (`PT24H`) |

All durations are ISO-8601 durations: `PT15M` is fifteen minutes, `PT24H` is twenty-four hours and `P7D` is seven days.

- **Abandoned uploads.** An upload counts as abandoned when its file has not been written to for the TTL, so an upload
  that is still receiving data is left alone. The files are moved to the trash like any other deletion, and the space is
  released from the usage of the repository.
- **Held Maven signatures.** A Maven repository that verifies every signature accepts a signature file before the file it
  signs, because Maven uploads in parallel. Repsy holds the signature, unverified and not served, until the file arrives.
  Held signatures are kept in the database, not on disk, and the job deletes those older than the TTL.
- **Docker manifest layout repair.** Ten minutes after the first start following an upgrade from a 26.08 release, a
  background job renames the stored Docker manifests. It is safe to leave alone: until a manifest has been renamed, Repsy serves it from its old name. See
  [Upgrading Repsy Open Source](../upgrading-repsy-open-source/).

## Upload size limits

Some protocols have a size limit for a single upload. A larger upload is refused with `413` and the message "The uploaded
content is too large." Each limit is a variable that accepts a size such as `100MB` or `1GB`:

| Variable | Default | Applies to |
| --- | --- | --- |
| `MULTIPART_MAX_FILE_SIZE` | `500MB` | The file of a PyPI upload (`twine upload`), of a classic Helm chart push and of a NuGet push. |
| `MULTIPART_MAX_REQUEST_SIZE` | `500MB` | The whole request of those uploads. Keep it at least as large as `MULTIPART_MAX_FILE_SIZE`. |
| `RUBY_MAX_GEM_SIZE` | `500MB` | A gem pushed with `gem push`. |
| `CARGO_MAX_CRATE_SIZE` | `100MB` | A crate published with `cargo publish`. |
| `GO_MAX_MODULE_ZIP_SIZE` | `500MB` | The module zip that a `go` client publishes. |

Repsy has no size setting for the other formats, such as Maven, npm and Docker layers. A reverse proxy in front of Repsy
can have its own limit, see [Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#large-uploads).

## Disk space

Plan disk space for four things:

- **The storage directory.** It grows with what you publish. The web UI shows the disk usage of each repository. Docker
  layers are stored under their digest.
- **The trash.** Deleted files stay for `TRASH_RETENTION` days. If you delete a lot, for example a whole repository,
  expect the disk usage to stay the same until the retention has passed. Lower the retention (not below one day) if disk
  space is short, or empty it with the job settings above.
- **Temporary space for uploads.** Repsy copies most uploads into a temporary file while it checks them, then stores
  them, so that a package of any size is never held in memory. That file lives in the temporary directory of the Java
  process, which is `/tmp` in the image and so in the writable layer of the container. It has to hold your largest
  upload, and several uploads at once. Give the container enough space there, for example by mounting a volume on `/tmp`.
  Repsy removes these files when the request ends.
- **The database.** It holds metadata only and is small compared with the package files.

If the disk fills up, uploads fail, and a failed write leaves the previous content of a file unchanged: Repsy writes to a
temporary file and moves it into place only when the whole upload has arrived. Free space, and the uploads that failed
can be repeated.

Do not forget the space for backups, which need a full copy of the database and the storage directory.
