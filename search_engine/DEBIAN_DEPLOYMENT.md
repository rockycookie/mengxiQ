# Meilisearch Deployment Guide for Debian

This guide covers deploying Meilisearch 1.42.1 from source on Debian-based systems (Debian, Ubuntu, Linux Mint, etc.).

## Prerequisites

### System Requirements
- Debian 10 (Buster) or later, or Ubuntu 20.04 LTS or later
- Minimum 1GB RAM (2GB+ recommended for production)
- 1GB+ free disk space for build process
- Internet connection for downloading dependencies

### Required Packages

Update your package list and install required dependencies:

```bash
sudo apt update
sudo apt install -y curl
```

For building from source (optional), you'll also need:
```bash
sudo apt install -y build-essential pkg-config libssl-dev git
```

## Installing Meilisearch

### Option 1: Download Pre-built Binary (Recommended)

The easiest way to install Meilisearch is to download the pre-built binary for your architecture.

#### Detect your architecture:

```bash
uname -m
```

- `x86_64` or `amd64` → Use the amd64 binary
- `aarch64` or `arm64` → Use the aarch64 binary

#### For ARM64/aarch64 systems:

```bash
# Download the binary
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.42.1/meilisearch-linux-aarch64 -o meilisearch

# Make it executable
chmod +x meilisearch

# Verify it works
./meilisearch --version
```

#### For x86_64/amd64 systems:

```bash
# Download the binary
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.42.1/meilisearch-linux-amd64 -o meilisearch

# Make it executable
chmod +x meilisearch

# Verify it works
./meilisearch --version
```

### Option 2: Build from Source

If you prefer to build from source or need to customize the build:

#### Install Rust

Meilisearch requires Rust 1.91.1. Install it using rustup:

```bash
# Download and install rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the on-screen instructions, select option 1 for default installation

# Load Rust environment
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version

# Install the specific Rust version required by Meilisearch
rustup install 1.91.1
rustup default 1.91.1
```

Add Rust to your PATH permanently by adding this line to your `~/.bashrc` or `~/.profile`:
```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

#### Build from Local Source

If you already have the Meilisearch source code:

```bash
cd /path/to/meilisearch-1.42.1

# Build in release mode (recommended for production)
cargo build --release

# The binary will be available at:
# ./target/release/meilisearch
```

#### Or Clone and Build from GitHub

```bash
# Clone the repository
git clone https://github.com/meilisearch/meilisearch.git
cd meilisearch

# Checkout the specific version
git checkout v1.42.1

# Build in release mode
cargo build --release
```

**Build time:** Initial build may take 10-30 minutes depending on your system.

#### Performance Optimization (Optional for Development)

For faster successive builds during development:

```bash
# Add to ~/.bashrc or ~/.zshrc
export LINDERA_CACHE=$HOME/.cache/meili/lindera
export MILLI_BENCH_DATASETS_PATH=$HOME/.cache/meili/benches

# Create cache directories
mkdir -p $HOME/.cache/meili/lindera
mkdir -p $HOME/.cache/meili/benches
```

## System Installation

Install the Meilisearch binary to a system location:

### If you downloaded the pre-built binary:

```bash
# Move the binary to /usr/local/bin
sudo mv meilisearch /usr/local/bin/

# Ensure it's executable
sudo chmod +x /usr/local/bin/meilisearch

# Verify installation
meilisearch --version
```

### If you built from source:

```bash
# Copy the binary to /usr/local/bin
sudo cp target/release/meilisearch /usr/local/bin/

# Make it executable
sudo chmod +x /usr/local/bin/meilisearch

# Copy meilitool as well (optional, for maintenance tasks)
sudo cp target/release/meilitool /usr/local/bin/
sudo chmod +x /usr/local/bin/meilitool

# Verify installation
meilisearch --version
```

## Running Meilisearch

### Quick Start (Development)

Run Meilisearch directly:

```bash
# Create a data directory
mkdir -p ~/meili_data

# Run Meilisearch (localhost only)
meilisearch --db-path ~/meili_data --http-addr 127.0.0.1:7700
```

Access Meilisearch at: http://127.0.0.1:7700

### Quick Start (LAN Access)

To make Meilisearch accessible from other devices on your local network:

```bash
# Create a data directory
mkdir -p ~/meili_data

# Run Meilisearch on all network interfaces
meilisearch --db-path ~/meili_data --http-addr 0.0.0.0:7700
```

**Find your LAN IP address:**
```bash
# Show all network interfaces and IPs
ip addr show | grep "inet "

# Or use hostname command
hostname -I
```

Access from other devices on your network: `http://YOUR_LAN_IP:7700`

**Security Note:** When exposing Meilisearch on LAN, always set a master key:
```bash
meilisearch --db-path ~/meili_data --http-addr 0.0.0.0:7700 --master-key "YOUR_SECURE_KEY"
```

### Production Setup with systemd

For production, run Meilisearch as a system service.

#### 1. Create a dedicated user

```bash
sudo useradd -r -s /bin/false -d /var/lib/meilisearch meilisearch
```

#### 2. Create data directory

```bash
sudo mkdir -p /var/lib/meilisearch/data
sudo chown -R meilisearch:meilisearch /var/lib/meilisearch
```

#### 3. Create environment file

```bash
sudo nano /etc/meilisearch.env
```

Add the following configuration:

```bash
# Server configuration
# Use 127.0.0.1 for localhost only, or 0.0.0.0 for LAN access
MEILI_HTTP_ADDR=0.0.0.0:7700
MEILI_DB_PATH=/var/lib/meilisearch/data

# Security - IMPORTANT: Generate a secure master key
# REQUIRED when exposing on LAN!
# Generate one with: openssl rand -base64 32
MEILI_MASTER_KEY=YOUR_SECURE_MASTER_KEY_HERE

# Performance (adjust based on your system)
MEILI_MAX_INDEXING_MEMORY=512MB
MEILI_MAX_INDEXING_THREADS=2

# Logging
MEILI_LOG_LEVEL=INFO

# Optional: Disable analytics
# MEILI_NO_ANALYTICS=true
```

**Important:** Replace `YOUR_SECURE_MASTER_KEY_HERE` with a secure key:
```bash
openssl rand -base64 32
```

Set proper permissions:
```bash
sudo chmod 600 /etc/meilisearch.env
sudo chown meilisearch:meilisearch /etc/meilisearch.env
```

#### 4. Create systemd service file

```bash
sudo nano /etc/systemd/system/meilisearch.service
```

Add the following content:

```ini
[Unit]
Description=Meilisearch search engine
After=network.target
Documentation=https://www.meilisearch.com/docs

[Service]
Type=simple
User=meilisearch
Group=meilisearch

# Load environment variables
EnvironmentFile=/etc/meilisearch.env

# Run Meilisearch
ExecStart=/usr/local/bin/meilisearch

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/meilisearch

# Restart configuration
Restart=on-failure
RestartSec=5s

# Resource limits (adjust as needed)
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

#### 5. Enable and start the service

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable Meilisearch to start on boot
sudo systemctl enable meilisearch

# Start Meilisearch
sudo systemctl start meilisearch

# Check status
sudo systemctl status meilisearch

# View logs
sudo journalctl -u meilisearch -f
```

## Setting Up Nginx Reverse Proxy (Optional)

To expose Meilisearch with HTTPS:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/meilisearch
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:7700;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/meilisearch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS, install and configure Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Firewall Configuration

### For LAN Access

If using UFW and want to allow LAN access:

```bash
# Allow Meilisearch port from local network only (recommended)
# Replace 192.168.1.0/24 with your actual LAN subnet
sudo ufw allow from 192.168.1.0/24 to any port 7700 proto tcp

# Enable firewall
sudo ufw enable

# Check the rule was added
sudo ufw status
```

**Find your LAN subnet:**
```bash
# Show your network configuration
ip route | grep default
# Example output: default via 192.168.1.1 dev eth0
# Your subnet is typically 192.168.1.0/24
```

### Alternative: Allow from anywhere (less secure)

```bash
# Allow Meilisearch from any IP (use with caution!)
sudo ufw allow 7700/tcp

# Enable firewall
sudo ufw enable
```

### If using Nginx reverse proxy

```bash
# Allow Nginx (if using reverse proxy)
sudo ufw allow 'Nginx Full'

# Meilisearch only needs to listen on localhost if behind Nginx
# In this case, use MEILI_HTTP_ADDR=127.0.0.1:7700
```

## Testing the Installation

### Local Testing

```bash
# Check if Meilisearch is running (local)
curl http://127.0.0.1:7700/health

# Expected response: {"status":"available"}

# Get version info
curl http://127.0.0.1:7700/version
```

### LAN Access Testing

If you configured Meilisearch for LAN access:

```bash
# Find your server's LAN IP address
LAN_IP=$(hostname -I | awk '{print $1}')
echo "Server LAN IP: $LAN_IP"

# Test from the server itself
curl http://$LAN_IP:7700/health

# Test from another device on your LAN
# Replace 192.168.1.100 with your server's actual LAN IP
curl http://192.168.1.100:7700/health
```

**From another computer on your LAN:**
- Open a web browser
- Navigate to: `http://YOUR_SERVER_IP:7700`
- You should see the Meilisearch version information

**Using with a master key:**
```bash
# All API requests need the Authorization header
curl -H "Authorization: Bearer YOUR_MASTER_KEY" http://YOUR_SERVER_IP:7700/health
```

## Updating Meilisearch

### If using pre-built binary:

```bash
# Stop the service
sudo systemctl stop meilisearch

# Download the new version (replace v1.x.x with desired version)
# For aarch64:
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.x.x/meilisearch-linux-aarch64 -o meilisearch

# For amd64:
# curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.x.x/meilisearch-linux-amd64 -o meilisearch

# Make it executable
chmod +x meilisearch

# Replace the binary
sudo mv meilisearch /usr/local/bin/

# Start the service
sudo systemctl start meilisearch

# Verify
meilisearch --version
```

### If built from source:

```bash
# Stop the service
sudo systemctl stop meilisearch

# Navigate to source directory
cd /path/to/meilisearch

# Pull latest changes or checkout new version
git fetch --tags
git checkout v1.x.x  # Replace with desired version

# Rebuild
cargo build --release

# Replace the binary
sudo cp target/release/meilisearch /usr/local/bin/

# Start the service
sudo systemctl start meilisearch

# Verify
meilisearch --version
```

## Backup and Maintenance

### Creating a Backup

```bash
# Stop Meilisearch
sudo systemctl stop meilisearch

# Backup the data directory
sudo tar -czf meilisearch-backup-$(date +%Y%m%d).tar.gz /var/lib/meilisearch/data

# Start Meilisearch
sudo systemctl start meilisearch
```

### Restoring from Backup

```bash
# Stop Meilisearch
sudo systemctl stop meilisearch

# Remove current data
sudo rm -rf /var/lib/meilisearch/data

# Extract backup
sudo tar -xzf meilisearch-backup-YYYYMMDD.tar.gz -C /

# Fix permissions
sudo chown -R meilisearch:meilisearch /var/lib/meilisearch

# Start Meilisearch
sudo systemctl start meilisearch
```

## Troubleshooting

### Check logs
```bash
sudo journalctl -u meilisearch -n 100
```

### Service won't start
```bash
# Check permissions
ls -la /var/lib/meilisearch
sudo chown -R meilisearch:meilisearch /var/lib/meilisearch

# Check configuration
sudo -u meilisearch /usr/local/bin/meilisearch --env /etc/meilisearch.env
```

### Out of memory errors
Increase memory limits in `/etc/meilisearch.env`:
```bash
MEILI_MAX_INDEXING_MEMORY=1GB
```

### Port already in use
Change the port in `/etc/meilisearch.env`:
```bash
MEILI_HTTP_ADDR=127.0.0.1:7701
```

## Uninstallation

To completely remove Meilisearch:

```bash
# Stop and disable service
sudo systemctl stop meilisearch
sudo systemctl disable meilisearch

# Remove service file
sudo rm /etc/systemd/system/meilisearch.service
sudo systemctl daemon-reload

# Remove binary
sudo rm /usr/local/bin/meilisearch
sudo rm /usr/local/bin/meilitool

# Remove data (CAUTION: This deletes all your data)
sudo rm -rf /var/lib/meilisearch

# Remove configuration
sudo rm /etc/meilisearch.env

# Optional: Remove Rust
rustup self uninstall
```

## LAN Access Configuration Guide

This section provides detailed instructions for hosting Meilisearch on your local network.

### Understanding Network Binding

- **127.0.0.1** (localhost): Only accessible from the same machine
- **0.0.0.0**: Listens on all network interfaces (localhost + LAN + internet if exposed)
- **Specific IP** (e.g., 192.168.1.100): Listens only on that specific interface

### Step-by-Step LAN Setup

#### 1. Find Your Server's LAN IP

```bash
# Method 1: Using ip command
ip addr show | grep "inet " | grep -v 127.0.0.1

# Method 2: Using hostname
hostname -I

# Method 3: Check specific interface
ip addr show eth0  # or wlan0 for WiFi

# Example output: 192.168.1.100
```

#### 2. Configure Meilisearch for LAN Access

Edit `/etc/meilisearch.env`:

```bash
# Bind to all interfaces (allows LAN access)
MEILI_HTTP_ADDR=0.0.0.0:7700

# CRITICAL: Always set a master key for LAN access!
MEILI_MASTER_KEY=your_secure_master_key_here
```

#### 3. Configure Firewall for LAN

```bash
# Option A: Allow from your local subnet only (most secure)
sudo ufw allow from 192.168.1.0/24 to any port 7700 proto tcp comment 'Meilisearch LAN'

# Option B: Allow from any private network
sudo ufw allow from 192.168.0.0/16 to any port 7700 proto tcp
sudo ufw allow from 10.0.0.0/8 to any port 7700 proto tcp
sudo ufw allow from 172.16.0.0/12 to any port 7700 proto tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status numbered
```

#### 4. Restart Meilisearch

```bash
sudo systemctl restart meilisearch
sudo systemctl status meilisearch
```

#### 5. Verify LAN Access

From the server:
```bash
curl http://$(hostname -I | awk '{print $1}'):7700/health
```

From another device on your LAN:
```bash
# Replace with your server's actual IP
curl http://192.168.1.100:7700/health
```

### Accessing from Different Devices

#### From Web Browser
```
http://192.168.1.100:7700
```

#### From Python
```python
import meilisearch

client = meilisearch.Client('http://192.168.1.100:7700', 'YOUR_MASTER_KEY')
print(client.health())
```

#### From JavaScript/Node.js
```javascript
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://192.168.1.100:7700',
  apiKey: 'YOUR_MASTER_KEY',
});

client.health().then(res => console.log(res));
```

#### From Mobile Apps
Use your server's LAN IP: `http://192.168.1.100:7700`

### Troubleshooting LAN Access

#### Can't connect from other devices

1. **Check Meilisearch is listening on 0.0.0.0:**
   ```bash
   sudo netstat -tlnp | grep 7700
   # Should show: 0.0.0.0:7700
   ```

2. **Check firewall rules:**
   ```bash
   sudo ufw status verbose
   ```

3. **Test with firewall temporarily disabled (testing only!):**
   ```bash
   sudo ufw disable
   # Try connecting
   sudo ufw enable
   ```

4. **Verify both devices are on the same network:**
   ```bash
   # On server
   ip route | grep default
   
   # On client device, ping the server
   ping 192.168.1.100
   ```

5. **Check if router has AP isolation enabled** (common on guest WiFi networks)

#### Connection refused errors

```bash
# Check if Meilisearch is running
sudo systemctl status meilisearch

# Check the logs
sudo journalctl -u meilisearch -f

# Verify the configuration
cat /etc/meilisearch.env | grep MEILI_HTTP_ADDR
```

### Static IP Configuration (Recommended for Servers)

To ensure your server always has the same LAN IP:

#### Using netplan (Ubuntu 18.04+)

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

Add:
```yaml
network:
  version: 2
  ethernets:
    eth0:  # or your interface name
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

Apply:
```bash
sudo netplan apply
```

#### Using DHCP reservation (Alternative)

Configure your router to always assign the same IP to your server's MAC address. This is often easier than static IP configuration.

### Security Considerations for LAN Access

1. **Always use a strong master key** - Never expose without authentication
2. **Use firewall rules** - Restrict to your LAN subnet only
3. **Consider using HTTPS** - Even on LAN for sensitive data
4. **Monitor access logs** - Check for unauthorized access attempts
5. **Use API keys** - Create restricted API keys for different applications
6. **Regular updates** - Keep Meilisearch updated to latest version

### LAN Access with HTTPS (Optional)

For HTTPS on LAN, you can use self-signed certificates or mDNS with Let's Encrypt:

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/meilisearch.key \
  -out /etc/ssl/certs/meilisearch.crt

# Configure Nginx with SSL (see Nginx section)
```

Then access via: `https://192.168.1.100:443`

Note: Browsers will show a security warning for self-signed certificates.

## Additional Resources

- [Official Documentation](https://www.meilisearch.com/docs)
- [API Reference](https://www.meilisearch.com/docs/reference/api/overview)
- [Discord Community](https://discord.meilisearch.com)
- [GitHub Repository](https://github.com/meilisearch/meilisearch)

## Security Recommendations

### General Security
1. **Always set a strong MEILI_MASTER_KEY** in production and LAN deployments
2. Use a reverse proxy (Nginx/Apache) with HTTPS
3. Run Meilisearch behind a firewall
4. Regularly update Meilisearch to the latest version
5. Implement rate limiting at the reverse proxy level
6. Use tenant tokens for multi-tenant applications
7. Regularly backup your data
8. Monitor logs for suspicious activity

### LAN-Specific Security
1. **Never expose without authentication** - Always set `MEILI_MASTER_KEY`
2. **Restrict firewall to LAN subnet** - Don't allow 0.0.0.0/0
3. **Use API keys** - Create limited-scope keys for applications
4. **Monitor network access** - Check logs regularly with: `sudo journalctl -u meilisearch | grep "HTTP"`
5. **Consider VPN** - For remote access, use VPN instead of port forwarding
6. **Disable if not needed** - Stop the service when not in use: `sudo systemctl stop meilisearch`
7. **Router security** - Ensure router admin panel uses strong password
8. **Guest network isolation** - Don't host on guest WiFi networks

## Performance Tuning

For better performance on production systems:

1. **Increase file descriptor limits** in `/etc/security/limits.conf`:
   ```
   meilisearch soft nofile 65536
   meilisearch hard nofile 65536
   ```

2. **Adjust memory settings** based on your dataset size
3. **Use SSD storage** for the data directory
4. **Monitor system resources** with tools like `htop` or `prometheus`

---

**Deployment checklist:**
- [ ] System packages installed (curl)
- [ ] Meilisearch binary downloaded or built
- [ ] Binary installed to /usr/local/bin
- [ ] Dedicated user created
- [ ] Data directory created with proper permissions
- [ ] Environment file configured with secure master key
- [ ] Systemd service file created
- [ ] Service started and enabled
- [ ] Health check passed
- [ ] Firewall configured
- [ ] Reverse proxy configured (if needed)
- [ ] HTTPS configured (if applicable)
- [ ] Backup strategy in place
