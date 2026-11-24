#!/usr/bin/env bash
# =====================================================================================
# Market Food - one-shot server setup for a fresh Ubuntu VPS.
#
#   git clone <repo> /root/grossimarche-platform
#   cd /root/grossimarche-platform
#   sudo bash deploy.sh
#
# In order: installs Docker + certbot, opens the firewall, gets the Let's Encrypt
# certificate (only if it does not exist yet), installs the renewal hooks, then builds and
# starts the whole stack. Safe to run again: every step skips what is already done, and the
# last step rebuilds - so after a `git pull` the same command deploys the update.
#
# DNS must already point marketfoood.com (and www) at this server, or certbot fails.
# =====================================================================================
set -euo pipefail

DOMAIN="marketfoood.com"
EMAIL="marketfood98@gmail.com"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml"

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash deploy.sh" >&2
  exit 1
fi

step "Packages (git, curl, certbot)"
apt-get update -qq
apt-get install -y -qq git curl certbot ufw

step "Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

step "Firewall (22, 80, 443)"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

step "TLS certificate for $DOMAIN"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "Certificate already present - skipping."
else
  # Standalone mode needs port 80 free: stop the proxy if a previous run left it up.
  $COMPOSE stop proxy 2>/dev/null || true
  certbot certonly --standalone --non-interactive --agree-tos --no-eff-email \
    -m "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN"
fi

step "Certificate renewal hooks"
# certbot renews on its own timer; it needs port 80 for a few seconds, so the proxy is
# stopped before and started again after (the new certificate is picked up on start).
mkdir -p /etc/letsencrypt/renewal-hooks/pre /etc/letsencrypt/renewal-hooks/post
cat > /etc/letsencrypt/renewal-hooks/pre/stop-proxy.sh <<EOF
#!/bin/sh
$COMPOSE stop proxy
EOF
cat > /etc/letsencrypt/renewal-hooks/post/start-proxy.sh <<EOF
#!/bin/sh
$COMPOSE start proxy
EOF
chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-proxy.sh \
         /etc/letsencrypt/renewal-hooks/post/start-proxy.sh

step "Build and start the stack"
$COMPOSE up -d --build

step "Status"
$COMPOSE ps
echo
echo "Done. The site should answer at https://$DOMAIN in a minute or two"
echo "(the backend and LibreTranslate take a while on the first start)."
echo "Logs:  $COMPOSE logs -f backend"
