# Meilisearch Deployment Guide for macOS

This guide covers deploying Meilisearch 1.42.1 on macOS systems (macOS 11 Big Sur and later).

## Prerequisites

### System Requirements
- macOS 11 (Big Sur) or later
- Minimum 2GB RAM (4GB+ recommended for production)
- 1GB+ free disk space for build process
- Internet connection for downloading dependencies

### Install Homebrew (if not already installed)

Homebrew is the package manager for macOS:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

## Installing Meilisearch

### Option 1: Install via Homebrew (Recommended)

The easiest way to install Meilisearch on macOS:

```bash
# Install Meilisearch
brew install meilisearch

# Verify installation
meilisearch --version
```

### Option 2: Download Pre-built Binary

Download the official binary for your Mac architecture.

#### Detect your architecture:

```bash
uname -m
```

- `x86_64` → Intel Mac
- `arm64` → Apple Silicon (M1/M2/M3)

#### For Apple Silicon (M1/M2/M3):

```bash
# Download the binary
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.42.1/meilisearch-macos-apple-silicon -o meilisearch

# Make it executable
chmod +x meilisearch

# Move to system path
sudo mv meilisearch /usr/local/bin/

# Verify it works
meilisearch --version
```

#### For Intel Macs:

```bash
# Download the binary
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.42.1/meilisearch-macos-amd64 -o meilisearch

# Make it executable
chmod +x meilisearch

# Move to system path
sudo mv meilisearch /usr/local/bin/

# Verify it works
meilisearch --version
```

**Security Note:** macOS may block the binary on first run. If you see a security warning:
```bash
# Remove the quarantine attribute
xattr -d com.apple.quarantine /usr/local/bin/meilisearch
```

Or go to **System Preferences → Security & Privacy** and click "Allow Anyway".

### Option 3: Build from Source

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

Add Rust to your PATH permanently by adding this line to your `~/.zshrc` or `~/.bash_profile`:
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

# Copy to system path
sudo cp target/release/meilisearch /usr/local/bin/
sudo chmod +x /usr/local/bin/meilisearch
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

# Copy to system path
sudo cp target/release/meilisearch /usr/local/bin/
sudo chmod +x /usr/local/bin/meilisearch
```

**Build time:** Initial build may take 10-30 minutes depending on your system.

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
meilisearch --db-path ~/meili_data --http-addr 0.0.0.0:7700 --master-key "YOUR_SECURE_KEY"
```

**Find your LAN IP address:**
```bash
# Show all network interfaces and IPs
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or get your primary IP
ipconfig getifaddr en0  # Usually WiFi
# or
ipconfig getifaddr en1  # Usually Ethernet
```

Access from other devices on your network: `http://YOUR_LAN_IP:7700`

**Security Note:** When exposing Meilisearch on LAN, always set a master key:
```bash
# Generate a secure key
openssl rand -base64 32
```

### Production Setup with launchd

For production or automatic startup on boot, use launchd (macOS's service manager).

#### 1. Create data directory

```bash
# Create application support directory
sudo mkdir -p /usr/local/var/meilisearch/data
sudo chown -R $(whoami):staff /usr/local/var/meilisearch
```

#### 2. Create environment configuration file

```bash
# Create config directory
mkdir -p ~/.meilisearch

# Create environment file
nano ~/.meilisearch/env.conf
```

Add the following configuration:

```bash
# Server configuration
# Use 127.0.0.1 for localhost only, or 0.0.0.0 for LAN access
MEILI_HTTP_ADDR=0.0.0.0:7700
MEILI_DB_PATH=/usr/local/var/meilisearch/data

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
chmod 600 ~/.meilisearch/env.conf
```

#### 3. Create launchd plist file

```bash
nano ~/Library/LaunchAgents/com.meilisearch.server.plist
```

Add the following content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.meilisearch.server</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/meilisearch</string>
    </array>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>MEILI_HTTP_ADDR</key>
        <string>0.0.0.0:7700</string>
        <key>MEILI_DB_PATH</key>
        <string>/usr/local/var/meilisearch/data</string>
        <key>MEILI_MASTER_KEY</key>
        <string>YOUR_SECURE_MASTER_KEY_HERE</string>
        <key>MEILI_MAX_INDEXING_MEMORY</key>
        <string>512MB</string>
        <key>MEILI_MAX_INDEXING_THREADS</key>
        <string>2</string>
        <key>MEILI_LOG_LEVEL</key>
        <string>INFO</string>
    </dict>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/usr/local/var/log/meilisearch/stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>/usr/local/var/log/meilisearch/stderr.log</string>
    
    <key>WorkingDirectory</key>
    <string>/usr/local/var/meilisearch</string>
</dict>
</plist>
```

**Important:** Replace `YOUR_SECURE_MASTER_KEY_HERE` with your actual master key.

#### 4. Create log directory

```bash
sudo mkdir -p /usr/local/var/log/meilisearch
sudo chown -R $(whoami):staff /usr/local/var/log/meilisearch
```

#### 5. Load and start the service

```bash
# Load the service
launchctl load ~/Library/LaunchAgents/com.meilisearch.server.plist

# Start the service (if not already started)
launchctl start com.meilisearch.server

# Check if it's running
launchctl list | grep meilisearch

# View logs
tail -f /usr/local/var/log/meilisearch/stdout.log
tail -f /usr/local/var/log/meilisearch/stderr.log
```

#### Managing the launchd service

```bash
# Stop the service
launchctl stop com.meilisearch.server

# Restart the service
launchctl stop com.meilisearch.server
launchctl start com.meilisearch.server

# Unload the service (disable autostart)
launchctl unload ~/Library/LaunchAgents/com.meilisearch.server.plist

# Reload after config changes
launchctl unload ~/Library/LaunchAgents/com.meilisearch.server.plist
launchctl load ~/Library/LaunchAgents/com.meilisearch.server.plist
```

### Alternative: Using Homebrew Services

If you installed via Homebrew, you can use brew services:

```bash
# Start Meilisearch (with default settings)
brew services start meilisearch

# Stop Meilisearch
brew services stop meilisearch

# Restart Meilisearch
brew services restart meilisearch

# Check status
brew services list | grep meilisearch
```

**Note:** Homebrew services use default configuration. For custom settings, use the launchd method above.

## Firewall Configuration

### Using macOS Built-in Firewall

Enable and configure the macOS application firewall:

```bash
# Enable firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on

# Allow Meilisearch through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/meilisearch
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/meilisearch

# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### Using pf (Packet Filter) - Advanced

For more granular control, you can use macOS's pf firewall:

#### Create pf rules file:

```bash
sudo nano /etc/pf.anchors/meilisearch
```

Add:
```
# Allow Meilisearch from local network only
# Replace 192.168.1.0/24 with your actual LAN subnet
pass in proto tcp from 192.168.1.0/24 to any port 7700
```

#### Load the rules:

```bash
# Add anchor to main pf.conf
echo "anchor \"meilisearch\"" | sudo tee -a /etc/pf.conf
echo "load anchor \"meilisearch\" from \"/etc/pf.anchors/meilisearch\"" | sudo tee -a /etc/pf.conf

# Enable pf
sudo pfctl -e

# Load rules
sudo pfctl -f /etc/pf.conf

# Check rules
sudo pfctl -s rules
```

**Note:** pf configuration persists across reboots on modern macOS versions.

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
# Find your Mac's LAN IP address
LAN_IP=$(ipconfig getifaddr en0)
echo "Mac LAN IP: $LAN_IP"

# Test from the Mac itself
curl http://$LAN_IP:7700/health

# Test from another device on your LAN
# Replace 192.168.1.100 with your Mac's actual LAN IP
curl http://192.168.1.100:7700/health
```

**From another computer on your LAN:**
- Open a web browser
- Navigate to: `http://YOUR_MAC_IP:7700`
- You should see the Meilisearch version information

**Using with a master key:**
```bash
# All API requests need the Authorization header
curl -H "Authorization: Bearer YOUR_MASTER_KEY" http://YOUR_MAC_IP:7700/health
```

## Setting Up Nginx Reverse Proxy (Optional)

To expose Meilisearch with HTTPS:

```bash
# Install Nginx via Homebrew
brew install nginx

# Create Nginx configuration
sudo nano /usr/local/etc/nginx/servers/meilisearch.conf
```

Add the following configuration:

```nginx
server {
    listen 8080;
    server_name localhost;  # Replace with your domain or use localhost

    location / {
        proxy_pass http://127.0.0.1:7700;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Start Nginx:

```bash
# Start Nginx
brew services start nginx

# Or run manually
nginx

# Test configuration
nginx -t

# Reload after changes
nginx -s reload

# Stop Nginx
brew services stop nginx
# or
nginx -s stop
```

Access Meilisearch via: `http://localhost:8080`

## Updating Meilisearch

### If installed via Homebrew:

```bash
# Update Homebrew
brew update

# Upgrade Meilisearch
brew upgrade meilisearch

# Restart the service
brew services restart meilisearch

# Verify new version
meilisearch --version
```

### If using pre-built binary:

```bash
# Stop the service
launchctl stop com.meilisearch.server

# Download the new version (replace v1.x.x with desired version)
# For Apple Silicon:
curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.x.x/meilisearch-macos-apple-silicon -o meilisearch

# For Intel:
# curl -L https://github.com/meilisearch/meilisearch/releases/download/v1.x.x/meilisearch-macos-amd64 -o meilisearch

# Make it executable
chmod +x meilisearch

# Replace the binary
sudo mv meilisearch /usr/local/bin/

# Remove quarantine attribute
xattr -d com.apple.quarantine /usr/local/bin/meilisearch

# Start the service
launchctl start com.meilisearch.server

# Verify
meilisearch --version
```

### If built from source:

```bash
# Stop the service
launchctl stop com.meilisearch.server

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
launchctl start com.meilisearch.server

# Verify
meilisearch --version
```

## Backup and Maintenance

### Creating a Backup

```bash
# Stop Meilisearch
launchctl stop com.meilisearch.server

# Backup the data directory
tar -czf meilisearch-backup-$(date +%Y%m%d).tar.gz /usr/local/var/meilisearch/data

# Start Meilisearch
launchctl start com.meilisearch.server
```

### Restoring from Backup

```bash
# Stop Meilisearch
launchctl stop com.meilisearch.server

# Remove current data
rm -rf /usr/local/var/meilisearch/data

# Extract backup
tar -xzf meilisearch-backup-YYYYMMDD.tar.gz -C /usr/local/var/meilisearch/

# Fix permissions
chown -R $(whoami):staff /usr/local/var/meilisearch

# Start Meilisearch
launchctl start com.meilisearch.server
```

### Automated Backups with cron

Create a backup script:

```bash
# Create backup script
nano ~/meilisearch-backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="$HOME/meilisearch-backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/meilisearch-$DATE.tar.gz" /usr/local/var/meilisearch/data

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/meilisearch-*.tar.gz | tail -n +8 | xargs rm -f
```

Make it executable:
```bash
chmod +x ~/meilisearch-backup.sh
```

Add to crontab:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /Users/yourusername/meilisearch-backup.sh
```

## Troubleshooting

### Check if Meilisearch is running

```bash
# Check launchd service status
launchctl list | grep meilisearch

# Check process
ps aux | grep meilisearch

# Check port
lsof -i :7700
```

### View logs

```bash
# View stdout log
tail -f /usr/local/var/log/meilisearch/stdout.log

# View stderr log
tail -f /usr/local/var/log/meilisearch/stderr.log

# View system logs
log show --predicate 'process == "meilisearch"' --last 1h
```

### Service won't start

```bash
# Check permissions
ls -la /usr/local/var/meilisearch

# Fix permissions
chown -R $(whoami):staff /usr/local/var/meilisearch

# Check binary exists
which meilisearch
ls -la /usr/local/bin/meilisearch

# Test running manually
/usr/local/bin/meilisearch --db-path /tmp/meili_test
```

### macOS Security Blocks Binary

```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine /usr/local/bin/meilisearch

# Or check and remove all attributes
xattr -l /usr/local/bin/meilisearch
xattr -c /usr/local/bin/meilisearch
```

### Out of memory errors

Increase memory limits in your launchd plist or environment file:
```xml
<key>MEILI_MAX_INDEXING_MEMORY</key>
<string>1GB</string>
```

### Port already in use

Check what's using the port:
```bash
lsof -i :7700
```

Change the port in your configuration:
```bash
MEILI_HTTP_ADDR=127.0.0.1:7701
```

### Can't connect from other devices on LAN

1. **Check Meilisearch is listening on 0.0.0.0:**
   ```bash
   lsof -i :7700
   # Should show: *:7700 (LISTEN)
   ```

2. **Check firewall settings:**
   ```bash
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
   ```

3. **Test with firewall temporarily disabled:**
   ```bash
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
   # Try connecting from another device
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
   ```

4. **Verify network connectivity:**
   ```bash
   # Get your IP
   ipconfig getifaddr en0
   
   # Test from another device
   ping YOUR_MAC_IP
   ```

## Uninstallation

To completely remove Meilisearch:

### If installed via Homebrew:

```bash
# Stop the service
brew services stop meilisearch

# Uninstall Meilisearch
brew uninstall meilisearch

# Remove data (CAUTION: This deletes all your data)
rm -rf /usr/local/var/meilisearch

# Remove logs
rm -rf /usr/local/var/log/meilisearch
```

### If installed manually:

```bash
# Stop and unload the service
launchctl stop com.meilisearch.server
launchctl unload ~/Library/LaunchAgents/com.meilisearch.server.plist

# Remove service file
rm ~/Library/LaunchAgents/com.meilisearch.server.plist

# Remove binary
sudo rm /usr/local/bin/meilisearch

# Remove data (CAUTION: This deletes all your data)
sudo rm -rf /usr/local/var/meilisearch

# Remove logs
sudo rm -rf /usr/local/var/log/meilisearch

# Remove configuration
rm -rf ~/.meilisearch

# Optional: Remove Rust
rustup self uninstall
```

## LAN Access Configuration Guide

This section provides detailed instructions for hosting Meilisearch on your local network.

### Understanding Network Binding

- **127.0.0.1** (localhost): Only accessible from the same Mac
- **0.0.0.0**: Listens on all network interfaces (localhost + LAN)
- **Specific IP** (e.g., 192.168.1.100): Listens only on that specific interface

### Step-by-Step LAN Setup

#### 1. Find Your Mac's LAN IP

```bash
# Method 1: Using ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# Method 2: Using ipconfig (WiFi)
ipconfig getifaddr en0

# Method 3: Using ipconfig (Ethernet)
ipconfig getifaddr en1

# Method 4: System Preferences
# Go to: System Preferences → Network
# Select your active connection (WiFi or Ethernet)
# Your IP is shown on the right

# Example output: 192.168.1.100
```

#### 2. Configure Meilisearch for LAN Access

Edit your launchd plist or environment file:

```xml
<key>MEILI_HTTP_ADDR</key>
<string>0.0.0.0:7700</string>

<key>MEILI_MASTER_KEY</key>
<string>your_secure_master_key_here</string>
```

**CRITICAL:** Always set a master key for LAN access!

#### 3. Configure Firewall for LAN

```bash
# Allow Meilisearch through application firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/meilisearch
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/meilisearch

# Verify it's allowed
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps | grep meilisearch
```

#### 4. Restart Meilisearch

```bash
# If using launchd
launchctl stop com.meilisearch.server
launchctl start com.meilisearch.server

# If using Homebrew services
brew services restart meilisearch
```

#### 5. Verify LAN Access

From your Mac:
```bash
curl http://$(ipconfig getifaddr en0):7700/health
```

From another device on your LAN:
```bash
# Replace with your Mac's actual IP
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

#### From iOS/Mobile Apps
Use your Mac's LAN IP: `http://192.168.1.100:7700`

### Static IP Configuration (Recommended for Servers)

To ensure your Mac always has the same LAN IP:

#### Via System Preferences (GUI):

1. Open **System Preferences → Network**
2. Select your connection (WiFi or Ethernet)
3. Click **Advanced**
4. Go to **TCP/IP** tab
5. Change "Configure IPv4" from **Using DHCP** to **Manually**
6. Enter your desired IP address (e.g., 192.168.1.100)
7. Enter Subnet Mask: 255.255.255.0
8. Enter Router: Your router's IP (usually 192.168.1.1)
9. Click **OK** and **Apply**

#### Via Command Line:

```bash
# For WiFi (en0)
sudo networksetup -setmanual "Wi-Fi" 192.168.1.100 255.255.255.0 192.168.1.1
sudo networksetup -setdnsservers "Wi-Fi" 8.8.8.8 8.8.4.4

# For Ethernet (usually en1)
sudo networksetup -setmanual "Ethernet" 192.168.1.100 255.255.255.0 192.168.1.1
sudo networksetup -setdnsservers "Ethernet" 8.8.8.8 8.8.4.4
```

#### Router DHCP Reservation (Alternative):

Configure your router to always assign the same IP to your Mac's MAC address. This is often easier than static IP configuration.

To find your MAC address:
```bash
ifconfig en0 | grep ether
```

### Security Considerations for LAN Access

1. **Always use a strong master key** - Never expose without authentication
2. **Use firewall rules** - macOS Application Firewall or pf
3. **Consider using HTTPS** - Even on LAN for sensitive data
4. **Monitor access** - Review logs regularly
5. **Use API keys** - Create restricted API keys for different applications
6. **Regular updates** - Keep Meilisearch updated to latest version
7. **Disable sleep** - Prevent Mac from sleeping if running as server:
   ```bash
   sudo pmset -a sleep 0
   sudo pmset -a disksleep 0
   ```

### Preventing Mac from Sleeping

If using your Mac as a Meilisearch server:

```bash
# Prevent sleep while plugged in
sudo pmset -c sleep 0
sudo pmset -c disksleep 0

# Prevent sleep on battery (laptops)
sudo pmset -b sleep 0
sudo pmset -b disksleep 0

# Keep display awake
caffeinate -d

# Or keep system awake indefinitely
caffeinate -s &
```

**Note:** For production use, consider using a dedicated server rather than a desktop Mac.

## Additional Resources

- [Official Documentation](https://www.meilisearch.com/docs)
- [API Reference](https://www.meilisearch.com/docs/reference/api/overview)
- [Discord Community](https://discord.meilisearch.com)
- [GitHub Repository](https://github.com/meilisearch/meilisearch)
- [Homebrew Formula](https://formulae.brew.sh/formula/meilisearch)

## Security Recommendations

### General Security
1. **Always set a strong MEILI_MASTER_KEY** in production and LAN deployments
2. Use a reverse proxy (Nginx/Apache) with HTTPS
3. Enable macOS firewall
4. Regularly update Meilisearch to the latest version
5. Implement rate limiting at the reverse proxy level
6. Use tenant tokens for multi-tenant applications
7. Regularly backup your data
8. Monitor logs for suspicious activity

### LAN-Specific Security
1. **Never expose without authentication** - Always set `MEILI_MASTER_KEY`
2. **Use firewall rules** - Application Firewall or pf
3. **Use API keys** - Create limited-scope keys for applications
4. **Monitor network access** - Review logs regularly
5. **Consider VPN** - For remote access instead of port forwarding
6. **Disable if not needed** - Stop the service when not in use
7. **FileVault encryption** - Enable full disk encryption on macOS
8. **Guest network isolation** - Don't host on guest WiFi networks

### macOS-Specific Security

1. **Enable FileVault** - Full disk encryption
   ```bash
   # Check FileVault status
   fdesetup status
   ```

2. **Keep macOS updated**
   ```bash
   softwareupdate -l
   sudo softwareupdate -i -a
   ```

3. **Use Touch ID/Face ID** - For authentication when available

4. **Disable unnecessary sharing**
   - System Preferences → Sharing
   - Disable services you don't need

## Performance Tuning

For better performance on macOS:

1. **Adjust memory settings** based on your dataset size

2. **Use SSD storage** (most Macs have this by default)

3. **Monitor system resources:**
   ```bash
   # Activity Monitor (GUI)
   open -a "Activity Monitor"
   
   # Command line
   top -pid $(pgrep meilisearch)
   
   # Detailed stats
   vm_stat
   ```

4. **Increase file descriptor limits:**
   ```bash
   # Check current limits
   ulimit -n
   
   # Increase temporarily
   ulimit -n 65536
   
   # Increase permanently: Add to ~/.zshrc or ~/.bash_profile
   echo "ulimit -n 65536" >> ~/.zshrc
   ```

5. **Optimize for Apple Silicon (M1/M2/M3):**
   - Ensure you're using the Apple Silicon binary
   - Native ARM builds are significantly faster than Rosetta 2 translation

---

**Deployment checklist:**
- [ ] Homebrew installed
- [ ] Meilisearch installed (Homebrew or binary)
- [ ] Data directory created with proper permissions
- [ ] Environment configuration created
- [ ] launchd plist created (for production)
- [ ] Service started and enabled
- [ ] Health check passed
- [ ] Firewall configured
- [ ] LAN access tested (if needed)
- [ ] Master key configured
- [ ] Backup strategy in place
- [ ] Reverse proxy configured (if needed)
- [ ] HTTPS configured (if applicable)
