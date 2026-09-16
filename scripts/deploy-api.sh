#!/usr/bin/env bash
# Deploy task-api dari laptop ke VPS tanpa akses GitHub di VPS (repo private):
# kirim `git archive HEAD:task-api` lewat SSH, lalu rebuild container.
# DB dipisah ke Neon (bukan container lokal) -- lihat task-api/docker-compose.vps.yml.
#   bash scripts/deploy-api.sh [ssh-alias]   (default: bot-vps)
set -euo pipefail
HOST="${1:-bot-vps}"
APP_DIR="/opt/task-management-api"
cd "$(dirname "$0")/.."
echo "==> kirim $(git rev-parse --short HEAD) (task-api/) ke $HOST:$APP_DIR"
git archive --format=tar HEAD:task-api | ssh -o BatchMode=yes "$HOST" \
  "sudo mkdir -p $APP_DIR && sudo tar -x -C $APP_DIR -f - && sudo chown -R deploy:deploy $APP_DIR"
echo "==> rebuild & restart"
ssh -o BatchMode=yes "$HOST" \
  "cd $APP_DIR && sudo docker compose -f docker-compose.vps.yml up -d --build --force-recreate"
ssh -o BatchMode=yes "$HOST" "sleep 8; sudo docker compose -f $APP_DIR/docker-compose.vps.yml logs --since 30s 2>&1 | grep -E 'Task Management API Server|Error|error' | tail -5"
