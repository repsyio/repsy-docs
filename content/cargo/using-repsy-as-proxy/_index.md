+++
title = "Using Repsy as Proxy"
weight = 65
+++

# Cargo Proxy

Repsy's Cargo Proxy feature allows your Cargo registries to act as intelligent proxies to external Cargo registries like crates.io or private registries.

A Cargo proxy registry acts as an intermediary between your Cargo clients and external registries. When you request a crate that does not exist locally, the proxy automatically fetches it from configured upstream registries and caches it for future use.

### Setting Up Cargo Proxy

## Configuring Proxy Sources

You can configure multiple upstream registries with different priorities:

**Public Cargo Source**
```
Proxy URL: https://index.crates.io
```

**Private Cargo Registry**
```
Proxy URL: https://cargo.yourcompany.com/index
Username: your-username
Password: your-token
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

### How Cargo Proxy Works

## Crate Resolution Flow

1. **Client Request**: Cargo client requests a crate from your `Repsy` registry.
2. **Local Check**: `Repsy` checks if the crate exists in local storage.
3. **Proxy Fallback**: If not found locally, `Repsy` queries configured proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the crate for future requests.
6. **Response**: Returns the crate metadata and artifacts to the Cargo client.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or does not contain the requested artifact, the next proxy in line is automatically tried.
You can easily change the order of the proxies to customize the resolution priority.

### Best Practices

- Set appropriate priorities based on crate availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private registries.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Cargo proxy functionality.
