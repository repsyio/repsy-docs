+++
title = "Using Repsy as Proxy"
weight = 75
+++

# NuGet Proxy

Repsy's NuGet Proxy feature allows your NuGet repositories to act as intelligent proxies to external NuGet feeds such as nuget.org or private feeds.

A NuGet proxy repository acts as an intermediary between your NuGet clients and external feeds. When you request a package that does not exist locally, the proxy automatically fetches it from configured upstream feeds and caches it for future use.

## Setting Up NuGet Proxy

### Configuring Proxy Sources

You can configure multiple upstream feeds with different priorities:

**Public NuGet Feed**
```
Proxy URL: https://api.nuget.org/v3/index.json
```

**Private NuGet Feed**
```
Proxy URL: https://nuget.yourcompany.com/v3/index.json
Username: your-username
Password: your-token
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 25000ms)
- **Active Status**: Enable or disable the proxy

## How NuGet Proxy Works

### Package Resolution Flow

1. **Client Request**: NuGet client requests a package from your `Repsy` repository.
2. **Local Check**: `Repsy` checks if the package exists in local storage.
3. **Proxy Fallback**: If not found locally, `Repsy` queries configured proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the package for future requests.
6. **Response**: Returns the package metadata and `.nupkg` artifact to the NuGet client.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or does not contain the requested package, the next proxy in line is automatically tried.
You can easily change the order of the proxies to customize the resolution priority.

### Best Practices

- Set appropriate priorities based on package availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private feeds.
- Point your `NuGet.Config` to your Repsy repository URL — proxy resolution happens transparently on the server side.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting NuGet proxy functionality.
