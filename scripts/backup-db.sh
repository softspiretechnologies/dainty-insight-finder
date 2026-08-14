#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${MYSQL_CONFIG_FILE:-}" ]]; then
  echo "MYSQL_CONFIG_FILE must point to a protected MySQL client config file." >&2
  exit 1
fi
if [[ ! -r "${MYSQL_CONFIG_FILE}" ]]; then
  echo "MYSQL_CONFIG_FILE is not readable." >&2
  exit 1
fi

backup_root="${BACKUP_DIR:-./backups}"
mkdir -p "${backup_root}/database"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="${backup_root}/database/daintyhand-${timestamp}.sql.gz"

mysqldump --defaults-extra-file="${MYSQL_CONFIG_FILE}" --single-transaction --routines --triggers \
  | gzip -9 > "${destination}"
test -s "${destination}"
echo "Database backup created: ${destination}"
