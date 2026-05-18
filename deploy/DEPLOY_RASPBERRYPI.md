# Deployment Guide for RaspberryPi

## Prerequisites
1. Install PM2 globally on RaspberryPi:
```bash
nvm use v21.1.0
npm install -g pm2
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
- `http://raspberrypi.local:3019/`
- `http://<raspberrypi-ip>:3019/` (more reliable, e.g., `http://10.0.0.151:3019/`)

To find the RaspberryPi IP: `hostname -I` on the Pi, or check `pm2 logs mengxiq-app`

## Managing Services

### View status
```bash
pm2 status
```

### View logs
```bash
pm2 logs                    # All logs
pm2 logs --lines 1000       # Show last 1000 
pm2 logs life2026-db        # Specific service
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
lsof -i :8001
lsof -i :8002
lsof -i :3019
```

### Kill processes on specific ports
```bash
kill -9 $(lsof -t -i:8001)
kill -9 $(lsof -t -i:8002)
kill -9 $(lsof -t -i:3019)
```

### Reset PM2
```bash
pm2 kill
pm2 start pm2-raspberrypi.config.js
```

## Enabling HTTPS (required for encryption feature)

The client-side encryption feature (`crypto.subtle`) only works in secure contexts (HTTPS or `localhost`). To enable it over LAN:

### 1. Generate a self-signed certificate (on the Pi)
```bash
mkdir -p /home/admin/workspace/mengxiq/certs
cd /home/admin/workspace/mengxiq/certs

openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes \
  -subj "/CN=raspberrypi.local" \
  -addext "subjectAltName=IP:$(hostname -I | awk '{print $1}'),DNS:raspberrypi.local"
```

### 2. Update `pm2-raspberrypi.config.js`
Change the `mengxiq-app` args to add SSL flags:
```js
args: 'http-server mgq-raspberrypi -p 3019 -a 0.0.0.0 --ssl --cert certs/cert.pem --key certs/key.pem',
```

### 3. Restart the app
```bash
pm2 delete mengxiq-app
pm2 start pm2-raspberrypi.config.js
pm2 save
```

### 4. Accept the cert in your browser
Open `https://raspberrypi.local:3019` → browser shows a security warning → click **Advanced → Proceed** (Chrome) or **Accept the Risk** (Firefox). Only needed once per browser.

### Optional — trust the cert permanently on Mac (skip the browser warning)
```bash
# Copy cert from Pi to Mac
scp admin@raspberrypi.local:/home/admin/workspace/mengxiq/certs/cert.pem ~/Downloads/raspberrypi-cert.pem
```
Then on Mac: open **Keychain Access** → drag `raspberrypi-cert.pem` in → double-click it → **Trust → Always Trust**.
