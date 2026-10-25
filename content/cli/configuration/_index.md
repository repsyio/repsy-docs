+++
title = "Configuration"
weight = 40
description = "Where the rp command line client keeps its configuration: config.yml, hosts.yml, their location, file mode and the rp config commands."
+++

`rp` keeps two files in its configuration directory.

| File | Content |
| --- | --- |
| `config.yml` | `current_host`, the profile used when no host is given. |
| `hosts.yml` | One profile per host: `product`, `api_url`, `registry_url`, `web_url`, `owner`, and the result of the last `rp profile doctor`. |

## Location

The configuration directory is, in this order:

1. `$REPSY_CONFIG_DIR`,
2. `$XDG_CONFIG_HOME/repsy`, only when `XDG_CONFIG_HOME` is an absolute path,
3. `~/.config/repsy`.

The same rule applies on every platform.

## File mode and content

- The files are written atomically with mode `0600`.
- Tokens are never stored in these files. A token written there by hand is ignored.
- A key that `rp` does not know is kept and written back unchanged when the file is rewritten. YAML comments are not preserved.

## Commands

- [`rp config list`](../reference/rp-config-list/) shows the effective settings.
- [`rp config get`](../reference/rp-config-get/) prints one effective value.
- [`rp config set`](../reference/rp-config-set/) stores a setting. The keys are `current_host`, `product`, `api_url`, `registry_url`, `web_url` and `owner`.
- [`rp profile`](../reference/rp-profile/) manages the profiles in `hosts.yml`.

How flags, environment variables and the stored profile combine is described in [Profiles and hosts](../profiles-and-hosts/#precedence-of-a-field).
