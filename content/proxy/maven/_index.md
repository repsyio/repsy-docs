+++
title = "Maven"
weight = 91
+++
# Maven Proxy

Repsy's Maven Proxy feature allows your Maven repositories to act as intelligent proxies to external repositories such as `Maven Central` or your organization's internal artifact servers.

## What is Maven Proxy?

A Maven proxy repository acts as a bridge between your Maven clients and remote repositories. When your project requests an artifact that isn't available in `Repsy`, the proxy automatically fetches it from configured upstream repositories, caches it locally, and serves it to the client.

## Setting Up Maven Proxy

### Configuring Proxy Sources

You can configure multiple upstream repositories, each with a custom priority:

**Maven Central (Public)**
```
Proxy URL: https://repo.maven.apache.org/maven2
```

**Internal Maven Repository (Private)**
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

1. **Client Request**: Maven client requests a specific artifact from your Repsy repository
2. **Local Check**: Repsy checks if the artifact exists in local storage
3. **Proxy Fallback**: If not found, Repsy queries upstream proxies in priority order
4. **Authentication**: Credentials are used if the proxy requires authentication
5. **Caching**: Once downloaded, the artifact is cached in Repsy for future requests
6. **Response**: The artifact is served to the Maven client

### Priority System

Proxies are queried in order of priority. If the first proxy fails or doesn't have the artifact, the next proxy is tried automatically.

## Best Practices

- Set appropriate priorities based on artifact availability and speed
- Disable unused proxies to reduce latency and avoid timeouts
- Regularly update credentials for private registries

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Maven proxy functionality.
