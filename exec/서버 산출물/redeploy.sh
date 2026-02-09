#!/usr/bin/env bash
set -euo pipefail
cd /opt/unblur/infra
docker compose pull be fe
docker compose up -d be fe
