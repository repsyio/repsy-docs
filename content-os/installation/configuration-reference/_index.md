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
- **Sizes** are a number with a unit, such as `100MB` or `1GB`. The units are binary, as in Spring's `DataSize`: `MB` means MiB (1,048,576 bytes) and `GB` means GiB (1,073,741,824 bytes), so `500MB` is 500 MiB, that is 524,288,000 bytes.

A variable that you do not set keeps the default in the tables below. Where the Docker image differs from a build from
source, the table says so.

## First Start and Sessions

| Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_INITIAL_PASSWORD` | Empty: Repsy generates a random password and logs it once | The password of the first `admin` user. Repsy uses it only when no administrator exists yet, so changing it later has no effect. It must contain an uppercase letter, a lowercase letter and a digit, must not contain whitespace and must not exceed 72 bytes; otherwise Repsy does not start. |
| `OS_APP_JWT_SECRET` | A random value that is created on every start | The secret that signs the sessions of the panel. Set it to a fixed random value, for example the output of `openssl rand -base64 32`, in every installation that people use: without it, every restart signs everybody out. |

The panel signs users in with an access token that is valid for 30 minutes and a refresh token that is valid for 60 minutes
and can be used once. A session ends at the latest 24 hours after the sign-in. These lifetimes are fixed and cannot be
configured. Changing the password or the username of an account invalidates its older refresh tokens. It also ends the
sessions of the package managers: the Docker token, the npm login token and the Cargo token of that account. Their
lifetimes are 30 minutes for Docker and Cargo and 90 days for npm; after a change the next request that uses one answers
`401` with `sessionExpired`. Deploy tokens are not affected.

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
| `STORAGE_BASE_PATH` | `/app/data/storage` in the Docker image. From source, the `.repsy` directory of the home directory of the user who runs Repsy | The directory for package files. **In the Docker image, mount a volume on `/app/data`**: the default lies inside it, and the files survive a new container. Images up to `26.08.4` stored the files in `/home/appuser/.repsy`, inside the container. When the variable has the image default, `/app/data/storage` is empty and `/home/appuser/.repsy` holds files, the image keeps using `/home/appuser/.repsy` and logs a `WARN`, see [Upgrading Repsy Open Source](../../administration/upgrading-repsy-open-source/). |
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
| `REPO_BASE_URL` | `http://localhost:9090` in the panel of the Docker image. Unset for the npm registry and NuGet, which then derive the address from each request | The public address of the package port, for example `https://repo.example.com`. The panel shows it in its client configuration snippets, the npm registry uses it in the download links (`dist.tarball`) of packages, and NuGet uses it, followed by the repository name, for the addresses in its service index, its registration and its search results. Set it whenever users do not reach Repsy as `localhost:9090`, and always behind a reverse proxy. The Docker start script copies it into the panel, so set it as an environment variable of the container. From source, also edit `static/assets/static-env.js`. |
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
| `APP_ALLOWED_ORIGINS` | Empty: same-origin only, no CORS headers | A comma-separated list of exact origins, for example `https://panel.example.com`, from which a browser may call the panel API across origins with credentials. Leave it empty when the panel and its API share an origin (the default setup). Set it when the panel is served from another origin than the API (a separately hosted web UI, or `API_BASE_URL` pointing elsewhere). Exactly the listed origins are allowed. It applies to the panel API only: the package port sends no CORS headers. It also adds these origins to the `connect-src` directive of the built-in Content Security Policy. |
| `APP_HSTS_MAX_AGE` | `0`: never sent | The `max-age` in seconds of a `Strict-Transport-Security` header. When it is positive, Repsy sends the header on secure requests only (a request that arrives on an HTTPS port of Repsy, or through a reverse proxy that sends `X-Forwarded-Proto: https`), on both ports. It is off by default because a browser applies HSTS to a whole host, not to one port: with the panel on plain `:8080` and on HTTPS `:8443` of one host, browsers would upgrade the plain panel address as well. A reverse proxy in front of Repsy normally sets HSTS itself. |
| `APP_CSP_ENABLED` | `true` | Sends a `Content-Security-Policy` header with the panel and its files. The API responses (`/api/...`) and the package port do not carry it. Set it to `false` if a reverse proxy in front of Repsy sends its own. |
| `APP_CSP_REPORT_ONLY` | `false` | Sends the header `Content-Security-Policy-Report-Only` instead: a browser reports violations but blocks nothing. Useful while you test a changed policy. |
| `APP_CSP_POLICY` | Empty: the built-in policy | Replaces the built-in policy completely with the value you give. |

The built-in policy allows the files of the panel itself and no third-party host: the panel makes no request to another
origin. A policy that you set in `APP_CSP_POLICY` must allow everything the panel needs, so
start from the built-in policy when you write one. The other directives of the built-in policy are `default-src 'self'`,
`object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` and `form-action 'self'`.

Repsy also sends `X-Content-Type-Options: nosniff` on both ports, and `Referrer-Policy` and `X-Frame-Options` on the panel port. [Security Headers and CORS](../../administration/security-headers-and-cors/) explains these settings and headers.

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
| `GO_MAX_MODULE_ZIP_SIZE` | `500MB` | Go | The largest module zip that may be published. The default `500MB` is 500 MiB (524,288,000 bytes) and equals the limit of the `go` tool for a module zip. A zip of 501,000,000 bytes is accepted, one of 525,000,000 bytes is refused with `413`. |

Repsy copies an upload into a temporary file while it checks it, instead of holding it in memory. Keep the temporary
directory of Java (`java.io.tmpdir`) on a disk that has room for the largest package you allow.

## Vulnerability Scanning

Repsy can scan pushed packages for known vulnerabilities with a separate scanner service, the `repsy-scanner-trivy`
service. Scanning is off by default and needs nothing else to run Repsy. This section describes the settings.
[Setting Up Vulnerability Scanning](../../administration/setting-up-vulnerability-scanning/) shows how to run the scanner
service, and [Reviewing Scan Results](../../repositories/reviewing-scan-results/) how to read what it finds.

### What a Scan Covers

A scan covers what a package **contains**, not what it declares. For Maven, npm and PyPI the scanner unpacks the stored file and runs Trivy's `rootfs` scan on it. That scan reads the packages that are installed or bundled in the file: the package's own metadata (`package/package.json` for npm, `PKG-INFO` or `*.dist-info` for PyPI), a `node_modules` directory, and nested jars. It does not read lock files and it does not look up the dependencies that a package declares.

| Format | What is scanned | What is not scanned |
| --- | --- | --- |
| npm | The package tarball: the package's own metadata (`package/package.json`) and the packages bundled in it (`node_modules/*/package.json`). | The `dependencies`, `devDependencies` and `peerDependencies` of the package, and a `package-lock.json` or `yarn.lock` in the tarball. |
| Maven | The main file of the version (a jar, or a war, ear or rar, depending on the packaging), including the jars nested in it. | The dependencies that the POM declares. A jar without bundled dependencies is scanned as itself only. |
| PyPI | The source distribution (`.tar.gz`) if the release has one, otherwise the first matching file, such as a wheel; the package's own metadata. | The dependencies that the package declares (`Requires-Dist`). |
| Docker | The whole image, which the scanner pulls from Repsy by its reference. | |

A package that declares vulnerable dependencies without bundling them is therefore reported without findings. A clean scan does not mean that the dependencies of a package are free of vulnerabilities. A scan uses the vulnerability database that the scanner holds locally, and it only sees a version that was pushed while scanning was on for the repository, or that somebody scanned by hand. Its findings are frozen at the time of the scan and do not change when the database learns a new advisory. For `npm audit`, which also asks the database directly, see [Auditing an Installation](../../npm/managing-npm-packages/#auditing-an-installation).

### Settings of Repsy

| Variable | Default | Description |
| --- | --- | --- |
| `SECURITY_SCANNER` | `disabled` | Set to `enabled` to scan pushed packages. |
| `TRIVY_SCANNER_BASE_URL` | `http://localhost:8090` | The address of the scanner service. |
| `TRIVY_SCANNER_API_KEY` | Empty | The shared key that Repsy sends to the scanner. It must equal the `SCANNER_API_KEY` of the scanner, or the scanner rejects every request. |
| `TRIVY_REQUEST_TIMEOUT_SECONDS` | `10` | How long Repsy waits on the scanner at one time, in seconds: for its answer once a request has been sent in full, and for the scanner to accept more of an upload that it has stopped reading. It does not limit how long an artifact takes to upload, so a large artifact still scans over a slow link; the whole submit is cut off after `TRIVY_MAX_SCAN_DURATION_SECONDS`. A submit that fails on this timeout is not retried. |
| `TRIVY_POLL_INTERVAL_MS` | `3000` | How often Repsy asks the scanner for the state of running scans, in milliseconds. |
| `TRIVY_MAX_SCAN_DURATION_SECONDS` | `330` | How long Repsy waits for a scan to finish, the upload of the artifact to the scanner included. After that the scan counts as failed with the message that it exceeded the maximum duration. The default is a little longer than the default of `TRIVY_TIMEOUT_SECONDS` of the scanner. |
| `TRIVY_SUBMIT_MAX_ATTEMPTS` | `3` | How many times Repsy submits a scan when it cannot reach the scanner (connection refused, a DNS failure or a connection reset, as while the scanner restarts), the first submit included. `1` turns the retry off. A scanner that answers with an error, or does not answer in time, is not retried: start that scan again from the web UI. From 1 to 5. |
| `TRIVY_SUBMIT_RETRY_INITIAL_DELAY_SECONDS` | `15` | The wait before the first retry of a scanner that cannot be reached. From 1 to 300. |
| `TRIVY_SUBMIT_RETRY_MAX_DELAY_SECONDS` | `60` | The longest wait before any retry. The wait grows fourfold per retry: 15 seconds, then 60. From the initial delay to 300. Keep the waits well below `TRIVY_MAX_SCAN_DURATION_SECONDS`, and note that a retry that is waiting is lost when Repsy restarts: the scan is then marked failed after that duration. |
| `TRIVY_ADVISORY_LOOKUP_MAX_CONCURRENCY` | `2` | How many lookups of `npm audit` run on the scanner at once, see [Auditing an Installation](../../npm/managing-npm-packages/#auditing-an-installation). An audit that finds no free place within `TRIVY_ADVISORY_LOOKUP_MAX_WAIT_MILLIS` is answered from the stored findings only. Each lookup is bounded by `TRIVY_REQUEST_TIMEOUT_SECONDS` and never delays a scan. |
| `TRIVY_ADVISORY_LOOKUP_MAX_WAIT_MILLIS` | `2000` | How long an `npm audit` waits for a free place for its lookup, in milliseconds. |
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
| `SHUTDOWN_TIMEOUT_SECONDS` | `300` | How long the scanner waits for running scans when it shuts down. |
| `TRIVY_DB_REPOSITORY` | `ghcr.io/aquasecurity/trivy-db:2,mirror.gcr.io/aquasec/trivy-db:2` | The OCI repositories that Trivy downloads its vulnerability database from, as a comma-separated list that is tried in order. Set it to a mirror on a network without access to `ghcr.io`, see [Running Without Internet Access](../../administration/setting-up-vulnerability-scanning/#running-without-internet-access). |
| `TRIVY_JAVA_DB_REPOSITORY` | `ghcr.io/aquasecurity/trivy-java-db:1,mirror.gcr.io/aquasec/trivy-java-db:1` | The same for the Java database. |
| `TRIVY_CACHE_DIR` | `$HOME/.cache/trivy` (`/home/appuser/.cache/trivy` in the image) | Where Trivy keeps its databases. The scanner passes it to every Trivy run and reads the dates of the databases from it. Mount a volume here, and leave room for a second copy of the databases while a refresh runs, about 3 GB. |
| `TRIVY_DB_REFRESH_INTERVAL` | `PT12H` | How often the scanner refreshes the databases, as an ISO-8601 duration. The first refresh after a start is one interval later, because the download at start-up comes first. A refresh downloads only when a database is past its `NextUpdate`. Trivy publishes a database every 6 hours and gives it a `NextUpdate` a day ahead. |
| `TRIVY_ADVISORY_TIMEOUT_SECONDS` | `30` | The longest a lookup of `npm audit` waits for its Trivy run. The scanner then answers `504`. |
| `SCANNER_ADVISORY_CONCURRENCY` | `2` | How many lookups may run or wait for the database at once. The next one is refused with `503`. |
| `SCANNER_ADVISORY_MAX_WAIT_SECONDS` | `5` | How long a lookup waits for a running scan, or for a switch of the database, to end before it is refused with `503`. |

The scanner's own README describes the scanner's interface in full, including the lookup of `npm audit` (`POST /advisories`)
and `GET /status`, which reports the version of Trivy and the dates of its databases.

## Logging

| Variable | Default | Description |
| --- | --- | --- |
| `LOGGING_LEVEL_ROOT` | `WARN` | The log level of the whole application: `ERROR`, `WARN`, `INFO`, `DEBUG` or `TRACE`. At `WARN`, the log holds only warnings and errors, and among them the password of a newly created or reset administrator. Use `INFO` to see the database migrations and the start of the server. Do not set `ERROR`, because that hides the generated password. This is the standard Spring Boot variable for the log level; it is not defined in Repsy's own configuration file. |

Repsy writes its log to the standard output. In Docker, read it with `docker logs`.
