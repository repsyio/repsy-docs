+++
title = "Running Behind a Reverse Proxy"
weight = 162
+++

# Running Behind a Reverse Proxy

A reverse proxy in front of Repsy Open Source gives you a public host name, TLS certificates from your usual tooling,
and one place for access logs. This page shows what Repsy needs to know about the proxy and gives working setups for
nginx, Caddy and Traefik.

## The setup

Repsy listens on two HTTP ports, and the proxy needs a route for each:

| Upstream | Port | What it serves |
| --- | --- | --- |
| Web UI | `8080` | The web UI and the API it calls. |
| Package protocols | `9090` | Maven, npm, PyPI, Docker, Cargo, Go, Helm, NuGet and Ruby clients. |

Give each its own host name, for example `repsy.example.com` for the web UI and `repo.example.com` for the packages. Both
use URLs that start with a repository name, so a proxy cannot tell them apart by path, and the web UI expects to be
served from the root of its host. Repsy itself needs no configuration for the host names beyond the two addresses below.

Repsy uses no WebSocket or streaming connections, so the proxy needs no upgrade headers.

## Tell Repsy its public addresses

Two variables tell Repsy how the outside world reaches it. Both are read when the container starts, so recreate the
container after changing them.

| Variable | Default | Set it to |
| --- | --- | --- |
| `REPO_BASE_URL` | `http://localhost:9090` | The public address of the package protocols, for example `https://repo.example.com`. |
| `API_BASE_URL` | empty | Leave it empty. |

- **`REPO_BASE_URL`** is the address the web UI prints in its connection snippets (`docker login`, `mvn`, `npm` and so
  on). It is also the address the npm registry writes into the `dist.tarball` of every package version it serves. Leave
  it at the default and every snippet points at `http://localhost:9090`, which is wrong for everyone but you.
- **`API_BASE_URL`** is the address the web UI uses to reach its API. Empty means the same host that served the web UI,
  which is what you want behind a proxy. Set it only if the API is served from a different host than the web UI. The
  browser then makes cross-origin calls, and you have to set `APP_ALLOWED_ORIGINS` as described in
  [Security Headers and CORS](../security-headers-and-cors/).

## Forward the client's address, scheme and host

Repsy trusts the standard forwarded headers of a proxy it knows: `X-Forwarded-Proto`, `X-Forwarded-Host`,
`X-Forwarded-Port` and `X-Forwarded-For`. It uses them to work out the address a client called, and that address ends up
in responses:

- **Docker** answers an unauthenticated request with the URL of its token endpoint and answers a layer upload with the
  URL to continue the upload at. Both are built from the request. Without the headers, a client reaching Repsy through
  `https://repo.example.com` is sent to `http://repo.example.com/v2/token`, and `docker login` fails.
- **PyPI** builds the links of its simple index the same way.
- **npm** builds its tarball addresses the same way, unless `REPO_BASE_URL` is set, in which case that value wins.
- **The failed-login limit** counts failed logins per client address, which behind a proxy is the address the proxy puts
  in `X-Forwarded-For`. See [Authenticating from CI](../authenticating-from-ci/).

Repsy honours these headers only when the request comes from a trusted proxy. By default that is every private and
loopback address, which covers a proxy on the same host, in the same Docker network or on your LAN. If your proxy
connects from a public address, list it in `SERVER_TOMCAT_REMOTEIP_INTERNAL_PROXIES` (a regular expression that matches
the proxy's address). The proxy must also append the connecting client to `X-Forwarded-For` rather than pass on what it
received, or a client can choose the address it is counted under.

## nginx

The two server blocks below terminate TLS and forward to a Repsy container that is reachable as `repsy` (for example in
the same Docker network):

```nginx
server {
  listen 443 ssl;
  server_name repsy.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  location / {
    proxy_pass http://repsy:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}

server {
  listen 443 ssl;
  server_name repo.example.com;

  ssl_certificate     /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;

  # Packages and image layers are large. nginx refuses request bodies over 1 MB by default.
  client_max_body_size 0;
  # Pass an upload on while it arrives instead of writing it to the proxy's disk first.
  proxy_request_buffering off;
  proxy_http_version 1.1;
  # Repsy checks and stores an upload after it has received it. Give very large uploads time.
  proxy_read_timeout 600s;
  proxy_send_timeout 600s;

  location / {
    proxy_pass http://repsy:9090;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

`client_max_body_size 0` switches nginx's own limit off so that Repsy's limits decide. Without it, nginx answers `413
Request Entity Too Large` to every upload over 1 MB before Repsy sees it.

## Caddy

Caddy's `reverse_proxy` sends the forwarded headers and applies no request size limit by default, so the Caddyfile is
short:

```caddyfile
repsy.example.com {
  reverse_proxy repsy:8080
}

repo.example.com {
  reverse_proxy repsy:9090
}
```

Caddy gets and renews the certificates for both names on its own.

## Traefik

Traefik also sends the forwarded headers by default and applies no size limit. This example uses the file provider; with
the Docker or Kubernetes provider, create the same two routers and services with labels or an `IngressRoute`.

Static configuration (`traefik.yml`):

```yaml
entryPoints:
  websecure:
    address: ":443"
providers:
  file:
    filename: /etc/traefik/dynamic.yml
```

Dynamic configuration (`dynamic.yml`):

```yaml
http:
  routers:
    repsy-web:
      rule: Host(`repsy.example.com`)
      entryPoints: [websecure]
      service: repsy-web
      tls: {}
    repsy-repo:
      rule: Host(`repo.example.com`)
      entryPoints: [websecure]
      service: repsy-repo
      tls: {}
  services:
    repsy-web:
      loadBalancer:
        servers:
          - url: http://repsy:8080
    repsy-repo:
      loadBalancer:
        servers:
          - url: http://repsy:9090

tls:
  certificates:
    - certFile: /certs/fullchain.pem
      keyFile: /certs/privkey.pem
```

## Large uploads

Three limits decide how large an upload may be, and the smallest one wins:

- **The proxy.** nginx refuses bodies over 1 MB unless you raise `client_max_body_size`. Check the equivalent setting of
  any other proxy or load balancer in the path, including a cloud load balancer.
- **Repsy.** Some protocols have a size limit that answers `413 Request Entity Too Large`. The limits and the variables
  that change them are listed in [Managing Storage and Cleanup](../managing-storage-and-cleanup/#upload-size-limits).
- **The disk.** Repsy copies an upload to a temporary file while it checks it. See
  [Disk space](../managing-storage-and-cleanup/#disk-space).

Repsy gives up on a connection on which nothing arrives for 120 seconds.

## Compression

Repsy compresses JSON answers of the package port that are 1 KB or larger, which mainly helps npm, whose package
metadata for a package with many versions is megabytes of JSON. Tarballs, image layers and other files are never
compressed. If your proxy already compresses, turn Repsy's compression off with `SERVER_COMPRESSION_ENABLED=false`.

## Check the setup

Ask the package host for the Docker registry entry point. The `Bearer realm` in the answer must name your public
address, with `https`:

```bash
curl -i https://repo.example.com/v2/
```

```text
HTTP/2 401
www-authenticate: Bearer realm="https://repo.example.com/v2/token",service="repsy",scope="repository:*:pull"
```

If it says `http://` or an internal host name instead, the proxy is not sending the forwarded headers, or Repsy does
not trust it. Also open the web UI, look at the connection snippet of any repository, and check that it shows your
`REPO_BASE_URL`.
