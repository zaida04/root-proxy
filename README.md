# Root Proxy

A lightweight proxy service that forwards Root platform events to Redis for distributed processing.

## Features

- Listens to Root app events
- Forwards events to Redis pub/sub

## Prerequisites

- Node.js 22 or higher
- Redis instance

## Docker

This is mostly used for development purposes. For production, you should actually publish to Root cloud.

### Run

You will need to mount your `root-manifest.json` file and set the `REDIS_URL` environment variable:

```bash
docker run \
  -v /path/to/your/root-manifest.json:/app/root-manifest.json \
  -e REDIS_URL=redis://your-redis:6379 \
  ghcr.io/zaida04/root-proxy:latest
```

## License

MIT

