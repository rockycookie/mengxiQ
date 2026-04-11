# Deployment Guide for RaspberryPi

## Prerequisites
1. Install PM2 globally on RaspberryPi:
```bash
npm install -g pm2
```

## Deployment Steps

1. **Build the React app** (from your Mac)
   ```bash
   cd mengxiq
   # The app is configured to use raspberrypi.local by default
   # To use a different hostname, create .env.local and set JSON_SERVER_HOSTNAME
   npm run build
   cd ..
   ```

2. **Transfer files to RaspberryPi**
   ```bash
   scp ecosystem.config.js admin@raspberrypi.local:/home/admin/workspace/
   scp life2026.json admin@raspberrypi.local:/home/admin/workspace/
   scp report2026.json admin@raspberrypi.local:/home/admin/workspace/
   scp -r mengxiq/build/* admin@raspberrypi.local:/home/admin/workspace/mengxiq1.9.1/
   ```

3. **SSH into RaspberryPi**
   ```bash
   ssh-keygen -R raspberrypi.local
   ssh admin@raspberrypi.local
   ```

4. **Start all services**
   ```bash
   cd /home/admin/workspace
   pm2 start ecosystem.config.js
   ```

## Accessing the App

Once deployed, access the app at:
- `http://raspberrypi.local:3019/` (may not work in Chrome)
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
pm2 start ecosystem.config.js
```
