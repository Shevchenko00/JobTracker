#!/bin/bash
set -e

LATEST=$(ls -t /backups/jobs_*.sql 2>/dev/null | head -n1)

if [ -n "$LATEST" ]; then
  echo "[init-restore] Found dump: $LATEST — restoring..."
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$LATEST"
  echo "[init-restore] Restore complete."
else
  echo "[init-restore] No dump found in /backups, starting with empty DB."
fi