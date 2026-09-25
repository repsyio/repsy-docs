+++
title = "Enabling HTTPS"
weight = 161
description = "Serve HTTPS directly from the instance: get a keystore, switch HTTPS on per port and make clients trust a self-signed certificate."
+++

# Enabling HTTPS

Repsy Open Source can serve HTTPS itself. HTTPS is optional and is switched on per port: it adds two ports next to the
HTTP ones and never replaces them, so the HTTP ports `8080` and `9090` stay open.

| HTTPS port | Serves | HTTP counterpart | Variable that turns it on |
| --- | --- | --- | --- |
| `8443` | The web UI | `8080` | `API_SSL_ENABLED` |
| `9443` | The package protocols (Maven, npm, Docker, ...) | `9090` | `REPO_SSL_ENABLED` |

If you already run a reverse proxy, let it terminate TLS instead and keep Repsy on plain HTTP behind it. See
[Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/).

## Why you want HTTPS

Package clients send your username and password, or a deploy token, with every request. Over plain HTTP anyone on the
network path can read them. Some clients also refuse to work without HTTPS:

- **Go** refuses to send credentials to an `http://` URL (`refusing to pass credentials to insecure URL`) and has no
  option to override this. A private Go repository is only usable over HTTPS.
- **Docker** only talks plain HTTP to a registry on the loopback address (`localhost`). For any other host it expects
  HTTPS, and `docker login` fails with `http: server gave HTTP response to HTTPS client`. See
  [Docker over plain HTTP](#docker-over-plain-http).
- **Helm** needs `--plain-http` for an OCI registry that has no HTTPS.

{{< steps >}}
### Get a keystore

Repsy reads the certificate and its private key from a Java keystore file. The default format is PKCS12; `JKS` also works
if you set the keystore type. Repsy does not read PEM files directly.

If you have a PEM certificate chain and private key, for example from Let's Encrypt or your company CA, convert them
into a PKCS12 keystore. The name `repsy` is the alias Repsy looks for by default:

```bash
openssl pkcs12 -export \
  -in fullchain.pem \
  -inkey privkey.pem \
  -name repsy \
  -out keystore.p12 \
  -passout pass:<keystore-password>
```

For a first test you can generate a self-signed certificate instead. See
[Generating a self-signed certificate](#generating-a-self-signed-certificate).

### Make the keystore readable by the container

The container runs as the non-root user `appuser`. The keystore file must be readable by that user, or Repsy fails to
start with `FileNotFoundException: ... (Permission denied)`. A file with mode `644` is enough:

```bash
chmod 644 keystore.p12
```

Mount the file read-only into `/app/certs`, a directory the image already provides for certificates.

### Start Repsy with HTTPS enabled

```bash
docker run -d \
  --name repsy \
  -p 8080:8080 -p 8443:8443 \
  -p 9090:9090 -p 9443:9443 \
  -e STORAGE_BASE_PATH=/app/data/storage \
  -v repsy-data:/app/data \
  -v "$PWD/keystore.p12:/app/certs/keystore.p12:ro" \
  -e API_SSL_ENABLED=true \
  -e API_SSL_KEY_STORE_PATH=file:/app/certs/keystore.p12 \
  -e API_SSL_KEY_STORE_PASSWORD=<keystore-password> \
  -e REPO_SSL_ENABLED=true \
  -e REPO_SSL_KEY_STORE_PATH=file:/app/certs/keystore.p12 \
  -e REPO_SSL_KEY_STORE_PASSWORD=<keystore-password> \
  -e REPO_BASE_URL=https://<your-repsy-host>:9443 \
  repo.repsy.io/repsy/os/repsy:latest
```

Both ports can use the same keystore, as here, or two different ones. Set `REPO_BASE_URL` to the HTTPS address of the
package port so that the connection snippets in the web UI, and the tarball addresses of the npm registry, use it. See
[Running Behind a Reverse Proxy](../running-behind-a-reverse-proxy/#tell-repsy-its-public-addresses).

### Check the result

Open `https://<your-repsy-host>:8443` in a browser, or check both ports from a shell:

```bash
curl -I https://<your-repsy-host>:8443/
curl -i https://<your-repsy-host>:9443/v2/
```

The first call answers `200`. The second answers `401` with a `WWW-Authenticate: Bearer realm="https://..."` header that
names your HTTPS address: that is the Docker registry asking for credentials.
{{< /steps >}}

## Settings

Each port has its own set of variables. Replace `API` with `REPO` for the package port.

| Variable | Default | Meaning |
| --- | --- | --- |
| `API_SSL_ENABLED` | `false` | Turns HTTPS on for the web UI port. |
| `API_SSL_KEY_STORE_PATH` | empty | Path of the keystore file, for example `file:/app/certs/keystore.p12`. Required when HTTPS is on. |
| `API_SSL_KEY_STORE_PASSWORD` | empty | Password of the keystore. |
| `API_SSL_KEY_STORE_TYPE` | `PKCS12` | Keystore type. `JKS` also works. |
| `API_SSL_KEY_ALIAS` | `repsy` | Alias of the key entry inside the keystore. |
| `API_SSL_KEY_PASSWORD` | empty | Password of the private key, only when it differs from the keystore password. |
| `API_SSL_PORT` | `8443` | Leave at the default. See the note below. |

`REPO_SSL_PORT` defaults to `9443`.

- **Key password.** A PKCS12 keystore created by `keytool` or `openssl` uses one password for the keystore and the key.
  Leave `*_SSL_KEY_PASSWORD` empty for it: setting a different value makes the start fail with `UnrecoverableKeyException`.
  The variable exists for keystores whose key has its own password, which is common with `JKS`.
- **Alias.** If the keystore has no entry under the alias, Repsy stops with `Alias name [<alias>] does not identify a key entry`.
  Set `*_SSL_KEY_ALIAS` to the alias `keytool -list -keystore keystore.p12` shows.
- **Renewing a certificate.** Repsy reads the keystore when it starts. After you replace the file, restart the container.

{{% notice warning %}}
Keep `API_SSL_PORT` at `8443` and `REPO_SSL_PORT` at `9443`. Repsy routes requests by the port they arrive on, and only
these two HTTPS ports are wired to the web UI and to the package protocols. With another value the connector starts, but
the routes of that port answer `404`. To serve HTTPS on a different public port, publish the container port on it, for
example `-p 443:8443`.
{{% /notice %}}

If HTTPS is enabled but the keystore is missing, unreadable or its password is wrong, Repsy does not start. The
container exits and the log ends with the reason, for example `Caused by: java.io.FileNotFoundException:
/app/certs/keystore.p12 (No such file or directory)` or `Caused by: java.io.IOException: keystore password was incorrect`.

## Generating a self-signed certificate

A self-signed certificate is fine for a first test. Clients only accept it when you tell them to trust it, so use a
certificate from a public or company CA for anything else.

```bash
keytool -genkeypair \
  -alias repsy \
  -keyalg RSA \
  -keysize 2048 \
  -storetype PKCS12 \
  -keystore keystore.p12 \
  -validity 365 \
  -storepass <keystore-password> \
  -dname "CN=<your-repsy-host>, O=Repsy" \
  -ext "SAN=DNS:<your-repsy-host>,IP:<ip-address>"
```

The `SAN` entry must contain the exact host name or IP address that clients use. Export the certificate so that clients
can trust it:

```bash
keytool -exportcert -rfc -alias repsy -keystore keystore.p12 -storepass <keystore-password> -file repsy.pem
```

## Making clients trust your certificate

With a certificate from a public CA, clients work without any change. With a self-signed or company CA certificate,
each client must be told to trust it. Without that, clients report errors such as `x509: certificate signed by unknown
authority` (Go and Docker) or `PKIX path building failed` (Java). Each tool has its own setting:

| Client | How to trust a certificate |
| --- | --- |
| curl | `curl --cacert repsy.pem https://...` |
| Docker | Copy the certificate to `/etc/docker/certs.d/<host>:<port>/ca.crt` on the machine that runs the Docker daemon. |
| Go | Set `SSL_CERT_FILE=/path/to/repsy.pem`. |
| Maven and Gradle | Import the certificate into a Java truststore and pass `-Djavax.net.ssl.trustStore=<file>`. |
| npm | Set `cafile=/path/to/repsy.pem` in `.npmrc`. |

Check the documentation of your tool for the other clients.

## Docker over plain HTTP

Prefer HTTPS for Docker. If you only evaluate Repsy on a machine that is not `localhost`, you can tell the Docker daemon
to accept plain HTTP for that registry. Add it to `/etc/docker/daemon.json` and restart the daemon:

```json
{
  "insecure-registries": ["<your-repsy-host>:9090"]
}
```

This sends credentials and images unencrypted. Do not use it for a shared or production instance.
