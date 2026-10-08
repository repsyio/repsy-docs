+++
title = "Installing on Kubernetes with Helm"
weight = 154
description = "Install Repsy Open Source on Kubernetes with its Helm chart: storage, PostgreSQL, secrets, ingress and TLS, scanning, upgrades and uninstall."
+++

# Installing on Kubernetes with Helm

Repsy Open Source has a Helm chart, `repsy-os`. It installs the Repsy image, a volume for its data and a Service for its two
ports. It can also install a PostgreSQL 18 database, an ingress for the web UI and the package protocols, and the
vulnerability scanner. This page installs Repsy with it, shows the values you need for a long-lived installation, and
explains how to upgrade and remove it.

The chart runs Repsy as **one pod**. Repsy is not designed to run as several instances on the same data, so the chart has no
replica count: the Deployment has one replica and the strategy `Recreate`, which stops the old pod before it starts the new
one. A change of the configuration or an upgrade therefore takes Repsy offline for a short time.

The chart and Repsy share their version: chart `26.10.0` installs Repsy `26.10.0`. The commands below use `26.10.0`, the
release this page was written for. Use the release you want to install instead.

## What You Need

- **A Kubernetes cluster, version 1.25 or later,** and `kubectl` set up for it.
- **Helm 3.8 or later.** The chart is published as an OCI artifact, which Helm supports from 3.8. The chart's own tests run
  with Helm 3 and Helm 4.
- **A default StorageClass,** or the name of one that you set with `persistence.storageClass`. The chart asks for a volume of
  20 GiB for the data of Repsy.
- **For an ingress:** an ingress controller in the cluster, two DNS names that point to it (one for the web UI and one for the
  package protocols), and a TLS certificate for both, or [cert-manager](https://cert-manager.io/) to issue one. See
  [Expose Repsy with an Ingress](#expose-repsy-with-an-ingress).
- **For the scanner:** outbound internet access from the cluster, unless you provide your own scanner. See
  [Add Vulnerability Scanning](#add-vulnerability-scanning).

The images are public: `repo.repsy.io/repsy/os/repsy` and `repo.repsy.io/repsy/os/repsy-scanner-trivy`. You only need
`imagePullSecrets` when you pull them through a private mirror.

## Install Repsy

The defaults give a complete, working installation with nothing else in the cluster: one pod, the embedded H2 database, and
the database and the package files on one persistent volume. It is a good way to try Repsy on Kubernetes. Read
[Choose the Database](#choose-the-database) and [Keep Secrets Out of Your Values](#keep-secrets-out-of-your-values) before you
use it for real.

{{< steps >}}
### Install the Chart

```bash
helm install repsy-os oci://repo.repsy.io/repsy/os-charts/repsy-os \
  --version 26.10.0 \
  --namespace repsy --create-namespace \
  --set admin.initialPassword='<admin-password>'
```

Always pass `--version`: the registry does not list the tags of a chart, so Helm cannot look up the latest one for you.

Replace `<admin-password>` with a password of your choice. It needs an uppercase letter, a lowercase letter and a digit, and
no whitespace, otherwise Repsy refuses to start and the pod restarts again and again. It is used once, on the first start,
when no administrator exists yet. Without `admin.initialPassword`, Repsy generates a random password and writes it to its log
once:

```bash
kubectl --namespace repsy logs deploy/repsy-os | grep -i password
```

`--set` puts the password into the release that Helm keeps in the cluster. For anything but a trial, use a Secret
instead, see [Keep Secrets Out of Your Values](#keep-secrets-out-of-your-values).

### Wait Until It Is Ready

```bash
kubectl --namespace repsy rollout status deploy/repsy-os
helm test repsy-os --namespace repsy
```

`helm test` starts a short-lived pod that requests the web UI on port `8080` and the package protocols on port `9090`. The
first start takes a little longer than the following ones, because Repsy creates its database tables.

### Open the Web UI

Without an ingress, forward the two ports to your machine:

```bash
kubectl --namespace repsy port-forward svc/repsy-os 8080:8080 9090:9090
```

Open [http://localhost:8080](http://localhost:8080) and sign in as `admin`. Package clients use
`http://localhost:9090`, which is also what the web UI shows in its configuration snippets until you set the public address,
see [Expose Repsy with an Ingress](#expose-repsy-with-an-ingress). The instance already has nine private repositories, one for
every package type.
{{< /steps >}}

The release is named `repsy-os` in this page, and the chart names its resources after the release: the Deployment, the Service
and the volume claim are all called `repsy-os`. With another release name, such as `repsy`, they are called `repsy-repsy-os`,
and the commands on this page need that name. A release name that already contains `repsy-os` is used as it is.

To see everything that a chart can be configured with, print its default values:

```bash
helm show values oci://repo.repsy.io/repsy/os-charts/repsy-os --version 26.10.0
```

Keep your own values in a file, `values.yaml` in the examples below, and pass it with `-f values.yaml` to `helm install` and
to every `helm upgrade`. The chart does not reject a value it does not know, so a misspelled key is ignored without a
message. Check a file with `helm template` before you rely on it.

## What the Chart Installs

| Resource | When | Notes |
| --- | --- | --- |
| Deployment `<release>` | Always | One replica, strategy `Recreate`. |
| Service `<release>` | Always | Port `8080` for the web UI and its API, port `9090` for the package protocols, and `8443` and `9443` when you turn on the HTTPS listeners. |
| PersistentVolumeClaim `<release>` | `persistence.enabled`, which is the default | Mounted at `/app/data`. |
| Secret `<release>` | When a value needs one | The session secret, and the passwords and keys that you give as plain values or that the chart generates. |
| Ingress `<release>` | `ingress.enabled` | Two hosts. |
| StatefulSet and Service `<release>-postgresql` | `postgresql.enabled` | PostgreSQL 18 with its own volume. |
| Deployment and Service `<release>-scanner` | `scanner.enabled` | The vulnerability scanner. |
| Pod `<release>-test-connection` | `helm test` | Checks both ports. |

## Where the Data Lives

Everything that Repsy keeps is under `/app/data`, on the volume that the chart mounts there:

- the package files, in `/app/data/storage`. The chart sets `STORAGE_BASE_PATH` to it (`storage.basePath`), and it is also
  the default of the image. Change it only for an installation that already keeps its files somewhere else on the volume:
  pointing an existing installation to a new path makes its packages invisible.
- the embedded H2 database, `/app/data/repsy.mv.db`, when you do not use PostgreSQL.
- the directory for [password reset markers](../../administration/recovering-a-lost-password/).

So the volume survives a restart of the pod, a reschedule and a `helm upgrade`. Set it up with these values:

```yaml
persistence:
  size: 50Gi
  storageClass: fast-ssd     # leave out to use the default StorageClass
```

| Value | Default | Meaning |
| --- | --- | --- |
| `persistence.enabled` | `true` | With `false` the data is kept in an `emptyDir` and lost when the pod is rescheduled. Only for a throwaway installation. |
| `persistence.size` | `20Gi` | The size of the volume. |
| `persistence.storageClass` | The default class of the cluster | |
| `persistence.accessMode` | `ReadWriteOnce` | Repsy is a single pod, so it needs no more. |
| `persistence.existingClaim` | Empty | Use a volume claim that you created, instead of a new one. |
| `persistence.annotations` | Empty | Annotations of the new claim, for example `helm.sh/resource-policy: keep`, see [Uninstalling](#uninstalling-and-data-retention). |

Whether you can make the volume larger later depends on your StorageClass, not on the chart. See
[Managing Storage and Cleanup](../../administration/managing-storage-and-cleanup/) for what fills the volume.

Uploads also need temporary space. Repsy copies an upload to a file in `/tmp` while it checks it, and in a pod `/tmp` is the
writable layer of the container, which counts against the ephemeral storage of the node and is lost with the pod. If your
largest upload is big, or several arrive at once, give `/tmp` a volume of its own. The chart has no value for it, but it
passes extra volumes through:

```yaml
extraVolumes:
  - name: tmp
    emptyDir:
      sizeLimit: 5Gi
extraVolumeMounts:
  - name: tmp
    mountPath: /tmp
```

## Choose the Database

| Choice | How | Use it when |
| --- | --- | --- |
| Embedded H2 | The default. No value. | You try Repsy out, or run a small instance for a few people. |
| The PostgreSQL 18 of the chart | `postgresql.enabled: true` | You want PostgreSQL and nothing else to look after: one StatefulSet next to Repsy. |
| Your own PostgreSQL 18 | `externalDatabase.enabled: true` | You have a database service already, with its own backups, or one that a cloud provider runs for you. |

**PostgreSQL is the database for an installation that people rely on.** H2 is a file on the same volume as the packages that only
one process can open, and it is what Repsy suggests for evaluation and development. PostgreSQL is a separate service that you
can back up, monitor and move on its own, see [Persisting Data and Backups](../../administration/persisting-data-and-backups/#choosing-the-database).
Repsy creates and updates its own tables in all three cases.

With the embedded H2 database the pod needs time to close it when it stops, so the chart sets `terminationGracePeriodSeconds` to
`120` (the Kubernetes default is 30). A pod that is killed first starts the next time as after a crash and can lose recent changes.
Chart versions up to `26.08.5` also set `DB_CLOSE_ON_EXIT=FALSE` on the H2 URL, with which every restart loses recent changes:
upgrade the chart, or remove the option with `extraEnv` (a `DB_URL` without it).

If you enable both `postgresql` and `externalDatabase`, the render stops with an error: choose one.

**Moving from one database to another is not something the chart does.** The data stays in the database it was written to.
Choose before you fill the instance.

### The PostgreSQL of the Chart

```yaml
postgresql:
  enabled: true
  persistence:
    size: 20Gi
```

The chart starts a StatefulSet `<release>-postgresql` with the `postgres:18` image, a database and a user named `repsy`, and a
volume of `8Gi` by default (`postgresql.persistence.size`). It gives Repsy the address, the user and the password, and Repsy
waits for the database before it starts. Without a password of your own the chart generates one, see
[Keep Secrets Out of Your Values](#keep-secrets-out-of-your-values). It is a single database pod with no replication or
backup of its own, so plan the backups, see [Back Up Before You Change Anything](#back-up-before-you-change-anything).

### Your Own PostgreSQL

Give the connection as a JDBC URL, or as a host, a port and a database:

```yaml
externalDatabase:
  enabled: true
  url: jdbc:postgresql://postgres.example.com:5432/repsy?sslmode=require
  username: repsy
  existingSecret: repsy-db        # holds the password, key `password`
  existingSecretKeys:           # the password is the only key read from the Secret
    url: ""
    host: ""
    port: ""
    database: ""
    username: ""
```

`url` wins over `host`, `port` and `database`. The user must be able to create tables in the `public` schema. Put the password
into a Secret that you create, and name it in `existingSecret`:

```bash
kubectl --namespace repsy create secret generic repsy-db \
  --from-literal=password='<database-password>'
```

How the Secret is read is easy to get wrong: **every key in `existingSecretKeys` that is not empty is read from the Secret, and
the pod does not start (`CreateContainerConfigError`) when one of them is missing.** The defaults are `host`, `port`,
`database`, `username` and `password`. Either create all the keys the defaults name, or set the ones you do not keep in the
Secret to `""`, as in the example, so that their value comes from the values file. You can also change the name of a key in
`existingSecretKeys`, for example `host: private_host`. The database password can also be a plain value
(`externalDatabase.password`), which the chart keeps in its own Secret; prefer `existingSecret`.

## Keep Secrets Out of Your Values

These settings are secrets. The chart never needs them in your values file: each one can come from a Secret that you create,
and the chart uses it as it is.

| Setting | Secret setting | Key by default | Without it |
| --- | --- | --- | --- |
| The password of the first `admin`, once (`ADMIN_INITIAL_PASSWORD`) | `admin.existingSecret` | `admin-password` | Repsy generates a random password and logs it once. |
| The secret that signs the sessions of the web UI (`OS_APP_JWT_SECRET`) | `auth.jwtSecret.existingSecret` | `jwt-secret` | The chart generates one and keeps it across upgrades. |
| The password of the PostgreSQL of the chart | `postgresql.auth.existingSecret` | `postgres-password` | The chart generates one and keeps it across upgrades. |
| The database connection of your own PostgreSQL | `externalDatabase.existingSecret` | `host`, `port`, `database`, `username` and `password`, see above | The values of `externalDatabase`. |
| The key shared with the scanner | `scanner.existingSecret` | `scanner-api-key` | The chart generates one and keeps it across upgrades. |

Change the name of a key with the matching `existingSecretKey` value. Create the Secrets before you install:

```bash
kubectl --namespace repsy create secret generic repsy-admin \
  --from-literal=admin-password='<admin-password>'
kubectl --namespace repsy create secret generic repsy-jwt \
  --from-literal=jwt-secret="$(openssl rand -base64 32)"
kubectl --namespace repsy create secret generic repsy-postgres \
  --from-literal=postgres-password="$(openssl rand -hex 24)"
```

```yaml
admin:
  existingSecret: repsy-admin
auth:
  jwtSecret:
    existingSecret: repsy-jwt
postgresql:
  enabled: true
  auth:
    existingSecret: repsy-postgres
```

Three things to know about the values that the chart generates:

- **It keeps them by looking up the Secret in the cluster.** `helm template`, `helm install --dry-run` and Argo CD cannot do
  that, so there they change on every render. That restarts the pod and signs everybody out each time. **If you deploy
  with Argo CD or render the chart yourself, give every secret as an existing Secret.**
- **The generated database password only exists in the Secret of the release.** If you lose the Secret, for example by
  uninstalling the release, the PostgreSQL volume still holds the old password and a new one that the chart generates does not
  match it. Keep your own Secret for a database that holds data.
- **`--set` and values files are stored in the cluster.** Helm keeps the values of a release in a Secret of its own, so a
  password given as a plain value is readable by everyone who can read Secrets in that namespace.

Without `OS_APP_JWT_SECRET` Repsy signs everybody out at each restart. The chart avoids that: it always sets it, either from your
Secret or from the one it generated.

## Expose Repsy with an Ingress

Repsy has two HTTP ports, and both must be reachable: the web UI and its API on `8080`, and the package protocols on `9090`.
Both use URLs that start at the root of their host, so an ingress cannot tell them apart by path. The chart therefore needs
**two host names**: everything on the repo host goes to port `9090`, and
everything on the panel host goes to port `8080`. The render fails when one of them is missing or when both are the same.

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
  hosts:
    panel: repsy.example.com
    repo: repo.example.com
  tls:
    enabled: true
    secretName: repsy-tls
```

| Value | Meaning |
| --- | --- |
| `ingress.className` | The ingress class. Empty uses the default class of the cluster. |
| `ingress.hosts.panel` | The host of the web UI and its API. |
| `ingress.hosts.repo` | The host of the package protocols: Maven, npm, PyPI, Docker, Cargo, Go, Helm, NuGet and Ruby. |
| `ingress.tls.enabled` | Serve both hosts over HTTPS with one certificate. |
| `ingress.tls.secretName` | The Secret that holds the certificate, for both hosts. Empty uses `<release>-tls`, the name that cert-manager usually writes it to. |
| `ingress.annotations` | Annotations of the Ingress, for your controller and for cert-manager. |

The chart does not create the certificate. Either create the Secret yourself
(`kubectl create secret tls repsy-tls --cert=... --key=...`, with a certificate that covers both hosts), or let cert-manager
issue it: an annotation such as `cert-manager.io/cluster-issuer` on the Ingress makes it create a certificate for both hosts in
the Secret named in `ingress.tls.secretName`.

**Raise the upload limits of your controller.** Docker layers and Python wheels are large, and most ingress controllers refuse
large bodies by default. The annotations above are for the ingress-nginx controller: no body size limit (`0`) and ten minutes for
a request to be sent and answered. The NGINX Inc controller uses `nginx.org/client-max-body-size` and
`nginx.org/proxy-read-timeout` instead. Repsy has limits of its own for some formats, see
[Managing Storage and Cleanup](../../administration/managing-storage-and-cleanup/#upload-size-limits). Do not overwrite the
`X-Forwarded-*` headers of the controller: Repsy builds absolute URLs from them.

### Tell Repsy Its Public Address

The web UI prints the address of the package protocols in the configuration snippets of every format, and npm and NuGet write
it into the URLs they hand out. Repsy learns it from `REPO_BASE_URL`, and the chart sets that for you from `ingress.hosts.repo`:
`https://repo.example.com` when `ingress.tls.enabled` is true, otherwise `http://`. Two cases need your own value:

- **TLS ends in front of the ingress,** for example at a cloud load balancer, so that `ingress.tls.enabled` is false although
  clients use HTTPS.
- **There is no ingress,** for example a `LoadBalancer` Service or a different way in.

Set the address then:

```yaml
config:
  repoBaseUrl: https://repo.example.com
```

Leave `config.apiBaseUrl` (`API_BASE_URL`) empty. Then the web UI calls the API on the address it was loaded from, which is what
the ingress provides. Set it only when the API is served from another host than the web UI, and then also set
`config.allowedOrigins` (`APP_ALLOWED_ORIGINS`) to the origin of the web UI; see
[Security Headers and CORS](../../administration/security-headers-and-cors/). With `allowedOrigins` empty the API accepts
requests from the same origin only.

To check that the address is right, look at the token address in the answer of the Docker endpoint. It has to name your public
repo host:

```bash
curl -i https://repo.example.com/v2/
```

The `WWW-Authenticate` header must read `Bearer realm="https://repo.example.com/v2/token"`. If it names `http://` or an internal
host, the controller does not send the `X-Forwarded-*` headers that Repsy needs, see
[Running Behind a Reverse Proxy](../../administration/running-behind-a-reverse-proxy/#forward-the-clients-address-scheme-and-host).
Repsy trusts these headers from private addresses by default, which covers an ingress controller in the cluster. If your
controller connects from a public address, tell Repsy which proxy to trust with `SERVER_TOMCAT_REMOTEIP_INTERNAL_PROXIES`,
described on the same page, through `extraEnv`.

**Docker clients need HTTPS on the repo host** for `docker login`, unless you tell the Docker daemon that the registry is
insecure, see [Enabling HTTPS](../../administration/enabling-https/#docker-over-plain-http). That is one more reason to turn on
`ingress.tls`.

### HTTPS Inside the Pod

Most clusters end TLS at the ingress, and the pod needs nothing more. If you want Repsy to serve HTTPS itself as well, for
example behind a load balancer that passes TLS through, the chart can turn on its two HTTPS listeners (`8443` for the web UI and
`9443` for the packages) from a PKCS12 keystore in a Secret:

```bash
kubectl --namespace repsy create secret generic repsy-keystore \
  --from-file=keystore.p12=./keystore.p12 \
  --from-literal=keystore-password='<keystore-password>'
```

```yaml
ssl:
  api:
    enabled: true
    existingSecret: repsy-keystore
  repo:
    enabled: true
    existingSecret: repsy-keystore
```

`keystoreKey` (`keystore.p12`), `passwordKey` (`keystore-password`), `port` and `alias` (`repsy`) of each listener can be
changed. The Service then also exposes `8443` and `9443`. The listeners are added beside the HTTP ones, which stay open. The ingress
of the chart keeps sending to the HTTP ports. [Enabling HTTPS](../../administration/enabling-https/) describes the keystore and
what clients must trust.

## Resources and Health Checks

The chart gives the Repsy container these resources:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 768Mi
  limits:
    memory: 1536Mi
```

There is no CPU limit. The image sets no JVM memory options, so the JVM sizes its heap from the memory limit: by default a
quarter of it, which is 384 MiB with the values above. Raise `resources.limits.memory` for a large instance rather than the heap
alone, or set the JVM options yourself with `extraEnv` (`JAVA_TOOL_OPTIONS`).

Repsy has no separate health endpoint: the start page of the web UI answers with `200` once the application is up. The chart uses it
for all three probes, on the web UI port (`GET /` on `8080`):

| Probe | Setting | Default | Meaning |
| --- | --- | --- | --- |
| Startup | `startupProbe` | Every 5 s, 60 failures | The pod may take 5 minutes to start. That leaves room for the database migrations of an upgrade. |
| Liveness | `livenessProbe` | Every 20 s, timeout 5 s, 6 failures | The container is restarted after about two minutes without an answer. |
| Readiness | `readinessProbe` | Every 10 s, timeout 5 s, 3 failures | The pod leaves the Service after three failed checks. |

Each probe accepts `periodSeconds`, `timeoutSeconds` and `failureThreshold`. If the migrations of an upgrade of a large instance
take longer than five minutes, raise `startupProbe.failureThreshold`: the kubelet otherwise stops Repsy in the middle of a
migration and starts it again.

The pod runs as the user `appuser` of the image (user id `100`, group id `101`), not as root, with no added capabilities, and
`fsGroup` `101` makes the volume writable for it. Keep these values when you use your own volume.

## Add Vulnerability Scanning

Repsy can scan the packages you push for known vulnerabilities with the scanner service, which is off by default.
[Setting Up Vulnerability Scanning](../../administration/setting-up-vulnerability-scanning/) explains what it does, and
[Reviewing Scan Results](../../repositories/reviewing-scan-results/) shows the results. With the chart, one value starts the
scanner and connects it to Repsy:

```yaml
scanner:
  enabled: true
  persistence:
    enabled: true
    size: 8Gi
```

The chart then deploys `<release>-scanner`, a Deployment with one pod and a Service on port `8090` that only exists inside the
cluster, of the image `repo.repsy.io/repsy/os/repsy-scanner-trivy` with the same tag as Repsy. It also sets the four settings
that switch scanning on in Repsy: `SECURITY_SCANNER`, `TRIVY_SCANNER_BASE_URL`, `TRIVY_SCANNER_API_KEY` and
`DOCKER_INTERNAL_REGISTRY_BASE_URL`, the address inside the cluster (`http://<release>.<namespace>.svc.cluster.local:9090`) that
the scanner uses to pull Docker images from Repsy. If your cluster does not use `cluster.local` as its domain, set `clusterDomain`.

- **The API key is required.** Repsy with scanning on and the scanner each refuse to start without a key, and the two must
  have the same one. The chart always sets it: it generates one, or you give it as `scanner.apiKey` or in a Secret named in `scanner.existingSecret` (key `scanner-api-key`).
  Anything in the cluster that can reach port `8090` and knows the key can use the scanner, and the key is the only protection.
- **The cache needs room.** The scanner downloads two vulnerability databases from the internet when it starts, which needs
  outbound access, and keeps them in `/home/appuser/.cache/trivy`. They take about 3 GB, and another 3 GB while a refresh
  downloads a new copy. Without `scanner.persistence.enabled` the cache is an `emptyDir` and the scanner downloads the
  databases again at every start. The default size of the claim, `2Gi`, is too small: set `scanner.persistence.size` to at least
  `8Gi`, as above.
- **Scanner and Repsy have the same version.** The tags of both images default to the version of the chart, so they move
  together. Do not set one of `image.tag` and `scanner.image.tag` without the other.
- **Scans run one at a time** by default. Raise `scanner.workerCount` (`SCANNER_WORKER_COUNT`) to run more at once. The
  requests are 100m CPU and 512Mi memory, with a limit of 1Gi memory, and you can change them in `scanner.resources`.

To use a scanner that runs elsewhere, leave `scanner.enabled` off and set:

```yaml
scanner:
  external:
    enabled: true
    url: http://scanner.example.com:8090
  existingSecret: repsy-scanner     # its key `scanner-api-key` is the SCANNER_API_KEY of that scanner
```

The chart then only sets the Repsy side, and requires the key (`apiKey` or `existingSecret`) and the URL. It always sets
`DOCKER_INTERNAL_REGISTRY_BASE_URL` to the in-cluster address above and has no value to change it, so a scanner has to reach
Repsy under that name to scan Docker images. A scanner outside the cluster cannot, so it scans the other formats only.

**What the chart cannot do for the scanner.** It has no value for the environment of the scanner besides the number of workers.
The settings that a network without internet access needs, `TRIVY_DB_REPOSITORY` and `TRIVY_JAVA_DB_REPOSITORY`, cannot be
set on the bundled scanner. Run such a scanner yourself as described in
[Running Without Internet Access](../../administration/setting-up-vulnerability-scanning/#running-without-internet-access) and
connect it with `scanner.external`.

## Set Other Repsy Settings

The chart has values for the settings that depend on the cluster. Every other environment variable that Repsy reads, listed
in the [Configuration Reference](../configuration-reference/), goes into `extraEnv`, in the format of a Kubernetes container:

```yaml
extraEnv:
  - name: TRASH_RETENTION
    value: P14D
  - name: MULTIPART_MAX_FILE_SIZE
    value: 1GB
  - name: MULTIPART_MAX_REQUEST_SIZE
    value: 1GB
```

`extraEnvFrom` takes a ConfigMap or Secret whose entries all become variables. Repsy reads its settings when it starts, and a
change of the values recreates the pod. Use the same mechanism for `extraVolumes` and `extraVolumeMounts`, for `podLabels`,
`podAnnotations`, `nodeSelector`, `tolerations` and `affinity`, and for `serviceAccount`.

The chart sets `API_PORT`, `SERVER_PORT` (`service.uiPort` and `service.registryPort`), `STORAGE_BASE_PATH`, `DB_URL`,
`DB_USERNAME`, `DB_PASSWORD`, `OS_APP_JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `REPO_BASE_URL`, `API_BASE_URL`,
`APP_ALLOWED_ORIGINS` and the settings of the scanner and the HTTPS listeners itself, when you give the matching values. Do not
set these in `extraEnv` as well. The Service type is `ClusterIP`; `service.type` also
accepts `NodePort` and `LoadBalancer`.

## Back Up Before You Change Anything

Repsy keeps its state in two places, a database and the package files, and a backup needs both, taken together. See
[Persisting Data and Backups](../../administration/persisting-data-and-backups/) for what to keep. In Kubernetes, the volume
of the data is the claim `<release>`, and with PostgreSQL the database is in the claim `data-<release>-postgresql-0`.

If your storage supports volume snapshots, snapshot the claims. Otherwise take a cold backup:

```bash
# Stop Repsy first, so that nothing is writing while you copy:
kubectl --namespace repsy scale deploy/repsy-os --replicas=0
kubectl --namespace repsy wait --for=delete pod --selector app=repsy-os

# The database. With the PostgreSQL of the chart (or run pg_dump against your own database):
kubectl --namespace repsy exec repsy-os-postgresql-0 -- \
  pg_dump -U repsy -d repsy -Fc > repsy-$(date +%F).dump

# The volume. Start a pod that mounts it read-only and archive it:
cat <<'EOF' | kubectl --namespace repsy apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: repsy-backup
spec:
  securityContext:
    runAsUser: 100
    runAsGroup: 101
  containers:
    - name: backup
      image: busybox:stable
      command: ["sleep", "3600"]
      volumeMounts:
        - name: data
          mountPath: /data
          readOnly: true
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: repsy-os
EOF
kubectl --namespace repsy wait --for=condition=ready pod/repsy-backup
kubectl --namespace repsy exec repsy-backup -- tar czf - -C /data . > repsy-data-$(date +%F).tgz
kubectl --namespace repsy delete pod repsy-backup

# Start Repsy again:
kubectl --namespace repsy scale deploy/repsy-os --replicas=1
```

With the embedded H2 database the archive of the volume holds the database too, and Repsy has to be stopped for it to be
consistent. Skip the `pg_dump` step then. Keep your values file and the Secrets you created as well: they are in neither backup.

## Upgrade

Chart and application have one version, so an upgrade is a new chart version:

{{< steps >}}
### Back Up and Read the Notes

Take the backup above. Then read the notes of [Upgrading Repsy Open Source](../../administration/upgrading-repsy-open-source/)
for every release between yours and the one you install: database migrations only go forward.

### Upgrade the Release

```bash
helm upgrade repsy-os oci://repo.repsy.io/repsy/os-charts/repsy-os \
  --version <new-version> \
  --namespace repsy \
  -f values.yaml
```

Pass the same values file as before. Helm stops the old pod, starts one with the new image, and Repsy applies the database
migrations of the new release before it accepts requests. If you use the scanner, it moves to the same version in the same
command. The volume and the database are kept.

Do not use `--reuse-values`: it keeps the defaults of the old chart and hides the ones the new chart adds. Use your values file.

### Check the Result

```bash
kubectl --namespace repsy rollout status deploy/repsy-os
helm test repsy-os --namespace repsy
```

Sign in to the web UI, and download a package to be sure. If the pod does not become ready, read its log with
`kubectl --namespace repsy logs deploy/repsy-os`.
{{< /steps >}}

Any change of the pod, such as a new image, a new environment variable or new resources, recreates it. So does a changed
password or key that you give as a plain value: the chart notices it.

### Rolling Back

`helm rollback repsy-os` puts back the chart, the image and the values of an earlier revision. **It does not put back the
database.** A migration cannot be undone, and an older Repsy does not understand a database that a newer one has migrated, so
a rollback after the new version has started leaves you with an old image on a new schema. To go back, restore the backup you
took before the upgrade, both the database and the volume, and then install the old chart version on it. Everything written
after the backup is lost. See [Rolling Back](../../administration/upgrading-repsy-open-source/#rolling-back).

## Uninstalling and Data Retention

```bash
helm uninstall repsy-os --namespace repsy
```

Which of your data this deletes depends on where it is:

| What | After `helm uninstall` |
| --- | --- |
| The Deployment, the Service, the Ingress and the scanner | Deleted. |
| The Secret of the release | **Deleted**, with the generated session secret and the generated passwords in it. Your own Secrets stay. |
| The volume claim `<release>` with the packages, and the H2 database | **Deleted**, and with it the volume, unless the class of the volume keeps it (`reclaimPolicy: Retain`) or you set `persistence.annotations` to `helm.sh/resource-policy: keep`. |
| The volume claim `data-<release>-postgresql-0` of the PostgreSQL of the chart | **Kept.** Kubernetes does not delete the claims that a StatefulSet created, and Helm does not know them. |
| The volume claim of the scanner cache | Deleted. |
| The `helm test` pod | Kept until you delete it. |

To keep the packages and the database when you remove a release, set the annotation before you uninstall (`helm upgrade` adds
it to the existing claim):

```yaml
persistence:
  annotations:
    helm.sh/resource-policy: keep
```

To use a kept volume again, install with the name of the claim. The claim of the PostgreSQL of the chart is found again by its
name if the release has the same name, but the database also needs the password it was created with, which you read from the
Secret **before** you uninstall (`kubectl get secret repsy-os -o jsonpath='{.data.postgres-password}' | base64 -d`):

```bash
helm install repsy-os oci://repo.repsy.io/repsy/os-charts/repsy-os \
  --version 26.10.0 --namespace repsy \
  --set persistence.existingClaim=repsy-os \
  --set postgresql.enabled=true \
  --set postgresql.auth.password='<the-old-password>'
```

The users, repositories and packages are still there afterwards. A kept volume is not deleted by anything else: to remove the
data for good, delete the claims yourself:

```bash
kubectl --namespace repsy delete pvc repsy-os data-repsy-os-postgresql-0
kubectl --namespace repsy delete pod repsy-os-test-connection
```

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `helm install` stops with `needs ingress.hosts.panel and ingress.hosts.repo`, `must differ`, `choose one database` or another message that names a value | The chart checks its values before it installs anything, and the message names the value to fix. |
| The volume claim stays `Pending` and so does the pod | The cluster has no default StorageClass, or the class you named does not exist. Check `kubectl get storageclass`, and set `persistence.storageClass`. |
| The pod restarts again and again and its log has `initial-password does not meet complexity requirements` | The admin password has no uppercase letter, lowercase letter or digit, or contains whitespace. Fix `admin.initialPassword` or the Secret. See [Troubleshooting](../../administration/troubleshooting/#invalid-admin_initial_password). |
| The pod shows `CreateContainerConfigError` | A Secret or a key that the chart reads does not exist. `kubectl describe pod` names it. For your own database, see [Your Own PostgreSQL](#your-own-postgresql). |
| `ImagePullBackOff` | The image or its tag does not exist, or the cluster cannot reach `repo.repsy.io`. Check the version you passed to `--version` and `image.tag`, and use `imagePullSecrets` for a private mirror. |
| The pod does not start and the log has `Failed to obtain JDBC Connection` | The database is not reachable or the credentials are wrong. See [Troubleshooting](../../administration/troubleshooting/#the-database-is-not-reachable). After a reinstall with the PostgreSQL of the chart, the password of the old volume no longer matches a newly generated one: set `postgresql.auth.password` to the old one. |
| The pod is killed during an upgrade and starts again | The migrations took longer than the startup probe allows (five minutes). Raise `startupProbe.failureThreshold`. |
| Everybody is signed out after each upgrade or restart | The session secret changes. It does when you render the chart with Argo CD or `helm template`. Give `auth.jwtSecret.existingSecret`. See [Troubleshooting](../../administration/troubleshooting/#everyone-is-signed-out-after-a-restart). |
| The web UI shows `http://localhost:9090` in its snippets | `REPO_BASE_URL` is not set. Enable the ingress with a repo host, or set `config.repoBaseUrl`. |
| `docker login` fails, or clients are sent to `http://` addresses | The controller does not send the `X-Forwarded-*` headers, or the repo host has no HTTPS. See [Tell Repsy Its Public Address](#tell-repsy-its-public-address). |
| Uploads fail with `413 Request Entity Too Large` | The controller refuses the size before Repsy sees it, or a limit of Repsy applies. See [Expose Repsy with an Ingress](#expose-repsy-with-an-ingress). |
| Uploads fail because the node runs out of space | Repsy copies uploads to `/tmp`, in the writable layer. Give it a volume, see [Where the Data Lives](#where-the-data-lives). |
| The scanner pod is `Ready` but scans fail | It may still be downloading the vulnerability databases, which takes a few minutes on the first start. Read `kubectl logs deploy/repsy-os-scanner`, and see [When a Scan Fails](../../administration/setting-up-vulnerability-scanning/#when-a-scan-fails). |

## What the Chart Does Not Do

- **It does not run more than one Repsy pod.** There is no replica count, and the volume is `ReadWriteOnce`.
- **It does not move data between the embedded H2 database and PostgreSQL.**
- **It has no backups.** Neither the volume nor the PostgreSQL of the chart are backed up by it.
- **It cannot set the environment of the bundled scanner,** apart from the number of workers, see
  [Add Vulnerability Scanning](#add-vulnerability-scanning).
- **It does not create certificates,** network policies or monitoring resources.

Anything else that a Kubernetes manifest could express, and that you need, has to be added around the chart, for example with a
post-renderer of Helm or Kustomize.

## Next Steps

- Create the repositories your teams need, see [Creating Your First Repository](../../getting-started/creating-your-first-repository/).
- Read [Persisting Data and Backups](../../administration/persisting-data-and-backups/) and plan the backups.
- The [Configuration Reference](../configuration-reference/) lists every setting for `extraEnv`.
