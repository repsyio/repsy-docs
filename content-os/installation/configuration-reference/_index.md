+++
title = "Configuration Reference"
weight = 155
description = "Reference of every environment variable that configures Repsy Open Source, with its default and when you would change it."
+++

# Configuration Reference

You configure Repsy Open Source with environment variables. This page lists every setting, with its default and when you
would change it. The list is complete for the settings that the application defines; a few entries are marked as not
verified, and say why.

## How to Set a Variable

| Where you run Repsy | How to set `NAME` to `value` |
| --- | --- |
| `docker run` | `-e NAME=value` |
| Docker Compose | `NAME: value` under `environment:` of the `repsy` service. Put a value that YAML could read as something else, such as `true` or `300`, in quotes. |
| From source | `export NAME=value` before `java -jar app.jar` |

Repsy reads its settings when it starts, so restart it after every change.

Values have these forms:

- **Booleans** are `true` or `false`.
- **Durations** are ISO-8601: `PT30S` is 30 seconds, `PT15M` 15 minutes, `PT24H` 24 hours and `P7D` seven days.
- **Sizes** are a number with a unit, such as `100MB` or `1GB`.

A variable that you do not set keeps the default in the tables below. Where the Docker image differs from a build from
source, the table says so.

## First Start and Sessions

| Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_INITIAL_PASSWORD` | Empty: Repsy generates a random password and logs it once | The password of the first `admin` user. Repsy uses it only when no administrator exists yet, so changing it later has no effect. It must contain an uppercase letter, a lowercase letter and a digit, must not contain whitespace and must not exceed 72 bytes; otherwise Repsy does not start. |
| `OS_APP_JWT_SECRET` | A random value that is created on every start | The secret that signs the sessions of the panel. Set it to a fixed random value, for example the output of `openssl rand -base64 32`, in every installation that people use: without it, every restart signs everybody out. |

The panel signs users in with an access token that is valid for 30 minutes and a refresh token that is valid for 60 minutes
and can be used once. A session ends at the latest 24 hours after the sign-in. These lifetimes are fixed and cannot be
configured. Changing the password or the username of an account invalidates its older refresh tokens.

## Database

| Variable | Default | Description |
| --- | --- | --- |
| `DB_URL` | Image: `jdbc:h2:file:/app/data/repsy;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE`, an embedded H2 database in the data volume. From source: `jdbc:postgresql://localhost:5432/repsy` | The JDBC URL of the database. Set it to `jdbc:postgresql://<host>:5432/<database>` to use PostgreSQL 18. It is the only place for the host, port and database name. Only PostgreSQL and H2 URLs are supported. |
| `DB_USERNAME` | `repsy` | The database user. With PostgreSQL it must be able to create tables in the `public` schema. |
| `DB_PASSWORD` | `repsy123` | The password of the database user. Always set your own. |
| `H2_TCP_SERVER_ENABLED` | `false` | Starts the TCP server of the H2 database. It has an effect with an H2 database only. The server accepts connections from the same container or host only, so it is not a way to reach the database from another machine. |
| `H2_TCP_SERVER_PORT` | `9092` | The port of the H2 TCP server. |

Repsy creates and updates its database tables itself at every start. See
[Installing with Docker and PostgreSQL](../installing-with-docker-and-postgresql/).

## Storage and Trash

Repsy stores package files on the local file system, in one directory per package type below `STORAGE_BASE_PATH`:
`maven`, `docker`, `npm`, `pypi`, `cargo`, `golang`, `helm`, `nuget` and `ruby`. When you delete a repository, a package
or a version, Repsy first moves its files into a `trash` directory inside the directory of that package type, for example
`maven/trash`. A daily job removes the trash that is older than `TRASH_RETENTION`.

| Variable | Default | Description |
| --- | --- | --- |
| `STORAGE_BASE_PATH` | The `.repsy` directory of the home directory of the user who runs Repsy: `/home/appuser/.repsy` in the image | The directory for package files. **In the Docker image, set it to `/app/data/storage` and mount a volume on `/app/data`**: the image does not set it, and the default lies inside the container, where the files are deleted with it. |
| `TRASH_RETENTION` | `P7D` (seven days) | How long deleted items stay in the trash before they are removed for good. The minimum is `P1D`: a shorter value stops Repsy from starting. Raise it to be able to recover deleted items for longer. |
| `TRASH_CLEANUP_ENABLED` | `true` | Runs the job that empties the trash. Set it to `false` to keep the trash for ever. The first run after an upgrade removes all trash that is older than `TRASH_RETENTION` and cannot be undone. |
| `TRASH_CLEANUP_INTERVAL` | `PT24H` | How often the trash is emptied. |
| `TRASH_CLEANUP_INITIAL_DELAY` | `PT15M` | How long after the start the first cleanup runs. |

[Managing Storage and Cleanup](../../administration/managing-storage-and-cleanup/) describes the storage layout and the trash in detail.

## Background Jobs

Repsy runs a few maintenance jobs. The defaults suit most installations.

| Variable | Default | Description |
| --- | --- | --- |
| `ABANDONED_UPLOAD_CLEANUP_ENABLED` | `true` | Deletes the Docker layer uploads and Helm OCI blob uploads that were started and never finished, for example after an aborted `docker push`. |
| `ABANDONED_UPLOAD_TTL` | `PT24H` | How long an upload can go without receiving data before it counts as abandoned. |
| `ABANDONED_UPLOAD_CLEANUP_INTERVAL` | `PT1H` | How often the cleanup runs. |
| `ABANDONED_UPLOAD_CLEANUP_INITIAL_DELAY` | `PT10M` | How long after the start the first cleanup runs. |
| `PENDING_SIGNATURE_PURGE_ENABLED` | `true` | Deletes Maven signatures that were uploaded before the file they sign and never got that file. Only Maven repositories that verify every signature hold such signatures. |
| `PENDING_SIGNATURE_TTL` | `PT24H` | How long such a signature is kept. |
| `PENDING_SIGNATURE_PURGE_INTERVAL` | `PT15M` | How often the expired signatures are deleted. |
| `DOCKER_MANIFEST_LAYOUT_REPAIR_ENABLED` | `true` | After an upgrade from a release that stored Docker manifests under the name of their tag, renames the stored manifest files to their digest and records the `sha512` digest. Until a manifest has been renamed, it is served under its old name, so switching the job off only delays the clean-up. |
| `DOCKER_MANIFEST_LAYOUT_REPAIR_INITIAL_DELAY` | `PT10M` | How long after the start the first repair pass runs. |
| `DOCKER_MANIFEST_LAYOUT_REPAIR_INTERVAL` | `PT24H` | How often the repair pass runs again. |

## Network and Addresses

| Variable | Default | Description |
| --- | --- | --- |
| `API_PORT` | `8080` | The port of the web panel and its REST API inside the container or process. In Docker, you normally keep it and change the published port instead, for example `-p 8081:8080`. |
| `SERVER_PORT` | `9090` | The port of all package protocols. In Docker, you normally keep it and change the published port instead. |
| `REPO_BASE_URL` | `http://localhost:9090` in the panel of the Docker image. Unset for the npm registry, which then derives the address from each request | The public address of the package port, for example `https://repo.example.com`. The panel shows it in its client configuration snippets, and the npm registry uses it in the download links (`dist.tarball`) of packages. Set it whenever users do not reach Repsy as `localhost:9090`, and always behind a reverse proxy. The Docker start script copies it into the panel, so set it as an environment variable of the container. From source, also edit `static/assets/static-env.js`. |
| `API_BASE_URL` | Empty: the panel calls the API on its own address | The address that the panel uses to reach the REST API. Set it only when the panel and the API are reached under different addresses. Only the Docker start script reads it, and writes it into the panel; from source, edit `static/assets/static-env.js`. |
| `SERVER_COMPRESSION_ENABLED` | `true` | Compresses JSON responses of 1 KB or more on the package port, which makes the metadata of npm packages with many versions much smaller. Set it to `false` when a reverse proxy in front of Repsy already compresses. |
| `SERVER_TOMCAT_REMOTEIP_INTERNAL_PROXIES` | Every private and loopback address | The addresses of the reverse proxies that Repsy trusts when they send the `X-Forwarded-For` header. This is a setting of the underlying Spring Boot server. It is not defined in Repsy's own configuration file and is described in the README of the project; it has not been checked here. |

Repsy reads the `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Port` and `X-Forwarded-For` headers of a reverse
proxy. See [Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/) for a reverse proxy setup.

## HTTPS

Repsy can serve the panel and the package protocols over HTTPS **in addition to** HTTP: the HTTP ports stay open. Each
of the two ports has its own set of variables, one starting with `API_SSL_` for the panel and one starting with
`REPO_SSL_` for the package protocols. The Docker image already contains an empty directory `/app/certs` for keystores.

| Variables (panel / package protocols) | Default | Description |
| --- | --- | --- |
| `API_SSL_ENABLED` / `REPO_SSL_ENABLED` | `false` | Turns HTTPS on for that port. When it is `true` and no keystore path is set, Repsy does not start. |
| `API_SSL_PORT` / `REPO_SSL_PORT` | `8443` / `9443` | The HTTPS port. The image exposes `8443` and `9443`, and Repsy routes these two ports to the panel and to the package protocols. Keep the defaults: other values have not been verified. |
| `API_SSL_KEY_STORE_PATH` / `REPO_SSL_KEY_STORE_PATH` | Empty | The path of the keystore file inside the container, for example `file:/app/certs/api.p12`. When you write the path with the `file:` prefix, Repsy stops with an error if the file does not exist. The user who runs Repsy, `appuser` in the image, must be able to read it. |
| `API_SSL_KEY_STORE_PASSWORD` / `REPO_SSL_KEY_STORE_PASSWORD` | Empty | The password of the keystore. |
| `API_SSL_KEY_STORE_TYPE` / `REPO_SSL_KEY_STORE_TYPE` | `PKCS12` | The format of the keystore. |
| `API_SSL_KEY_ALIAS` / `REPO_SSL_KEY_ALIAS` | `repsy` | The alias of the certificate entry in the keystore. |
| `API_SSL_KEY_PASSWORD` / `REPO_SSL_KEY_PASSWORD` | Empty | The password of the private key inside the keystore. Set it only when it differs from the keystore password. |

[Enabling HTTPS](../../administration/enabling-https/) shows how to create and use a certificate.

## Cross-Origin Requests and Content Security Policy

| Variable | Default | Description |
| --- | --- | --- |
| `APP_ALLOWED_ORIGINS` | Empty: every origin is allowed | A comma-separated list of exact origins, for example `https://panel.example.com`, from which a browser may call the panel API across origins with credentials. Set it once the panel is reached from a fixed set of addresses. It also adds these origins to the `connect-src` directive of the built-in Content Security Policy. |
| `APP_CSP_ENABLED` | `true` | Sends a `Content-Security-Policy` header with the panel and its files. The API responses (`/api/...`) and the package port do not carry it. Set it to `false` if a reverse proxy in front of Repsy sends its own. |
| `APP_CSP_REPORT_ONLY` | `false` | Sends the header `Content-Security-Policy-Report-Only` instead: a browser reports violations but blocks nothing. Useful while you test a changed policy. |
| `APP_CSP_POLICY` | Empty: the built-in policy | Replaces the built-in policy completely with the value you give. |

The built-in policy allows the files of the panel itself, and also the third-party hosts that the panel's start page
loads scripts, styles and fonts from: `https://www.googletagmanager.com`, `https://www.google-analytics.com` and
`https://cdnjs.cloudflare.com`. A policy that you set in `APP_CSP_POLICY` must allow everything the panel needs, so
start from the built-in policy when you write one. The other directives of the built-in policy are `default-src 'self'`,
`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` and `form-action 'self'`.

[Security Headers and CORS](../../administration/security-headers-and-cors/) explains both settings.

## Authentication

Repsy limits and caches the password checks of package clients and of the panel's sign-in.
See [Authenticating from CI](../../administration/authenticating-from-ci/) for how the limit and the cache affect CI jobs.

| Variable | Default | Description |
| --- | --- | --- |
| `BASIC_AUTH_CACHE_ENABLED` | `true` | Remembers successful password checks of HTTP Basic requests. Repsy stores passwords with BCrypt, which is slow on purpose, so checking one is expensive; a client that sends its user name and password with every request would pay that cost every time. The cache keeps a keyed digest, never the password, and a changed password, a deleted user or a changed role takes effect on the next request. Deploy tokens are cheap to check and do not need it. |
| `BASIC_AUTH_CACHE_TTL_SECONDS` | `300` | How long a remembered check stays valid, in seconds. |
| `BASIC_AUTH_CACHE_MAX_ENTRIES` | `10000` | How many remembered checks are kept. |
| `AUTH_THROTTLE_ENABLED` | `true` | Limits the failed password checks of one client, so that a flood of wrong passwords cannot keep the server busy. A client over the limit gets the response `429 Too Many Requests` with a `Retry-After` header. Set it to `false` if you already limit failed logins in a reverse proxy. |
| `AUTH_THROTTLE_MAX_FAILURES` | `20` | How many failed checks a client may make in one window. Raise it if many users share one address, for example a company network. |
| `AUTH_THROTTLE_WINDOW_SECONDS` | `60` | The length of the window in seconds. When it ends, the count starts again. |
| `AUTH_THROTTLE_MAX_CLIENTS` | `10000` | How many clients Repsy tracks at once. The least recently seen client is dropped first. |

The numeric `AUTH_THROTTLE_` values and the two numeric cache values must be positive unless the feature is disabled;
otherwise Repsy does not start. A client is told apart by its address. Behind a reverse proxy this is the address the proxy
passes in `X-Forwarded-For`, and an IPv6 client counts by its `/64` network. The proxy must be one that Repsy trusts,
otherwise all clients look like one and share a count.

### Password Reset Marker

An operator with access to the server can reset the password of any user by creating a file, named after the user, in a
directory that Repsy watches. See [Recovering a Lost Password](../../administration/recovering-a-lost-password/#a-marker-file) for how to use it.

| Variable | Default | Description |
| --- | --- | --- |
| `PASSWORD_RESET_MARKER_ENABLED` | `true` | Turns the marker directory on. Nothing is reachable over the network: it takes write access to that directory. Set it to `false` if you do not want the feature. |
| `PASSWORD_RESET_MARKER_DIR` | Image: `/app/data/password-reset`. From source: `password-reset` inside `STORAGE_BASE_PATH` | The directory to watch. In the image it is on the data volume. |
| `PASSWORD_RESET_MARKER_POLL_INTERVAL` | `PT5S` | How often a running Repsy looks into the directory. It must be at least `PT1S`. A file that appears while Repsy is stopped is handled once at the next start. |

## Upload Size Limits

Repsy refuses a larger upload with the status `413`. A reverse proxy in front of Repsy may have a smaller limit of its own,
see [Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/#large-uploads).

| Variable | Default | Applies to | Description |
| --- | --- | --- | --- |
| `MULTIPART_MAX_FILE_SIZE` | `500MB` | PyPI, Helm (classic upload) and NuGet | The largest single file of a multipart upload, which is how these clients send a package. |
| `MULTIPART_MAX_REQUEST_SIZE` | `500MB` | PyPI, Helm (classic upload) and NuGet | The largest size of the whole multipart request. Keep it at least as large as `MULTIPART_MAX_FILE_SIZE`. |
| `RUBY_MAX_GEM_SIZE` | `500MB` | Ruby | The largest gem that `gem push` may send. |
| `CARGO_MAX_CRATE_SIZE` | `100MB` | Cargo | The largest `.crate` file that `cargo publish` may send. |
| `GO_MAX_MODULE_ZIP_SIZE` | `500MB` | Go | The largest module zip that may be published. The default equals the limit of the `go` tool for a module zip. |

Repsy copies an upload into a temporary file while it checks it, instead of holding it in memory. Keep the temporary
directory of Java (`java.io.tmpdir`) on a disk that has room for the largest package you allow.

## Vulnerability Scanning

Repsy can scan pushed packages for known vulnerabilities with a separate scanner service, the `repsy-scanner-trivy`
service of the source repository. Scanning is off by default and needs nothing else to run Repsy. This section only
describes the settings: it does not describe how to set up the scanner service.

### Settings of Repsy

| Variable | Default | Description |
| --- | --- | --- |
| `SECURITY_SCANNER` | `disabled` | Set to `enabled` to scan pushed packages. |
| `TRIVY_SCANNER_BASE_URL` | `http://localhost:8090` | The address of the scanner service. |
| `TRIVY_SCANNER_API_KEY` | Empty | The shared key that Repsy sends to the scanner. It must equal the `SCANNER_API_KEY` of the scanner, or the scanner rejects every request. |
| `TRIVY_REQUEST_TIMEOUT_SECONDS` | `10` | How long Repsy waits for the scanner to answer a request, in seconds. |
| `TRIVY_POLL_INTERVAL_MS` | `3000` | How often Repsy asks the scanner for the state of running scans, in milliseconds. |
| `TRIVY_MAX_SCAN_DURATION_SECONDS` | `330` | After this time a scan counts as failed with the message that it exceeded the maximum duration. The default is a little longer than the default of `TRIVY_TIMEOUT_SECONDS` of the scanner. |
| `DOCKER_INTERNAL_REGISTRY_BASE_URL` | `http://localhost:9090` | The address under which the **scanner** reaches the Docker registry of this Repsy instance to pull images for a scan. Repsy passes it to the scanner, so it is resolved from the scanner's side: with a scanner in a container it must not be `localhost`, which would be the scanner itself. Use the name of the Repsy service, for example `http://repsy:9090`. |

### Settings of the Scanner Service

These variables belong to the scanner service, not to Repsy. They come from the scanner's own configuration file.

| Variable | Default | Description |
| --- | --- | --- |
| `SCANNER_API_KEY` | None: required | The shared key that the scanner checks in the `X-Scanner-Api-Key` header. |
| `SERVER_PORT` | `8090` | The port of the scanner. |
| `TRIVY_BINARY_PATH` | `trivy` | The path of the `trivy` program. |
| `TRIVY_TIMEOUT_SECONDS` | `300` | The longest time a single Trivy run may take. |
| `SCANNER_WORKER_COUNT` | `1` | How many scans run at the same time. |
| `SCANNER_JOB_RETENTION_MINUTES` | `60` | How long the state and result of a finished scan can be queried. |
| `SCANNER_JOB_RETENTION_CHECK_INTERVAL_MS` | `600000` | How often expired scan jobs are removed, in milliseconds. |
| `SHUTDOWN_TIMEOUT_SECONDS` | `300` | How long the scanner waits for running scans when it shuts down. Not described in the scanner's README; taken from its configuration file. |
| `TRIVY_DB_REPOSITORY` | `ghcr.io/aquasecurity/trivy-db:2,mirror.gcr.io/aquasec/trivy-db:2` | The locations that Trivy downloads its vulnerability database from. Taken from the scanner's configuration file; not described in its README. |
| `TRIVY_JAVA_DB_REPOSITORY` | `ghcr.io/aquasecurity/trivy-java-db:1,mirror.gcr.io/aquasec/trivy-java-db:1` | The locations that Trivy downloads its Java package database from. Taken from the scanner's configuration file; not described in its README. |

The README of the project also lists `TRIVY_GATE_ACQUIRE_TIMEOUT_SECONDS` (60) among the settings. Nothing in the source of
Repsy or of the scanner reads it, so it has no effect that could be confirmed. Do not rely on it.

## Logging

| Variable | Default | Description |
| --- | --- | --- |
| `LOGGING_LEVEL_ROOT` | `WARN` | The log level of the whole application: `ERROR`, `WARN`, `INFO`, `DEBUG` or `TRACE`. At `WARN`, the log holds only warnings and errors, and among them the password of a newly created or reset administrator. Use `INFO` to see the database migrations and the start of the server. Do not set `ERROR`, because that hides the generated password. This is the standard Spring Boot variable for the log level; it is not defined in Repsy's own configuration file. |

Repsy writes its log to the standard output. In Docker, read it with `docker logs`.
