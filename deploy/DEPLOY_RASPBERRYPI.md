# Deployment Guide for RaspberryPi

## Prerequisites
1. Install PM2 globally on RaspberryPi:
```bash
nvm use v21.1.0
npm install -g pm2
```

2. Install nginx on RaspberryPi:
```bash
sudo apt update
sudo apt install nginx
# Disable the system-managed nginx service — PM2 will own it instead
sudo systemctl disable nginx
sudo systemctl stop nginx
```

## Deployment Steps

1. **Build the React app** (from your Mac)
   ```bash
   cd mengxiq
   npm run build:raspberrypi
   cd ..
   ```

2. **Transfer files to RaspberryPi**
   ```bash
   scp life2026.json admin@raspberrypi.local:/home/admin/workspace/mengxiq
   scp report2026.json admin@raspberrypi.local:/home/admin/workspace/mengxiq

   scp deploy/pm2-raspberrypi.config.js admin@raspberrypi.local:/home/admin/workspace/mengxiq
   scp deploy/nginx.conf admin@raspberrypi.local:/home/admin/workspace/mengxiq
   scp -r mengxiq/mgq-raspberrypi admin@raspberrypi.local:/home/admin/workspace/mengxiq/mgq-raspberrypi
   ```
   - note, I needed to delete the folder before scp the new one `admin@raspberrypi:~/workspace/mengxiq $ rm -rf mgq-raspberrypi`; otherwise it kept running the older version

3. **SSH into RaspberryPi**
   ```bash
   ssh-keygen -R raspberrypi.local
   ssh admin@raspberrypi.local
   ```

4. **Start all services**
   ```bash
   cd /home/admin/workspace/mengxiq
   pm2 start pm2-raspberrypi.config.js
   ```

## Accessing the App

Once deployed, access the app at:
- `https://raspberrypi.local/`
- `https://<raspberrypi-ip>/` (more reliable, e.g., `https://10.0.0.151/`)

Nginx listens on port 443 (standard HTTPS) — no port number needed in the URL.

To find the RaspberryPi IP: `hostname -I` on the Pi, or check `pm2 logs mengxiq-app`

> **Browser cert warning:** The self-signed cert will trigger a security warning. Click **Advanced → Proceed** (Chrome) or **Accept the Risk** (Firefox). Only needed once per browser per device. See the [Enabling HTTPS](#enabling-https-required-for-encryption-feature) section to trust it permanently.

## Managing Services

### View status
```bash
pm2 status
```

### View logs
```bash
pm2 logs                    # All logs
pm2 logs --lines 1000       # Show last 1000 
pm2 logs nginx              # Specific service
pm2 logs life2026-db
pm2 logs report2026-db
pm2 logs mengxiq-app
```

### Restart services
```bash
pm2 restart all             # Restart all
pm2 restart life2026-db     # Restart specific service
```

### Stop services
```bash
pm2 stop all                # Stop all
pm2 stop life2026-db        # Stop specific service
```

### Delete services
```bash
pm2 delete all              # Remove all
pm2 delete life2026-db      # Remove specific service
```

## Auto-start on Boot

To make services start automatically when RaspberryPi boots:

1. **Generate startup script**
   ```bash
   pm2 startup
   ```
   Follow the instructions and run the command it outputs.

2. **Save current process list**
   ```bash
   pm2 save
   ```

3. **Verify**
   ```bash
   sudo reboot
   # After reboot, SSH back in and check:
   pm2 status
   ```

## Troubleshooting

### Check if ports are in use
```bash
lsof -i :80
lsof -i :443
lsof -i :8001
lsof -i :8002
lsof -i :3019
```

### Kill processes on specific ports
```bash
kill -9 $(lsof -t -i:80)
kill -9 $(lsof -t -i:443)
kill -9 $(lsof -t -i:8001)
kill -9 $(lsof -t -i:8002)
kill -9 $(lsof -t -i:3019)
```

### Test nginx config
```bash
nginx -t -c /home/admin/workspace/mengxiq/nginx.conf
```

### Reset PM2
```bash
pm2 kill
pm2 start pm2-raspberrypi.config.js
```

## Enabling HTTPS (required for encryption feature)

The client-side encryption feature (`crypto.subtle`) only works in secure contexts (HTTPS or `localhost`). HTTPS is handled by **nginx** — it terminates SSL and proxies all traffic to the internal services over plain HTTP on `127.0.0.1`.

### 1. Generate a self-signed certificate (on the Pi)
```bash
mkdir -p /home/admin/workspace/mengxiq/certs
cd /home/admin/workspace/mengxiq/certs

openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes \
  -subj "/CN=raspberrypi.local" \
  -addext "subjectAltName=IP:$(hostname -I | awk '{print $1}'),DNS:raspberrypi.local"
```

The `nginx.conf` in this repo already references these paths (`certs/cert.pem`, `certs/key.pem`) — no further config changes needed.

### 2. Start services
```bash
cd /home/admin/workspace/mengxiq
pm2 start pm2-raspberrypi.config.js
pm2 save
```

### 3. Accept the cert in your browser
Open `https://raspberrypi.local` → browser shows a security warning → click **Advanced → Proceed** (Chrome) or **Accept the Risk** (Firefox). Only needed once per browser per device.

### Optional — trust the cert permanently (skip the browser warning)

Copy the cert to the client device and install it as a trusted root:

**Mac:**
```bash
scp admin@raspberrypi.local:/home/admin/workspace/mengxiq/certs/cert.pem ~/Downloads/raspberrypi-cert.pem
```
Open **Keychain Access** → drag `raspberrypi-cert.pem` in → double-click it → **Trust → Always Trust**.

**Windows:**
```powershell
# Copy cert to Windows machine, then:
certutil -addstore -user Root raspberrypi-cert.pem
```
Or double-click the `.pem` file → **Install Certificate → Current User → Trusted Root Certification Authorities**.
