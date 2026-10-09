+++
title = "Profiles and Hosts"
weight = 30
description = "How the rp command line client addresses Repsy Cloud and self-hosted Repsy OS: profiles, host names and schemes, custom domains and URL precedence."
+++

A profile stores everything `rp` needs to talk to one Repsy host. Profiles are kept in `hosts.yml`, keyed by host name; the one used when you name no host is `current_host` in `config.yml` (see [Configuration](../configuration/)).

Manage profiles with [`rp profile`](../reference/rp-profile/): `add`, `list`, `use`, `remove` and `doctor`.

## Selecting a host

The host of a command is, in this order:

1. the `--hostname` flag,
2. the `REPSY_HOST` environment variable,
3. `current_host` in `config.yml`.

If none is set, the command fails and asks you to pass `--hostname`, set `REPSY_HOST` or log in first.

A host is a name with an optional scheme and port, such as `repsy.io`, `https://repsy.example.com` or `10.0.0.5:8080`. It must not contain credentials, a path, a query or a fragment.

## Schemes

- A bare host is `https`.
- `http` is used only when you write `http://`.
- `http` on a loopback host (`localhost`, an address in `127.0.0.0/8`, or `::1`) is silent.
- `http` on any other host is accepted, with a warning on standard error that credentials and requests are sent in clear text.

## Repsy Cloud

The Cloud hosts are known to `rp`, and their URLs are derived:

| Host | API | Registry (protocols) | Web |
| --- | --- | --- | --- |
| `repsy.io` | `https://api.repsy.io` | `https://repo.repsy.io` | `https://repsy.io` |
| `dev.repsy.io` | `https://api-dev.repsy.io` | `https://repo-dev.repsy.io` | `https://dev.repsy.io` |

Cloud serves the panel API and the package protocols on separate hosts, and its protocol URLs may carry an owner segment. `--owner` sets it; `--owner=` (empty) means none. `rp profile doctor --repo <name>` can detect which variant a host uses.

## Self-hosted Repsy OS

Any host that is not a known Cloud host is treated as Repsy OS. Its panel API also serves the panel UI, and the protocols run on the same host on another port. Default ports:

| Scheme | Panel API and UI | Protocols |
| --- | --- | --- |
| `https` | 8443 | 9443 |
| `http` | 8080 | 9090 |

A port you write in the host is the panel port; the protocol port keeps its default. Override any URL with `--api-url`, `--registry-url` or `--web-url`.

## Custom domains

A Cloud custom domain looks like Repsy OS to `rp`, because only the known hosts are recognised by name. Tell `rp` explicitly:

```bash
rp profile add <custom-domain> --type cloud \
  --api-url <api-url> --registry-url <registry-url> --web-url <web-url>
```

For a host forced to Cloud that is not a known one, no URL is derived, so the three URLs must be given. The web URL may stay empty until it is set. `--type os|cloud` (or `REPSY_TYPE`) overrides the detection for any host.

## Precedence of a field

For each of product, API URL, registry URL, web URL and owner, the first of these wins:

1. the command line flag,
2. the environment variable,
3. the stored profile,
4. the value derived from the host.

`rp profile add` stores the derived values as they are at that moment. Environment variables are not stored.
