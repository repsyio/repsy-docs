+++
title = "Troubleshooting"
weight = 170
+++

# Troubleshooting

This page lists common problems with a Repsy Open Source instance, with the cause and the fix of each. Start with the log:
most startup problems name their reason there.

## Look at the logs

```bash
docker logs repsy 2>&1 | tail -n 100
docker logs -f repsy
```

- Repsy logs at `WARN` level by default, so the log is short. A successful start ends with the line
  `repsy started successfully!`, which is logged at `WARN` on purpose.
- To see what the background jobs do, start Repsy with `LOGGING_LEVEL_IO_REPSY=INFO`. Use `DEBUG` for more.
- A warning that the H2 version is newer than the one Flyway has been verified with is informational. It appears at every
  start with the embedded database.
- For PostgreSQL, the database has its own log: `docker logs repsy-postgres`.

## Is Repsy up?

Repsy has no dedicated health endpoint. The web UI answers `200` on port `8080` once the application is running, so use
that as the health check:

```bash
curl -fsS -o /dev/null http://localhost:8080/ && echo up
```

In a Docker health check, use `wget`, which the image contains:

```bash
docker run -d --name repsy ... \
  --health-cmd "wget -q -O /dev/null http://localhost:8080/" \
  --health-interval 10s --health-start-period 30s \
  repo.repsy.io/repsy/os/repsy:latest
```

## Repsy does not start

The container exits right away, or `docker ps` does not list it. Read the end of `docker logs repsy`.

### Port already in use

**Symptom:** `docker run` fails with `Bind for 0.0.0.0:8080 failed: port is already allocated`, or with a similar message
for `9090`, `8443` or `9443`.

**Cause:** another program or container already uses the port on the host.

**Fix:** stop the other program, or publish Repsy on another host port, for example `-p 8081:8080`. The ports inside the
container do not change: `8080` is the web UI, `9090` the package protocols, `8443` and `9443` their HTTPS versions.
To find what uses a port, run `sudo lsof -i :8080`.

### Permission denied on the data volume

**Symptom:** the log contains `Log file error: "/app/data/repsy.trace.db", cause: "java.nio.file.AccessDeniedException:
/app/data/repsy.trace.db"`, or another `Permission denied` for a file under `/app/data`.

**Cause:** Repsy runs as the non-root user `appuser` (user id `100`, group id `101` in the image). A directory of the host
that you mount on `/app/data` is owned by another user, so Repsy cannot write to it. The same applies to the storage
directory.

**Fix:** give the directory to that user, or use a named volume:

```bash
sudo chown -R 100:101 /srv/repsy/data
```

### The database is not reachable

**Symptom:** the log ends with `Failed to obtain JDBC Connection`, followed by a cause.

- `java.net.UnknownHostException: <host>`: the host in `DB_URL` does not resolve from the Repsy container. Put both
  containers in the same Docker network and use the container name as the host.
- `Connection to <host>:<port> refused`: the database is not running yet, or the port is wrong. Start the database first.
- `FATAL: password authentication failed for user "repsy"`: `DB_USERNAME` or `DB_PASSWORD` is wrong.

Set the full address in `DB_URL`, for example `jdbc:postgresql://repsy-postgres:5432/repsy`. `DB_HOST`, `DB_PORT` and
`DB_DATABASE` are not read. Without `DB_URL`, the image starts an embedded H2 database, which is not the PostgreSQL you
meant.

### Invalid `ADMIN_INITIAL_PASSWORD`

**Symptom:** the log contains `initial-password does not meet complexity requirements: at least one uppercase letter, one
lowercase letter, one digit, and no whitespace`.

**Fix:** use a password with at least one uppercase letter, one lowercase letter and one digit, and no whitespace. Leave
the variable unset to let Repsy generate a password and log it.

### Invalid `TRASH_RETENTION`

**Symptom:** the log contains `os.app.storage.file-system.trash-retention (TRASH_RETENTION) must be at least P1D`.

**Fix:** use an ISO-8601 duration of at least one day, such as `P7D`.

### The HTTPS keystore cannot be read

**Symptom:** the log contains `Failed to start component [Connector["https-jsse-nio-8443"]]`, followed by a cause such as
`FileNotFoundException`, `Permission denied`, `keystore password was incorrect` or `Alias name [repsy] does not identify a
key entry`.

**Fix:** see [Enabling HTTPS](../enabling-https/). The file must exist inside the container, be readable by `appuser`,
and match the password and the alias.

## Signing in

### I cannot sign in as `admin`

- **You never saw the password.** If you did not set `ADMIN_INITIAL_PASSWORD`, Repsy generated a password at the first
  start: `docker logs repsy 2>&1 | grep "temporarily generated password"`.
- **You changed `ADMIN_INITIAL_PASSWORD` later.** It is only used when the instance has no administrator yet. It does
  not change the password of an existing account.
- **You upgraded from a 26.08 release.** The upgrade resets every password. See
  [Upgrading Repsy Open Source](../upgrading-repsy-open-source/#every-password-is-reset).
- **You forgot the password.** See [Recovering a Lost Password](../recovering-a-lost-password/).

### `429 Too Many Requests` and "Too many failed authentication attempts"

**Cause:** the client made too many failed password checks in a minute (20 by default), or a proxy makes all clients look
like one. A stale token in a CI job is a common reason.

**Fix:** correct the credentials, wait for the number of seconds in the `Retry-After` header, and see
[Authenticating from CI](../authenticating-from-ci/#common-causes-of-a-429).

### Everyone is signed out after a restart

**Cause:** `OS_APP_JWT_SECRET` is not set, so Repsy makes a new signing secret at every start and old sessions become
invalid.

**Fix:** set `OS_APP_JWT_SECRET` to a fixed random value. See
[Persisting Data and Backups](../persisting-data-and-backups/#sessions-and-os_app_jwt_secret).

### A user with capital letters in the name cannot be edited or reset with a marker

**Cause:** new usernames must be lowercase. An account from an earlier release can still have another name and keeps
working, but the edit dialog and the password reset marker file only accept names that follow the rules.

**Fix:** give the account a compliant name when you edit it, and use **Reset password** in the web UI instead of a
marker. See [Managing Users](../managing-users/#rules-for-usernames-and-passwords).

## Addresses, proxies and HTTPS

### The web UI shows `http://localhost:9090` in its snippets

**Cause:** `REPO_BASE_URL` is not set, or it was set after the container had started.

**Fix:** set `REPO_BASE_URL` to the public address of the package port and recreate the container. See
[Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#tell-repsy-its-public-addresses).

### `docker login` or `docker push` fails behind a proxy

**Cause:** Docker follows addresses that Repsy builds from the request. Without the forwarded headers, they point to
`http://` or to an internal host name.

**Fix:** make the proxy send `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Port` and `X-Forwarded-For`, and check
`curl -i https://repo.example.com/v2/`: the `Bearer realm` must name your public address. See
[Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#check-the-setup).

### `http: server gave HTTP response to HTTPS client`

**Cause:** Docker (or Helm) expects HTTPS and Repsy answers plain HTTP. Docker only allows plain HTTP for `localhost`.

**Fix:** enable HTTPS, or put a TLS proxy in front, see [Enabling HTTPS](../enabling-https/). For a test, add the
registry to `insecure-registries`, see [Docker over plain HTTP](../enabling-https/#docker-over-plain-http).

### `x509: certificate signed by unknown authority`

**Cause:** the client does not trust the certificate, because it is self-signed or from a private CA.

**Fix:** make the client trust it, see [Making clients trust your certificate](../enabling-https/#making-clients-trust-your-certificate).

### `refusing to pass credentials to insecure URL` (Go)

**Cause:** `go` never sends credentials over `http://`.

**Fix:** serve the repository over HTTPS, see [Enabling HTTPS](../enabling-https/).

### The HTTPS port answers `404` for everything except the web page

**Cause:** `API_SSL_PORT` or `REPO_SSL_PORT` was changed from its default. Only `8443` and `9443` are wired to the routes.

**Fix:** keep the defaults and publish them on another host port with `-p`.

### A browser shows `404` and JSON when I open port 9090

This is expected. Port `9090` is for package clients, and it answers `404` with `{"msgId":"unknownPath",...}` for a path it
does not serve, such as `/`. The web UI is on port `8080`.

### The browser reports `Invalid CORS request` or a CSP violation

See [Security Headers and CORS](../security-headers-and-cors/).

## Data and storage

### My packages disappeared after I recreated the container

**Cause:** the package files were not in a volume. Without `STORAGE_BASE_PATH`, Repsy stores them in
`/home/appuser/.repsy`, which is part of the container and is deleted with it. A volume created without a name is also
new for every container.

**Fix:** always start Repsy with `-e STORAGE_BASE_PATH=/app/data/storage` and a named volume such as
`-v repsy-data:/app/data`. If the old container still exists, copy its files out before you remove it, see
[Moving artifacts to the volume](../persisting-data-and-backups/#moving-artifacts-to-the-volume). Otherwise restore a
backup.

Check what a volume holds with `docker run --rm -v repsy-data:/data alpine ls -la /data`, and list your volumes with
`docker volume ls`.

### A fresh instance appeared after an upgrade

**Cause:** the new container did not get the old volume, or, for PostgreSQL, it has no `DB_URL` and started an embedded
H2 database. See [Upgrading Repsy Open Source](../upgrading-repsy-open-source/#set-db_url-if-you-use-postgresql).

**Fix:** stop it, start it again with the volume and `DB_URL` of the old container. The old data is still there.

### The disk stays full after I deleted packages

**Cause:** deleted files stay in the `trash` folder for `TRASH_RETENTION` (seven days by default).

**Fix:** wait, or lower the retention, or empty the trash yourself. See
[Managing Storage and Cleanup](../managing-storage-and-cleanup/#the-trash).

### Uploads fail with `413`

**Cause:** a size limit. If the answer is a JSON body with "The uploaded content is too large.", the limit is Repsy's.
Otherwise it comes from your reverse proxy: nginx refuses request bodies over 1 MB unless `client_max_body_size` is raised.

**Fix:** raise the limit. See [Managing Storage and Cleanup](../managing-storage-and-cleanup/#upload-size-limits) and
[Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#large-uploads).

### Uploads fail because the disk is full

**Fix:** free space. A failed write leaves the previous content of a file unchanged, so you can repeat the upload after
you freed space. Remember that uploads also need temporary space in `/tmp` of the container, see
[Managing Storage and Cleanup](../managing-storage-and-cleanup/#disk-space).

### The password reset marker does nothing

See [Recovering a Lost Password](../recovering-a-lost-password/#if-the-marker-does-nothing).
