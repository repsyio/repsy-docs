+++
title = "Using Repsy as Proxy"
weight = 95
+++

# Ruby Proxy

Repsy's Ruby Proxy feature allows your Ruby repositories to act as intelligent proxies to external gem sources such as rubygems.org or private repositories.

A Ruby proxy repository acts as an intermediary between Bundler and external gem sources. When Bundler requests a gem that does not exist locally, the proxy automatically fetches it from the configured upstream sources and caches it for future use.

> **Important:** Only **Bundler** (`bundle install`) is supported in proxy mode. The `gem install` command relies on the legacy `specs.4.8.gz` index, which is not served by the Repsy proxy. Use `bundle install` with a `Gemfile` for all proxy-backed installations.

## Setting Up Ruby Proxy

### Configuring Proxy Sources

You can configure multiple upstream sources with different priorities:

**Public RubyGems Source**
```
Proxy URL: https://rubygems.org
```

**Private Ruby Repository**
```
Proxy URL: https://gems.yourcompany.com
Username: your-username
Password: your-password
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

## How Ruby Proxy Works

### Package Resolution Flow

1. **Client Request**: Bundler requests a gem from your `Repsy` repository via the Compact Index protocol.
2. **Local Check**: `Repsy` checks if the gem exists in local storage.
3. **Proxy Fallback**: If not found locally, `Repsy` queries configured proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the gem for future requests.
6. **Response**: Returns the gem to the client.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or does not contain the requested gem, the next proxy in line is automatically tried.
You can easily change the order of the proxies to customize the resolution priority.

### Best Practices

- Set appropriate priorities based on gem availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private sources.
- Point your `Gemfile` source to your Repsy repository URL — proxy resolution happens transparently on the server side. Do not use `gem install --source` with a proxy repository; use `bundle install` instead.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Ruby proxy functionality.
