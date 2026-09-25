+++
title = "Installing from Source"
weight = 154
+++

# Installing from Source

If you cannot use Docker, or you want to run a build of your own, you can build Repsy Open Source from its source code
and run it as a plain Java application. The backend is a Spring Boot application, and the web panel is an Angular
application that the backend serves as static files.

Unless you have a reason to build it yourself, use one of the Docker installations: they are the ones that are tested
and described in detail.

## What You Need

| Requirement | Version | Why |
| --- | --- | --- |
| Git | Any recent version | To fetch the source, including a submodule. |
| JDK | **25** | The build only accepts Java 25, and Repsy runs on it. |
| Apache Maven | 3.9.7 or newer | Builds the backend. |
| Node.js | 24.x | Builds the web panel. The project declares that other major versions are not supported. |
| pnpm | 12.5.1 | The package manager of the web panel. This is the version the project's own build uses. |
| A database | PostgreSQL 18, or the embedded H2 database | Nothing to install for H2. |

The first frontend build downloads the OpenAPI generator from Maven Central, and both builds download their dependencies, so
you need internet access. The generator runs on Java.

{{< steps >}}
### Get the Source

Clone the repository together with its submodule, `core`, which holds the shared Maven parent of the build. Use the tag of
the release you want to build; release tags start with `v`. Without `--branch` you get the development branch `main`,
which is not a release.

```bash
git clone --branch <release-tag> --recurse-submodules https://github.com/repsyio/repsy.git
cd repsy
```

The submodule is configured with an SSH address (`git@github.com:repsyio/repsy-core.git`). If you have no SSH key for GitHub,
tell Git to use HTTPS for it:

```bash
git -c url."https://github.com/".insteadOf="git@github.com:" clone --branch <release-tag> --recurse-submodules https://github.com/repsyio/repsy.git
```

### Build the Backend

Install the shared modules first, then build the backend with everything it needs:

```bash
mvn -f core/pom.xml install -DskipTests
mvn install -pl repsy-backend -am -DskipTests -DskipITs
```

`-DskipITs` matters. Without it the build also runs the integration tests, which start a PostgreSQL container and need a
running Docker daemon.

The result is one executable jar, `repsy-backend/target/repsy-backend.jar`.

### Build the Web Panel

```bash
cd repsy-frontend
pnpm install --frozen-lockfile --ignore-scripts
pnpm run gen:api
pnpm run build:prod
cd ..
```

`gen:api` generates the client of Repsy's panel API from the specification in the backend. The build writes the panel to
`repsy-frontend/dist/panel-frontend/browser`.

### Put the Application Together

Repsy serves the panel from a directory named `static` in its working directory. Create a directory to run it from and
copy both results into it. The location is up to you; `/opt/repsy` is used here.

```bash
mkdir -p /opt/repsy
cp repsy-backend/target/repsy-backend.jar /opt/repsy/app.jar
cp -r repsy-frontend/dist/panel-frontend/browser /opt/repsy/static
```

The panel finds the addresses of the API and of the package protocols in `static/assets/static-env.js`. It contains the
placeholders `__API_BASE_URL__` and `__REPO_BASE_URL__`, which the Docker image replaces when it starts. If you leave them,
the panel uses `http://localhost:8080` for the API and `http://localhost:9090` for the client configuration it shows,
which is right on your own machine only. Otherwise replace them, with an empty API address if the panel and the API are
reached under the same address:

```bash
sed -i \
  -e "s|__API_BASE_URL__||g" \
  -e "s|__REPO_BASE_URL__|https://repo.example.com|g" \
  /opt/repsy/static/assets/static-env.js
```

Use the same address for the `REPO_BASE_URL` variable in the next step: the panel takes it from this file, while the npm
registry takes it from the variable.

### Run It

Create the directory for the data and make it writable for the user who runs Repsy. Then set the configuration in
environment variables and start the jar from its own directory. With the embedded H2 database:

```bash
mkdir -p /var/lib/repsy
cd /opt/repsy
export DB_URL='jdbc:h2:file:/var/lib/repsy/repsy;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE'
export STORAGE_BASE_PATH=/var/lib/repsy/storage
export ADMIN_INITIAL_PASSWORD=ChangeMe123
export REPO_BASE_URL=https://repo.example.com
export OS_APP_JWT_SECRET="$(openssl rand -base64 32)"
java -jar app.jar
```

Or with PostgreSQL 18, where the database and the user `repsy` already exist and the user owns the database:

```bash
mkdir -p /var/lib/repsy
cd /opt/repsy
export DB_URL=jdbc:postgresql://localhost:5432/repsy
export DB_USERNAME=repsy
export DB_PASSWORD=<database-password>
export STORAGE_BASE_PATH=/var/lib/repsy/storage
export ADMIN_INITIAL_PASSWORD=ChangeMe123
export REPO_BASE_URL=https://repo.example.com
export OS_APP_JWT_SECRET="$(openssl rand -base64 32)"
java -jar app.jar
```

Save the `OS_APP_JWT_SECRET` value somewhere and set the same one on every start, otherwise everybody has to sign in
again after each restart. Repsy creates the directory of `STORAGE_BASE_PATH` and the folders for each package type in
it itself.

### Sign In

Repsy needs a few seconds to start. Then open [http://localhost:8080](http://localhost:8080) and sign in as `admin` with
the password you set. Package clients connect to port `9090`.
{{< /steps >}}

## Configuration

A build from source reads the same environment variables as the Docker image, so the
[Configuration Reference](../configuration-reference/) applies. Three defaults differ from the image:

- Without `DB_URL`, Repsy connects to PostgreSQL at `localhost:5432`, database `repsy`, with the user `repsy` and the
  password `repsy123`. The Docker image defaults to an embedded H2 database.
- Without `STORAGE_BASE_PATH`, Repsy stores package files in the `.repsy` directory of the home directory of the user
  who runs it. Set it explicitly to a directory that you back up.
- Without `PASSWORD_RESET_MARKER_DIR`, the directory for password reset marker files is `password-reset` inside the
  storage directory. The image places it in `/app/data`.

Run Repsy under a process supervisor of your choice, such as systemd, so that it starts at boot and after a crash, and put
its environment variables in a file that only its user can read: they contain passwords.

## Updating

To move to a newer release, fetch its tag, update the submodule, and repeat the build steps. Then replace `app.jar` and
the `static` directory in your run directory and restart Repsy. Take a backup of the database and of the storage
directory before you start a new release: database migrations only go forward.
[Upgrading Repsy Open Source](../../administration/upgrading-repsy-open-source/) describes upgrades in detail.
