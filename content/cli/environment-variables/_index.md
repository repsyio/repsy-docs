+++
title = "Environment Variables"
weight = 60
description = "The environment variables the rp command line client reads: host, token, product, URLs, owner, configuration directory, proxy and color."
+++

A flag beats the matching environment variable, which beats the stored profile (see [Profiles and hosts](../profiles-and-hosts/#precedence-of-a-field)). A variable that is set but empty counts as unset, except `REPSY_OWNER`.

| Variable | Effect |
| --- | --- |
| `REPSY_HOST` | The host to use. Overridden by `--hostname`; beats `current_host`. |
| `REPSY_TOKEN` | The access token. It is not part of a profile and is never stored. |
| `REPSY_TYPE` | The product of the host, `os` or `cloud`. Overridden by `--type`. |
| `REPSY_API_URL` | Panel API URL. Overridden by `--api-url`. |
| `REPSY_REGISTRY_URL` | Protocol host URL. Overridden by `--registry-url`. |
| `REPSY_WEB_URL` | Panel UI URL. Overridden by `--web-url`. |
| `REPSY_OWNER` | Owner segment of Cloud protocol URLs. Set to an empty value it means no owner segment. Overridden by `--owner`. |
| `REPSY_CONFIG_DIR` | Directory of `config.yml` and `hosts.yml`. See [Configuration](../configuration/). |
| `XDG_CONFIG_HOME` | When absolute, the configuration directory is `$XDG_CONFIG_HOME/repsy`. |
| `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` | The standard proxy settings. Requests to `localhost` are never proxied. |
| `NO_COLOR` | When non-empty, disables colored output, like `--no-color`. |

{{% notice note %}}
The authentication commands are not available yet, so `REPSY_TOKEN` has no effect on the commands that exist today.
{{% /notice %}}
