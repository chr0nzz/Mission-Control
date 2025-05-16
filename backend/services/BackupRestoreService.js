const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const zlib = require('zlib');

class BackupRestoreService {
  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, 'missioncontrol.db');
    this.configDir = process.env.CONFIG_DIR || path.join(__dirname, 'config'); // Directory for YAML config files
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, 'backups'); // Directory to store backups
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:T\-]/g, '').slice(0, 14);
    const backupFileName = `missioncontrol_backup_${timestamp}.gz`;
    const backupFilePath = path.join(this.backupDir, backupFileName);

    try {
      await fs.mkdir(this.backupDir, { recursive: true }); // Ensure backup directory exists

      const gzip = zlib.createGzip();
      const outputFile = fs.createWriteStream(backupFilePath);

      // Create a tar archive and pipe it through gzip
      const archive = require('archiver')('tar', {
        gzip: true,
        gzipOptions: {
          level: 6 // Compression level
        }
      });

      archive.on('error', (err) => {
        throw new Error(`Archiving error: ${err.message}`);
      });

      archive.pipe(outputFile);

      // Add the database file
      archive.file(this.dbPath, { name: path.basename(this.dbPath) });

      // Add the config directory (YAML files)
      archive.directory(this.configDir, 'config'); // Store config files in 'config' subdirectory within the archive

      await archive.finalize();

      console.log(`Backup created successfully at ${backupFilePath}`);
      return backupFilePath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  async restoreBackup(backupFilePath) {
    try {
      if (!backupFilePath || !fs.existsSync(backupFilePath)) {
        throw new Error('Invalid backup file path');
      }

      const gunzip = zlib.createGunzip();
      const inputFile = fs.createReadStream(backupFilePath);

      const tar = require('tar-stream');
      const extract = tar.extract();

      extract.on('entry', async (header, stream, next) => {
        const entryPath = path.join(this.backupDir, header.name);

        if (header.type === 'file') {
          const fileContent = await new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
          });

          if (header.name === path.basename(this.dbPath)) {
            // Restore the database file
            await fs.writeFile(this.dbPath, fileContent);
            console.log(`Restored database file: ${header.name}`);
          } else if (header.name.startsWith('config/')) {
            // Restore a config file
            const configFilePath = path.join(this.configDir, header.name.substring(7)); // Remove 'config/' prefix
            await fs.mkdir(path.dirname(configFilePath), { recursive: true }); // Ensure directory exists
            await fs.writeFile(configFilePath, fileContent);
            console.log(`Restored config file: ${header.name}`);
          }

          stream.resume();
        }

        stream.on('end', () => {
          next();
        });
      });

      extract.on('finish', () => {
        console.log('Backup restored successfully');
      });

      inputFile.pipe(gunzip).pipe(extract);

    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw new Error(`Backup restoration failed: ${error.message}`);
    }
  }
}

module.exports = BackupRestoreService;