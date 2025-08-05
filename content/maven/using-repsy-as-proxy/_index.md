+++
title = "Using Repsy as Proxy"
weight = 26
+++

# Maven Proxy

Repsy's Maven Proxy feature allows your Maven repositories to act as intelligent proxies to external repositories such as Maven Central or private repositories.

A Maven proxy repository acts as an intermediary between your Maven clients and external repositories. When your project requests an artifact that doesn't exist locally, the proxy automatically fetches it from the configured upstream repositories and caches it for future use.

### Setting Up Maven Proxy

## Configuring Proxy Sources

You can configure multiple upstream repositories, each with a custom priority:

**Public Maven Repository**
```
Proxy URL: https://repo.maven.apache.org/maven2
```

**Private Maven Repository**
```
Proxy URL: https://maven.yourcompany.com/repository/maven-private/
Username: your-username
Password: your-password
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

### How Maven Proxy Works

## Dependency Resolution Flow
1. **Client Request**: Maven client requests a specific artifact from your `Repsy` repository.
2. **Local Check**: `Repsy` checks if the artifact exists in local storage.
3. **Proxy Fallback**: If not found locally, `Repsy` queries configured proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the package for future requests.
6. **Response**: The artifact is served to the Maven client.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or doesn't contain the requested artifact, the next proxy in line is automatically tried.
You can easily change the order of the proxies to customize the resolution priority.
### Best Practices

- Set appropriate priorities based on artifact availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private registries.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Maven proxy functionality.
