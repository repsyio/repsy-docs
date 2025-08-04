+++
title = "Docker"
weight = 94
+++
# Docker Proxy

Repsy's Docker Proxy feature allows your Docker repositories to act as intelligent proxies to external Docker registries like `Docker Hub`, `GitLab Container Registry` and other private registries. This enables you to cache and control access to external Docker images while maintaining a unified interface for your development teams.

## What is Docker Proxy?

A Docker proxy repository acts as an intermediary between your Docker clients and external registries. When you pull an image that doesn't exist in `Repsy`, the proxy automatically fetches it from the configured upstream registries and caches it for future use.

### Setting Up Docker Proxy

## Configuring Proxy Sources

You can configure multiple upstream registries with different priorities:

**Docker Hub (Public)**
```
Proxy URL: https://registry-1.docker.io
```

**Internal Docker Registry (Private)**
```
Proxy URL: https://docker.yourcompany.com
Username: your-username
Password: your-token
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

## How Docker Proxy Works

### Image Pull Flow

1. **Client Request**: Docker client requests an image from your Repsy repository
2. **Local Check**: Repsy checks if the image exists in local storage
3. **Proxy Fallback**: If not found locally, Repsy queries configured proxies in priority order
4. **Authentication**: Handles authentication with upstream registries automatically
5. **Caching**: Downloads and caches the image for future requests
6. **Response**: Returns the image to the Docker client

### Priority System

Proxies are queried in order of priority. If the first proxy fails or doesn't have the image, the next proxy is tried automatically.

## Best Practices

- Set appropriate priorities based on image availability and speed
- Disable unused proxies to reduce latency and avoid timeouts
- Regularly update credentials for private registries

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Docker proxy functionality.
