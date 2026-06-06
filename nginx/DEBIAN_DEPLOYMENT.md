# Nginx Deployment Guide for Debian (RaspberryPi)

## Install

```bash
sudo apt update
sudo apt install nginx
```

## Run via PM2 (not systemd)

PM2 manages nginx so all services are under one process manager. Disable the system service first:

```bash
sudo systemctl disable nginx
sudo systemctl stop nginx
```

## Grant permission to bind port 3019

Ports below 1024 require root; for higher ports this is only needed if you use them. Since 3019 > 1024, no special permission is needed.

> If you ever switch back to port 443, run:
> ```bash
> sudo setcap 'cap_net_bind_service=+ep' $(which nginx)
> ```
> Note: re-run after any `apt upgrade nginx` since the binary gets replaced.

## Deploy config

Transfer `nginx.conf` and create the runtime dirs:

```bash
scp nginx/nginx.conf admin11@raspberrypi.local:/home/admin11/workspace/mengxiq/nginx/nginx.conf
```

On the Pi:
```bash
mkdir -p /home/admin11/workspace/mengxiq/nginx/real_nginx/logs
```

## Start via PM2

nginx is included in `deploy/pm2-raspberrypi.config.js` and starts automatically with:

```bash
pm2 start pm2-raspberrypi.config.js
```

## Verify

```bash
pm2 logs nginx
# Should show: nginx: the configuration file ... syntax is ok
```

Test config manually:
```bash
nginx -t -c /home/admin11/workspace/mengxiq/nginx/nginx.conf
```
