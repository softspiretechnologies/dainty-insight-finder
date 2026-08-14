# Backup and disaster recovery

Persistent uploads keep files across deployments; they are not a backup. Store database and upload archives outside the Hostinger account when possible.

## Schedule and retention

Run both scripts from a protected cron environment. Keep 7 daily, 4 weekly, and 3 monthly recovery points. Prune archives only after confirming a newer backup is readable and copied off-host.

## Database backup

Create a mode-600 MySQL option file outside the repository:

```ini
[client]
host=...
user=...
password=...
database=...
```

Run `MYSQL_CONFIG_FILE=/secure/path/mysql.cnf BACKUP_DIR=/secure/backups ./scripts/backup-db.sh`. Credentials are read by `mysqldump` and are not printed or placed on its command line.

Restore into an empty, tested database with:

```bash
gzip -dc /secure/backups/database/daintyhand-TIMESTAMP.sql.gz | mysql --defaults-extra-file=/secure/path/mysql.cnf
```

Apply any newer application migrations after the restore, then run a smoke check.

## Upload backup

Run `UPLOADS_DIR=/absolute/persistent/uploads BACKUP_DIR=/secure/backups ./scripts/backup-uploads.sh`.

To restore, stop writes, move the current upload directory aside, create a clean directory with the same ownership, and extract the chosen archive:

```bash
tar -C /absolute/persistent/uploads -xzf /secure/backups/uploads/uploads-TIMESTAMP.tar.gz
```

Verify representative product, category, and service images before removing the old directory. Test restores regularly; an untested archive is not a recovery plan.
