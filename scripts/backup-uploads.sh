#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${UPLOADS_DIR:-}" ]]; then
  echo "UPLOADS_DIR is required." >&2
  exit 1
fi
if [[ ! -d "${UPLOADS_DIR}" || ! -r "${UPLOADS_DIR}" ]]; then
  echo "UPLOADS_DIR is not a readable directory." >&2
  exit 1
fi

backup_root="${BACKUP_DIR:-./backups}"
mkdir -p "${backup_root}/uploads"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="${backup_root}/uploads/uploads-${timestamp}.tar.gz"

tar -C "${UPLOADS_DIR}" -czf "${destination}" .
test -s "${destination}"
echo "Uploads backup created: ${destination}"
