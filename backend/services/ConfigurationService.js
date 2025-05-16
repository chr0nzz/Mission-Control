// backend/services/ConfigurationService.js

const db = require('../index').db; // Assuming db is exported from index.js

class ConfigurationService {
  /**
   * Saves an application setting.
   * @param {string} key - The unique key for the setting.
   * @param {string} value - The value of the setting. Sensitive values should be encrypted before saving.
   * @param {string} [serviceType] - Optional type of service this setting belongs to.
   * @param {string} [serviceInstanceId] - Optional user-defined ID for multiple instances of a service.
   * @returns {Promise<void>}
   */
  static async saveSetting(key, value, serviceType = null, serviceInstanceId = null) {
    // TODO: Implement encryption for sensitive values (e.g., API keys) before saving.
    // The encryption key should be managed securely (e.g., via environment variable/Docker secret).

    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO AppSettings (setting_key, setting_value, service_type, service_instance_id)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(setting_key) DO UPDATE SET
                     setting_value = excluded.setting_value,
                     service_type = excluded.service_type,
                     service_instance_id = excluded.service_instance_id;`;
      db.run(sql, [key, value, serviceType, serviceInstanceId], function(err) {
        if (err) {
          console.error('Error saving setting:', err.message);
          reject(err);
        } else {
          console.log(`Setting saved/updated: ${key}`);
          resolve();
        }
      });
    });
  }

  /**
   * Retrieves an application setting by key.
   * @param {string} key - The unique key for the setting.
   * @returns {Promise<string|null>} - The setting value, or null if not found. Sensitive values should be decrypted after retrieving.
   */
  static async getSetting(key) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT setting_value FROM AppSettings WHERE setting_key = ?;`;
      db.get(sql, [key], (err, row) => {
        if (err) {
          console.error('Error getting setting:', err.message);
          reject(err);
        } else {
          // TODO: Implement decryption for sensitive values after retrieving.
          resolve(row ? row.setting_value : null);
        }
      });
    });
  }

   /**
   * Retrieves all application settings, optionally filtered by service type and instance ID.
   * @param {string} [serviceType] - Optional type of service to filter by.
   * @param {string} [serviceInstanceId] - Optional user-defined ID for multiple instances of a service to filter by.
   * @returns {Promise<Array<{setting_key: string, setting_value: string, service_type: string, service_instance_id: string}>>} - An array of settings. Sensitive values should be decrypted after retrieving.
   */
  static async getAllSettings(serviceType = null, serviceInstanceId = null) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT setting_key, setting_value, service_type, service_instance_id FROM AppSettings`;
      const params = [];
      const conditions = [];

      if (serviceType !== null) {
          conditions.push('service_type = ?');
          params.push(serviceType);
      }
      if (serviceInstanceId !== null) {
           conditions.push('service_instance_id = ?');
           params.push(serviceInstanceId);
      }

      if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ';';

      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error getting all settings:', err.message);
          reject(err);
        } else {
          // TODO: Implement decryption for sensitive values after retrieving.
          resolve(rows);
        }
      });
    });
  }


  /**
   * Deletes an application setting by key.
   * @param {string} key - The unique key for the setting.
   * @returns {Promise<number>} - The number of changes made (should be 1 if found and deleted).
   */
  static async deleteSetting(key) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM AppSettings WHERE setting_key = ?;`;
      db.run(sql, [key], function(err) {
        if (err) {
          console.error('Error deleting setting:', err.message);
          reject(err);
        } else {
          console.log(`Setting deleted: ${key}`);
          resolve(this.changes); // 'this.changes' is the number of rows affected
        }
      });
    });
  }

  // TODO: Add functions for encryption/decryption of sensitive values.
}

module.exports = ConfigurationService;