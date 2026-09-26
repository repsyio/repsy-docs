+++
title = "Recovering a Lost Password"
weight = 165
description = "Recover a lost password by having another administrator reset it, or with a marker file when nobody can sign in."
+++

# Recovering a Lost Password

Repsy Open Source has no "forgot password" link and sends no e-mail, so a lost password is recovered by an
administrator or by the operator of the instance. There are three ways. Pick the first one that applies to you:

| Method | Works for | You need |
| --- | --- | --- |
| [Another administrator resets it](#another-administrator-resets-it) | Any user | Another `ADMIN` account that you can sign in with. |
| [A marker file](#a-marker-file) | Any user, also the only administrator | A shell in the container, or access to the data volume. |
| [An empty password hash](#an-empty-password-hash) | Administrators only | Access to the database. |

In every case Repsy generates a **new random password** and writes it to its log. You cannot choose it. Sign in with it
and change it on the **Profile** page straight away: the log may be collected somewhere else.

## Another administrator resets it

If you still have an administrator account, open **Users**, click **Reset password** in the row of the user, and confirm.
Repsy shows the new password once. See [Managing Users](../managing-users/#reset-a-users-password).

## A marker file

Repsy watches a directory for files whose name is a username. When one appears, Repsy deletes the file, generates a new
password for that user, ends the user's web UI sessions and the sessions the user's package manager holds, and logs the
password. It needs no database access and works for
any user, also when the only administrator is locked out.

In the Docker image the directory is `/app/data/password-reset`, on the persisted volume.

### While Repsy is running

Create an empty file named after the user inside the container and read the new password from the log:

```bash
docker exec repsy touch /app/data/password-reset/admin
docker logs repsy 2>&1 | grep "New password"
```

Within a few seconds the log has a line like this one:

```text
Password of user admin has been reset by the marker file /app/data/password-reset/admin. New password: <password>
```

Repsy looks into the directory every five seconds. If the log contains several such lines for the same user, use the
last one.

### While Repsy is stopped

The directory is also read once when Repsy starts, so you can prepare the marker while the container is stopped. This is
the way to go when you have no shell in the running container. Create the marker with the Repsy image itself, so that
the file and the directory belong to the user Repsy runs as:

```bash
docker stop repsy
docker run --rm -v repsy-data:/app/data --entrypoint sh repo.repsy.io/repsy/os/repsy:latest \
  -c 'mkdir -p /app/data/password-reset && touch /app/data/password-reset/admin'
docker start repsy
docker logs repsy 2>&1 | grep "New password"
```

Do not create the directory with a root shell such as an `alpine` container. Repsy runs as `appuser` and cannot remove
files from a directory that root created. It then logs `Could not apply the password reset marker` and leaves the file
in place.

### Rules of the marker directory

- The file name must be a valid username: 3 to 25 lowercase letters, digits, `_` or `-`. The content of the file is never
  read. A file with any other name is deleted and a warning is logged.
- A marker for a user that does not exist is deleted with the warning `there is no user <name>`.
- Symbolic links and directories are ignored.
- The directory is set with `PASSWORD_RESET_MARKER_DIR`. The image sets it to `/app/data/password-reset`, whatever
  `STORAGE_BASE_PATH` is. Outside the image the default is `<STORAGE_BASE_PATH>/password-reset`.
- `PASSWORD_RESET_MARKER_POLL_INTERVAL` sets how often a running instance looks into the directory. The default is
  `PT5S` (five seconds) and the minimum is `PT1S`.

### If the marker does nothing

- Check that `PASSWORD_RESET_MARKER_ENABLED` is not `false`.
- Check that Repsy can write to the directory. If `/app/data` is a bind mount owned by another user, Repsy logs
  `Could not create the password reset marker directory` at start, and a marker it cannot delete is logged once as
  `Could not apply the password reset marker`. See [Troubleshooting](../troubleshooting/#permission-denied-on-the-data-volume).
- The user name must exist exactly as written, in lowercase. An account from an earlier release whose name breaks the
  username rules cannot be reset with a marker: use another administrator, or the empty hash below if it is an
  administrator.

{{% notice warning %}}
Anyone who can write into the marker directory can lock users out, because the new password only appears in the log.
This is why the directory is separate from the package storage and needs write access to the data volume. If you do not
want the feature, set `PASSWORD_RESET_MARKER_ENABLED=false`.
{{% /notice %}}

## An empty password hash

Administrators can also be recovered through the database. Setting the password hash of an administrator to an empty
string tells Repsy to generate a new password for that administrator the next time it starts. This works for
`ADMIN` accounts only. Empty hashes of other users are not reset by it.

The `hash` column cannot be `NULL`, so use an empty string.

### PostgreSQL

Connect to the database, empty the hash, and restart Repsy:

```bash
docker exec -it repsy-postgres psql -U repsy -d repsy
```

```sql
-- One administrator
UPDATE users SET hash = '' WHERE role = 'ADMIN' AND username = 'admin';

-- Or every administrator
UPDATE users SET hash = '' WHERE role = 'ADMIN';
```

```bash
docker restart repsy
docker logs repsy 2>&1 | grep "Admin password"
```

### Embedded H2

The H2 database file can only be opened by one process, so stop Repsy first and run the H2 shell once against the file,
with the image itself:

```bash
docker stop repsy

docker run --rm -v repsy-data:/app/data --entrypoint java repo.repsy.io/repsy/os/repsy:latest \
  -Dloader.main=org.h2.tools.Shell -cp /app/app.jar \
  org.springframework.boot.loader.launch.PropertiesLauncher \
  -url "jdbc:h2:file:/app/data/repsy;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE" \
  -user repsy -password repsy123 \
  -sql "UPDATE users SET hash = '' WHERE role = 'ADMIN'"

docker start repsy
docker logs repsy 2>&1 | grep "Admin password"
```

- Keep `MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE` in the URL, even if your `DB_URL` looks different. The tables have
  lowercase names, and without `DATABASE_TO_LOWER=TRUE` the statement fails with `Table "USERS" not found`.
- Use the `DB_USERNAME` and `DB_PASSWORD` that Repsy uses. The defaults are `repsy` and `repsy123`.
- To reset a single administrator, append `AND username = 'admin'` to the statement.

In both cases Repsy logs one line for each administrator it reset:

```text
Admin password has been reset for user admin. New password: <password>
```
