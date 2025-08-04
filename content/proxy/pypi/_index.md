+++
title = "Pypi"
weight = 93
+++

# PyPI Proxy

Repsy's PyPI Proxy feature allows your PyPI repositories to act as intelligent proxies to external repositories such as `pypi.org` or your organization's internal package servers.

## What is PyPI Proxy?

A PyPI proxy repository acts as a bridge between your Python clients and remote repositories. When your project requests a package that isn't available in `Repsy`, the proxy automatically fetches it from configured upstream repositories, caches it locally, and serves it to the client.

### Setting Up PyPI Proxy

## Configuring Proxy Sources

You can configure multiple upstream repositories, each with a custom priority:

**PyPI.org (Public)**
```
Proxy URL: https://pypi.org/
```

**Internal PyPI Repository (Private)**
```
Proxy URL: https://pypi.mycompany.com/repository/pypi-private/
Username: your-username
Password: your-password
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

### How PyPI Proxy Works

## Package Installation Flow

1. **Client Request**: pip client requests a specific package from your `Repsy` repository.
2. **Local Check**: `Repsy` checks if the package exists in local storage.
3. **Proxy Fallback**: If not found, `Repsy` queries upstream proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the package for future requests.
6. **Response**: The package is served to the pip client.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or doesn't have the package, the next proxy is tried automatically.

### Best Practices

- Set appropriate priorities based on package availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private registries.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting PyPI proxy functionality.
