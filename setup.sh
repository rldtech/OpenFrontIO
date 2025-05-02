#!/bin/bash
# Comprehensive setup script for Hetzner server with Docker and user setup
# Exit on error
set -e

echo "====================================================="
echo "🚀 STARTING SERVER SETUP"
echo "====================================================="

# Verify required environment variables
if [ -z "$OTEL_ENDPOINT" ] || [ -z "$OTEL_USERNAME" ] || [ -z "$OTEL_PASSWORD" ]; then
    echo "❌ ERROR: Required environment variables are not set!"
    exit 1
fi

echo "🔄 Updating system..."
apt update && apt upgrade -y

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "Docker is already installed"
else
    echo "🐳 Installing Docker..."
    # Install Docker using official script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable --now docker
    echo "Docker installed successfully"
fi

echo "👤 Setting up openfront user..."
# Create openfront user if it doesn't exist
if id "openfront" &>/dev/null; then
    echo "User openfront already exists"
else
    useradd -m -s /bin/bash openfront
    echo "User openfront created"
fi

# Check if openfront is already in docker group
if groups openfront | grep -q '\bdocker\b'; then
    echo "User openfront is already in the docker group"
else
    # Add openfront to docker group
    usermod -aG docker openfront
    echo "Added openfront to docker group"
fi

# Create .ssh directory for openfront if it doesn't exist
if [ ! -d "/home/openfront/.ssh" ]; then
    mkdir -p /home/openfront/.ssh
    chmod 700 /home/openfront/.ssh
    echo "Created .ssh directory for openfront"
fi

# Copy SSH keys from root if they exist and haven't been copied yet
if [ -f /root/.ssh/authorized_keys ] && [ ! -f /home/openfront/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/openfront/.ssh/
    chmod 600 /home/openfront/.ssh/authorized_keys
    echo "SSH keys copied from root to openfront"
fi

# Configure UDP buffer sizes for Cloudflare Tunnel
# https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes
echo "🔧 Configuring UDP buffer sizes..."
# Check if settings already exist in sysctl.conf
if grep -q "net.core.rmem_max" /etc/sysctl.conf && grep -q "net.core.wmem_max" /etc/sysctl.conf; then
    echo "UDP buffer size settings already configured"
else
    # Add UDP buffer size settings to sysctl.conf
    echo "# UDP buffer size settings for improved QUIC performance" >> /etc/sysctl.conf
    echo "net.core.rmem_max=7500000" >> /etc/sysctl.conf
    echo "net.core.wmem_max=7500000" >> /etc/sysctl.conf
    
    # Apply the settings immediately
    sysctl -p
    echo "UDP buffer sizes configured and applied"
fi

# Set proper ownership for openfront's home directory
chown -R openfront:openfront /home/openfront
echo "Set proper ownership for openfront's home directory"

# Create directory for Telegraf configuration
echo "📊 Setting up Telegraf for metrics collection..."
TELEGRAF_CONFIG_DIR="/home/openfront/telegraf"

if [ ! -d "$TELEGRAF_CONFIG_DIR" ]; then
    mkdir -p "$TELEGRAF_CONFIG_DIR"
    echo "Created Telegraf configuration directory"
fi

# Generate Base64 auth string
BASE64_AUTH=$(echo -n "${OTEL_USERNAME}:${OTEL_PASSWORD}" | base64)

# Create Telegraf configuration file with actual values
cat > "$TELEGRAF_CONFIG_DIR/telegraf.conf" << EOF
# Global agent configuration
[agent]
  interval = "10s"
  round_interval = true
  metric_batch_size = 1000
  metric_buffer_limit = 10000
  collection_jitter = "0s"
  flush_interval = "10s"
  flush_jitter = "0s"
  precision = ""
  hostname = ""  # Leave this blank to use system hostname
  omit_hostname = false

# Input plugins - collect host metrics
[[inputs.cpu]]
  percpu = true
  totalcpu = true
  collect_cpu_time = false
  report_active = false

[[inputs.disk]]
  ignore_fs = ["tmpfs", "devtmpfs", "devfs", "iso9660", "overlay", "aufs", "squashfs"]

[[inputs.diskio]]

[[inputs.mem]]

[[inputs.net]]

[[inputs.system]]

[[inputs.processes]]

[[inputs.kernel]]

# Output plugin - Using HTTP instead of OpenTelemetry
[[outputs.http]]
  # The full URL with protocol and path
  url = "${OTEL_ENDPOINT}/v1/metrics"
  
  # HTTP method - typically POST for sending metrics
  method = "POST"
  
  # Timeout settings
  timeout = "5s"
  
  # Output data format
  data_format = "json"
  
  # SSL/TLS settings
  insecure_skip_verify = false
  
  # HTTP Headers including authentication
  [outputs.http.headers]
    Authorization = "Basic ${BASE64_AUTH}"
    Content-Type = "application/json"
EOF

# Set ownership of all files
chown -R openfront:openfront "$TELEGRAF_CONFIG_DIR"

# Starting Telegraf directly in the main script
echo "🚀 Starting Telegraf container..."

# Pull latest Telegraf image
echo "Pulling latest Telegraf image..."
docker pull telegraf:latest

# Stop and remove any existing Telegraf container
echo "Removing any existing Telegraf container..."
docker rm -f telegraf 2>/dev/null || true

# Start the Telegraf container
echo "Starting Telegraf container..."
docker run -d \
  --name telegraf \
  --restart unless-stopped \
  --hostname $(hostname) \
  --network host \
  -v "$TELEGRAF_CONFIG_DIR/telegraf.conf:/etc/telegraf/telegraf.conf:ro" \
  -v /:/hostfs:ro \
  -v /proc:/hostfs/proc:ro \
  -v /sys:/hostfs/sys:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e HOST_PROC=/hostfs/proc \
  -e HOST_SYS=/hostfs/sys \
  -e HOST_MOUNT_PREFIX=/hostfs \
  -e OTEL_ENDPOINT=${OTEL_ENDPOINT} \
  -e OTEL_USERNAME=${OTEL_USERNAME} \
  -e OTEL_PASSWORD=${OTEL_PASSWORD} \
  telegraf:latest

# Verify the container is running
if docker ps | grep -q telegraf; then
  echo "✅ Telegraf started successfully!"
else
  echo "❌ Failed to start Telegraf container. Check logs with: docker logs telegraf"
  exit 1
fi

echo "====================================================="
echo "🎉 SETUP COMPLETE!"
echo "====================================================="
echo "The openfront user has been set up and has Docker permissions."
echo "UDP buffer sizes have been configured for optimal QUIC/WebSocket performance."
echo "Telegraf has been installed and configured to collect host metrics."
echo ""
echo "📝 Telegraf Configuration:"
echo "   - Config Directory: $TELEGRAF_CONFIG_DIR"
echo "   - OpenTelemetry Endpoint: $OTEL_ENDPOINT"
echo "   - Username: $OTEL_USERNAME"
echo ""
echo "🔄 To restart Telegraf: docker restart telegraf"
echo "🔍 To view Telegraf logs: docker logs telegraf"
echo "🛑 To stop Telegraf: docker stop telegraf"
echo "====================================================="