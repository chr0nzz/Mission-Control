# 💾 Backup and Restore

Regularly backing up your Mission Control data is highly recommended to protect your dashboard configuration, widget settings, and service credentials.

### What is Backed Up?

A Mission Control backup includes:
-   📊 Your SQLite database file (`missioncontrol.db`), containing dashboard layouts, widget configurations, user preferences, and encrypted service credentials.
-   ⚙️ Your YAML configuration files, which store application-level defaults and settings.

### Backup Procedure

For the highest level of data consistency, the recommended backup method involves temporarily stopping the Mission Control containers.

1.  Access the Backup & Restore section in the **Settings Application** (TODO: Link to Settings App section).
2.  Click the "Create Backup" button.
3.  The backend will initiate a process that stops the necessary containers, copies the database and configuration files to a designated backup location (TODO: Specify default backup location or how to configure it), archives them (e.g., into a ZIP or TAR.GZ file), and then restarts the containers.
4.  You will be able to download the backup archive via the UI once completed.

Alternatively, you can manually stop the containers and copy the files:
```bash
docker compose down
# Copy /path/to/your/mission-control-data-volumes/sqlite_data/missioncontrol.db
# Copy /path/to/your/mission-control-config-volumes/... (YAML files)
# Archive the copied files
docker compose up -d
```
(TODO: Provide clearer instructions on volume paths and YAML file locations)

### Restore Procedure

Restoring from a backup will overwrite your current Mission Control data.

1.  Access the Backup & Restore section in the **Settings Application**.
2.  Use the "Upload & Restore Backup" option to upload your backup archive.
3.  The backend will initiate a process that stops the necessary containers, extracts the database and configuration files from the archive, replaces the current files in the data volumes, and then restarts the containers.
4.  **⚠️ Warning:** Restoring will replace your current dashboard layout, widget configurations, and service credentials with the data from the backup. Ensure you have the correct backup file.