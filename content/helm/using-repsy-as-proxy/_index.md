+++
title = "Using Repsy as Proxy"
weight = 85
+++

# Helm Proxy

Repsy's Helm Proxy feature allows your Helm repositories to act as intelligent proxies to external Helm chart repositories such as https://charts.helm.sh/stable or private chart repositories.

A Helm proxy repository acts as an intermediary between your Helm clients and external chart sources. When you request a chart that does not exist locally, the proxy automatically fetches it from the configured upstream repositories and caches it for future use.

### Setting Up Helm Proxy

## Configuring Proxy Sources

You can configure multiple upstream repositories with different priorities:

**Public Helm Repository**
```
Proxy URL: https://charts.helm.sh/stable
```

**Private Helm Repository**
```
Proxy URL: https://charts.yourcompany.com
Username: your-username
Password: your-password
```

### Common Configuration Options

For all proxy types, you can configure:

- **SSL Validation**: Enable/disable SSL certificate validation
- **Connection Timeout**: Set timeout in milliseconds (default: 5000ms)
- **Active Status**: Enable or disable the proxy

### How Helm Proxy Works

## Chart Resolution Flow

1. **Client Request**: Helm client requests a chart from your `Repsy` repository.
2. **Local Check**: `Repsy` checks if the chart version exists in local storage.
3. **Proxy Fallback**: If not found locally, `Repsy` queries configured proxies in priority order.
4. **Authentication**: Credentials are used if the proxy requires authentication.
5. **Caching**: Downloads and caches the chart for future requests.
6. **Response**: Returns the chart to the Helm client.

### Priority System

Proxies are queried in order of priority. If the first proxy fails or does not contain the requested chart, the next proxy in line is automatically tried.
You can easily change the order of the proxies to customize the resolution priority.

### Best Practices

- Set appropriate priorities based on chart availability and speed.
- Disable unused proxies to reduce latency and avoid timeouts.
- Regularly update credentials for private repositories.

## Need Help?

Reach out to [support@repsy.io](mailto:support@repsy.io) if you need assistance configuring or troubleshooting Helm proxy functionality.
