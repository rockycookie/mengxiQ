# Fix: Mixed Content Error When Accessing RaspberryPi App from Another Machine

## Problem

When accessing the app over HTTPS (e.g., `https://raspberrypi.local:3019`) from a browser on another machine (e.g., Windows), the browser blocks all API calls with:

```
ERR_CONNECTION_REFUSED
TypeError: Failed to fetch
```

**Root cause:** The React app is served over HTTPS, but the backend API calls (json-server on ports 8001/8002, Meilisearch on port 8011) use plain `http://`. Modern browsers enforce the **Mixed Content** policy — they block HTTP sub-requests made from an HTTPS page.

## Solution: nginx Reverse Proxy with SSL

Install nginx on the RaspberryPi and proxy all services (app + APIs) under a single HTTPS endpoint. The browser only ever speaks HTTPS to nginx; nginx forwards to the internal HTTP services.

### 1. Install nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. Create the nginx site config

```bash
sudo nano /etc/nginx/sites-available/mengxiq
```

Paste the following (replace cert paths as needed):

```nginx
server {
    listen 443 ssl;
    server_name raspberrypi.local;

    ssl_certificate     /home/admin/workspace/mengxiq/certs/cert.pem;
    ssl_certificate_key /home/admin/workspace/mengxiq/certs/key.pem;

    # React app (served by http-server on port 3019)
    location / {
        proxy_pass http://127.0.0.1:3019;
        proxy_set_header Host $host;
    }

    # Queue DB (json-server on port 8002)
    location /api/db/ {
        proxy_pass http://127.0.0.1:8002/;
        proxy_set_header Host $host;
    }

    # Report DB (json-server on port 8001)
    location /api/report/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_set_header Host $host;
    }

    # Meilisearch (port 8011)
    location /api/search/ {
        proxy_pass http://127.0.0.1:8011/;
        proxy_set_header Host $host;
    }
}

# Optional: redirect HTTP to HTTPS
server {
    listen 80;
    server_name raspberrypi.local;
    return 301 https://$host$request_uri;
}
```

### 3. Enable the site and reload nginx

```bash
sudo ln -s /etc/nginx/sites-available/mengxiq /etc/nginx/sites-enabled/mengxiq
sudo nginx -t        # verify config
sudo systemctl reload nginx
```

### 4. Update `pm2-raspberrypi.config.js`

With nginx handling SSL and acting as the public entry point, the internal services must:
- **Drop SSL** from `http-server` (nginx does TLS termination now)
- **Bind to `127.0.0.1`** instead of `0.0.0.0` so they're not directly reachable from the network

```js
// mengxiq-app: remove --ssl flags, bind to 127.0.0.1
{
  name: 'mengxiq-app',
  script: 'npx',
  args: 'http-server mgq-raspberrypi -p 3019 -a 127.0.0.1',  // no --ssl
  ...
}

// json-server instances: change --host 0.0.0.0 → 127.0.0.1
{
  name: 'life2026-db',
  script: 'npx',
  args: 'json-server@0.17.4 --watch life2026.json --port 8002 --host 127.0.0.1',
  ...
}
{
  name: 'report2026-db',
  script: 'npx',
  args: 'json-server@0.17.4 --watch report2026.json --port 8001 --host 127.0.0.1',
  ...
}

// meilisearch is already bound to 0.0.0.0:8011 — change to 127.0.0.1:8011
{
  name: 'meilisearch',
  script: 'meilisearch',
  args: '--db-path /home/admin11/workspace/meilisearch/data --http-addr 127.0.0.1:8011',
  ...
}
```

After editing, redeploy the config to PM2 on the Pi:
```bash
pm2 delete all
pm2 start pm2-raspberrypi.config.js
pm2 save
```

### 5. Update the React app source

The frontend must use the new `/api/...` paths instead of direct ports. Update these three files before rebuilding:

**`mengxiq/src/db/JsonServer.ts`** — change:
```ts
const db_url = `http://${API_HOSTNAME}:8002`;
```
to:
```ts
const db_url = `https://${API_HOSTNAME}/api/db`;
```

**`mengxiq/src/db/ReportJsonServer.ts`** — change the report DB URL similarly to:
```ts
const report_url = `https://${API_HOSTNAME}/api/report`;
```

**`mengxiq/src/db/MeilisearchService.ts`** — change:
```ts
const SEARCH_URL = `http://${SEARCH_HOSTNAME}:8011`;
```
to:
```ts
const SEARCH_URL = `https://${SEARCH_HOSTNAME}/api/search`;
```

### 6. Rebuild and redeploy

```bash
cd mengxiq
npm run build:raspberrypi
```

Then transfer `mgq-raspberrypi/` to the RaspberryPi as usual (see [DEPLOY_RASPBERRYPI.md](../deploy/DEPLOY_RASPBERRYPI.md)).

### 7. Access the app

```
https://raspberrypi.local/
```

(nginx listens on standard port 443, no port number needed in the URL.)

> **Note:** The self-signed cert will still show a browser warning. You need to accept it once per browser/device. To avoid this permanently, use a cert signed by a local CA trusted on all your devices.
