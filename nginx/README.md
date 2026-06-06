# Nginx

Nginx is used as a reverse proxy to serve all services (React app, json-server DBs, Meilisearch) under a single HTTPS endpoint on the RaspberryPi. This solves the **Mixed Content** browser policy that blocks HTTP API calls from an HTTPS page.

## Architecture

```
Browser (HTTPS :3019)
        │
      nginx          ← TLS termination
        ├── /            → http-server :3018  (React app)
        ├── /api/db/     → json-server  :8002  (queue DB)
        ├── /api/report/ → json-server  :8001  (report DB)
        └── /api/search/ → meilisearch  :8011
```

## Config

The site config is at [`nginx.conf`](./nginx.conf). It is deployed to the RaspberryPi and referenced by PM2.

Runtime files (pid, logs) are written to the current working directory on the Pi.

## Deployment

See [../deploy/DEBIAN_DEPLOYMENT.md](./DEBIAN_DEPLOYMENT.md) for full install steps.
