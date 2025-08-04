+++
title = "Npm"
weight = 92
+++

# NPM Proxy

Repsy's NPM Proxy feature allows your NPM repositories to act as intelligent proxies to external NPM registries like `npmjs.org`, private npm registries, and other package sources. This enables you to cache and control access to external NPM packages while maintaining a unified interface for your development teams.

## What is NPM Proxy?

An NPM proxy repository acts as an intermediary between your npm clients and external registries. When you install a package that doesn't exist locally, the proxy automatically fetches it from the configured upstream registries and caches it for future use.

## Setting Up NPM Proxy

### Configuring Proxy Sources

You can configure multiple upstream registries with different priorities:

**NPM Registry (Public)**
```
Proxy URL: https://registry.npmjs.org
```

**Private NPM Registry**
```
Proxy URL: https://npm.your-company.com/repository/npm-private/
Username: your-username
Password: your-password
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

## How NPM Proxy Works

### Package Installation Flow

1. **Client Request**: npm client requests a package from your Repsy repository
2. **Local Check**: Repsy checks if the package exists in local storage
3. **Proxy Fallback**: If not found locally, Repsy queries configured proxies in priority order
4. **Authentication**: Handles authentication with upstream registries automatically
5. **Caching**: Downloads and caches the package for future requests
6. **Response**: Returns the package to the npm client

### Priority System

Proxies are queried in order of priority. If the first proxy fails or doesn't have the package, the next proxy is tried automatically.

## Best Practices

- Set appropriate priorities based on package availability and speed
- Disable unused proxies to reduce latency and avoid timeouts
- Regularly update credentials for private registries

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting NPM proxy functionality.
