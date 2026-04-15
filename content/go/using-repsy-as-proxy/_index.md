+++
title = "Using Repsy as Proxy"
weight = 65
+++

# Go Proxy

Repsy's Go Proxy feature allows your Go module repositories to act as intelligent proxies to external Go module proxies such as proxy.golang.org or private module proxies.

A Go proxy repository acts as an intermediary between your Go toolchain and external module sources. When you request a module that doesn't exist locally, the proxy automatically fetches it from the configured upstream proxies and caches it for future use.

### Setting Up Go Proxy

## Configuring Proxy Sources

You can configure multiple upstream proxies with different priorities:

**Public Go Module Proxy**
```
Proxy URL: https://proxy.golang.org
```

**Private Go Module Proxy**
```
Proxy URL: https://go.mycompany.com/repository/go-private/
Username: your-username
Password: your-password
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

### How Go Proxy Works

## Module Download Flow

1. **Client Request**: Go toolchain requests a module from your `Repsy` repository.
2. **Local Check**: `Repsy` checks if the module version exists in local storage.
3. **Proxy Fallback**: If not found locally, `Repsy` queries configured proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the module for future requests.
6. **Response**: Returns the module to the Go toolchain.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or doesn't contain the requested module, the next proxy in line is automatically tried.
You can easily change the order of the proxies to customize the resolution priority.

### Best Practices

- Set appropriate priorities based on module availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private proxies.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Go proxy functionality.
