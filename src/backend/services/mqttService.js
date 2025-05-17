// src/backend/services/mqttService.js

const mqtt = require('mqtt'); // MQTT client library
const fs = require('fs'); // For reading TLS certificate files
const path = require('path');
const yamlService = require('./yamlService'); // To potentially access config dir for cert paths

let client = null;
let currentMqttSettings = null; // To store the MQTT connection settings from settings.yml for reference

// Store subscriptions made by the backend itself, if any.
// Key: topic, Value: { callback: function, options: object }
const backendSubscriptions = new Map();


/**
 * Generates a unique client ID.
 * @param {string} prefix - The prefix for the client ID.
 * @returns {string} A unique client ID.
 */
function generateClientId(prefix = 'missioncontrol_backend') {
  return `${prefix}_${Math.random().toString(16).substr(2, 8)}`;
}

const mqttService = {
  /**
   * Exposes the current MQTT settings used by the service.
   * Useful for server.js to check if settings changed.
   */
  get mqttSettings() {
    return currentMqttSettings;
  },

  /**
   * Connects to the MQTT broker using settings from settings.yml.
   * @param {object} settings - The MQTT specific section from settings.yml
   * (e.g., { broker_url, username, password, client_id_prefix, tls_enabled, ca_file, cert_file, key_file, options: { mqttJsSpecificOptions } })
   * @returns {Promise<void>}
   */
  async connect(settings) {
    if (client && client.connected) {
      console.log('[MQTTService] Already connected to MQTT broker.');
      return Promise.resolve();
    }

    if (!settings || !settings.broker_url) {
      const errMsg = '[MQTTService] Broker URL not provided. MQTT client will not connect.';
      console.warn(errMsg);
      currentMqttSettings = settings; // Store even if connection fails, for reference
      return Promise.reject(new Error('MQTT Broker URL is required.'));
    }

    currentMqttSettings = JSON.parse(JSON.stringify(settings)); // Store a deep copy for reference

    const options = {
      clientId: generateClientId(settings.client_id_prefix),
      username: settings.username,
      password: settings.password,
      reconnectPeriod: settings.options?.reconnectPeriod || 5000,
      connectTimeout: settings.options?.connectTimeout || 10 * 1000,
      keepalive: settings.options?.keepalive || 60,
      clean: settings.options?.clean !== undefined ? settings.options.clean : true,
      // Pass through other MQTT.js specific options from settings.mqtt.options
      ...(settings.options || {}),
    };

    // Handle TLS/SSL options
    if (settings.tls_enabled && (settings.broker_url.startsWith('mqtts://') || settings.broker_url.startsWith('wss://'))) {
      console.log('[MQTTService] TLS is enabled. Processing TLS options...');
      try {
        const configDir = yamlService.getConfigDirectory();

        if (settings.ca_file) {
          const caPath = path.isAbsolute(settings.ca_file) ? settings.ca_file : path.join(configDir, settings.ca_file);
          options.ca = [fs.readFileSync(caPath)];
          console.log(`[MQTTService] Loaded CA certificate from: ${caPath}`);
        }
        if (settings.cert_file) {
          const certPath = path.isAbsolute(settings.cert_file) ? settings.cert_file : path.join(configDir, settings.cert_file);
          options.cert = fs.readFileSync(certPath);
          console.log(`[MQTTService] Loaded client certificate from: ${certPath}`);
        }
        if (settings.key_file) {
          const keyPath = path.isAbsolute(settings.key_file) ? settings.key_file : path.join(configDir, settings.key_file);
          options.key = fs.readFileSync(keyPath);
          console.log(`[MQTTService] Loaded client key from: ${keyPath}`);
        }
        
        // rejectUnauthorized defaults to true in MQTT.js if CA is provided.
        // If no CA is provided but it's a known public CA, it should also work.
        // Only set rejectUnauthorized to false if explicitly configured by user.
        if (settings.reject_unauthorized === false) {
            options.rejectUnauthorized = false;
            console.warn('[MQTTService] WARNING: rejectUnauthorized is set to false. This is insecure and should only be used for testing with self-signed certificates without a proper CA.');
        }

      } catch (tlsError) {
        console.error(`[MQTTService] Error reading TLS certificate files: ${tlsError.message}`);
        return Promise.reject(new Error(`Failed to configure MQTT TLS: ${tlsError.message}`));
      }
    }


    return new Promise((resolve, reject) => {
      // If there's an existing client, ensure it's properly ended before creating a new one
      if (client) {
        console.log('[MQTTService] Ending previous MQTT client instance before reconnecting...');
        client.end(true, {}, () => { // Force end and call connectNew
          console.log('[MQTTService] Previous client ended. Connecting new instance.');
          connectNew(settings.broker_url, options, resolve, reject);
        });
      } else {
        connectNew(settings.broker_url, options, resolve, reject);
      }
    });
  },

  /**
   * Publishes a message to a given MQTT topic.
   * @param {string} topic - The MQTT topic to publish to.
   * @param {string | Buffer | object} message - The message payload. If an object, it will be JSON.stringified.
   * @param {object} options - MQTT publish options (e.g., qos, retain).
   * @param {function} callback - Optional callback for when publish is complete.
   * @returns {Promise<void>} Resolves when message is published (if qos > 0 and callback not provided) or immediately (qos 0).
   */
  publish(topic, message, options = { qos: 0, retain: false }, callback) {
    return new Promise((resolve, reject) => {
      if (!client || !client.connected) {
        const errMessage = '[MQTTService] Cannot publish. MQTT client not connected.';
        console.warn(errMessage);
        if (callback) callback(new Error(errMessage));
        return reject(new Error(errMessage));
      }

      let payload = message;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        try {
          payload = JSON.stringify(message);
        } catch (e) {
          console.error('[MQTTService] Error stringifying JSON message for publishing:', e);
          if (callback) callback(e);
          return reject(e);
        }
      }

      client.publish(topic, payload, options, (err) => {
        if (err) {
          console.error(`[MQTTService] Error publishing to topic '${topic}':`, err);
          if (callback) callback(err);
          return reject(err);
        }
        // console.log(`[MQTTService] Message published to topic '${topic}':`, payload);
        if (callback) callback();
        resolve();
      });
    });
  },

  /**
   * Subscribes the backend MQTT client to a topic.
   * @param {string} topic - The MQTT topic to subscribe to.
   * @param {function} onMessageCallback - Function to call when a message is received. (topic, messageString, packet) => void
   * @param {object} options - MQTT subscribe options (e.g., qos).
   * @param {function} callback - Optional callback for when subscribe is complete. (err, granted) => void
   * @returns {Promise<Array<{topic: string, qos: number}>>} Granted subscriptions.
   */
  subscribeBackend(topic, onMessageCallback, options = { qos: 0 }, callback) {
     return new Promise((resolve, reject) => {
        if (!client || !client.connected) {
            const errMessage = `[MQTTService] Cannot subscribe to ${topic}. MQTT client not connected. Will attempt on reconnect.`;
            console.warn(errMessage);
            // Store for resubscription
            backendSubscriptions.set(topic, { callback: onMessageCallback, options, isPending: true });
            if (callback) callback(new Error(errMessage));
            return reject(new Error(errMessage)); // Reject promise if not connected initially
        }

        client.subscribe(topic, options, (err, granted) => {
            if (err) {
                console.error(`[MQTTService] Error subscribing backend to topic '${topic}':`, err);
                if (callback) callback(err);
                return reject(err);
            }
            console.log(`[MQTTService] Backend subscribed to topic '${granted[0]?.topic || topic}' with QoS ${granted[0]?.qos}`);
            backendSubscriptions.set(topic, { callback: onMessageCallback, options, isPending: false });
            if (callback) callback(null, granted);
            resolve(granted);
        });
    });
  },

  /**
   * Unsubscribes the backend MQTT client from a topic.
   * @param {string} topic - The MQTT topic to unsubscribe from.
   * @param {function} callback - Optional callback for when unsubscribe is complete. (err) => void
   * @returns {Promise<void>}
   */
  unsubscribeBackend(topic, callback) {
    return new Promise((resolve, reject) => {
        if (!client || !client.connected) {
            // If not connected, just remove from our tracking; actual unsubscribe won't happen.
            console.warn(`[MQTTService] Client not connected. Removing backend subscription for '${topic}' from tracking.`);
            backendSubscriptions.delete(topic);
            if (callback) callback();
            return resolve();
        }

        client.unsubscribe(topic, {}, (err) => { // options object is mandatory for mqtt.js v5
            if (err) {
                console.error(`[MQTTService] Error unsubscribing backend from topic '${topic}':`, err);
                if (callback) callback(err);
                return reject(err);
            }
            console.log(`[MQTTService] Backend unsubscribed from topic '${topic}'`);
            backendSubscriptions.delete(topic);
            if (callback) callback();
            resolve();
        });
    });
  },

  /**
   * Re-subscribes to all topics the backend was previously subscribed to or has pending.
   * Called automatically on successful (re)connection by the 'connect' event handler.
   */
  resubscribeBackendTopics() {
    if (backendSubscriptions.size > 0) {
      console.log('[MQTTService] Re-subscribing to backend topics...');
      backendSubscriptions.forEach((sub, topic) => {
        // Only attempt to subscribe if client is valid and connected
        if (client && client.connected) {
          client.subscribe(topic, sub.options, (err, granted) => {
            if (err) {
              console.error(`[MQTTService] Error re-subscribing to ${topic}:`, err);
              sub.isPending = true; // Mark as pending again if re-subscribe fails
            } else {
              console.log(`[MQTTService] Re-subscribed to topic '${granted[0]?.topic || topic}' with QoS ${granted[0]?.qos}`);
              sub.isPending = false; // Mark as successfully subscribed
            }
          });
        } else {
            console.warn(`[MQTTService] Client not connected during re-subscribe attempt for ${topic}. Marking as pending.`);
            sub.isPending = true;
        }
      });
    }
  },

  /**
   * Checks if the MQTT client is currently connected.
   * @returns {boolean}
   */
  isConnected() {
    return client ? client.connected : false;
  },

  /**
   * Disconnects the MQTT client.
   * @param {boolean} force - Force close, do not send DISCONNECT packet. Defaults to false.
   * @param {object} options - Options for end(). Defaults to empty object.
   * @param {function} cb - Callback when disconnected.
   * @returns {Promise<void>}
   */
  disconnect(force = false, opts = {}, cb) {
    return new Promise((resolve) => {
      if (client) {
        console.log('[MQTTService] Disconnecting MQTT client...');
        // Clear any pending subscriptions as we are intentionally disconnecting
        // backendSubscriptions.clear(); // Or decide if they should persist for next connect()

        client.end(force, opts, () => {
          console.log('[MQTTService] MQTT client disconnected.');
          // Don't nullify client here if connect() is designed to reuse/replace it.
          // If connect() always creates a new client, then nullifying is fine.
          // For now, let connect() handle replacing 'client'.
          if (cb) cb();
          resolve();
        });
      } else {
        if (cb) cb();
        resolve();
      }
    });
  },

  getClient() {
    return client;
  }
};

/**
 * Internal helper to create and set up a new MQTT client instance.
 */
function connectNew(brokerUrl, options, resolve, reject) {
    if (!brokerUrl) {
        console.log('[MQTTService] Broker URL not provided. Skipping MQTT client initialization.');
        resolve();
        return;
    }

    console.log(`[MQTTService] Initializing new MQTT client instance for ${brokerUrl}`);
    client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
        console.log(`[MQTTService] ✅ Successfully connected to MQTT broker: ${brokerUrl}`);
        mqttService.resubscribeBackendTopics();
        resolve(); // Resolve the main connect promise
    });

    client.on('reconnect', () => {
        console.log(`[MQTTService] 🔄 Reconnecting to MQTT broker: ${brokerUrl}`);
    });

    client.on('error', (error) => {
        console.error(`[MQTTService] ❌ MQTT Connection Error: ${error.message}`);
        // Only reject the initial connect promise. Subsequent errors are handled by reconnect logic.
        // The 'close' event will indicate definitive closure if reconnects fail.
        if (!client.connected && !client.reconnecting && typeof reject === 'function' && !client. disconnecting) {
            reject(error);
        }
    });

    client.on('offline', () => {
        console.warn('[MQTTService] ⚠️ MQTT client is offline.');
    });

    client.on('close', () => {
        console.log('[MQTTService] MQTT connection closed.');
        // If not intentionally disconnecting, this might be after failed reconnects.
    });

    client.on('message', (topic, message, packet) => {
        if (backendSubscriptions.has(topic)) {
            const sub = backendSubscriptions.get(topic);
            try {
                sub.callback(topic, message.toString(), packet);
            } catch (callbackError) {
                console.error(`[MQTTService] Error in backend subscription callback for topic ${topic}:`, callbackError);
            }
        } else {
            // This can happen if frontend subscribes via backend proxy, or unexpected message
            // console.debug(`[MQTTService] Message on unhandled backend-subscribed topic '${topic}': ${message.toString()}`);
        }
    });
}


// Graceful shutdown
let shuttingDownMqtt = false;
async function gracefulMqttShutdown(signal) {
    if (shuttingDownMqtt) return;
    shuttingDownMqtt = true;
    if (mqttService.isConnected()) {
        console.log(`[MQTTService] ${signal} received. Disconnecting MQTT client...`);
        await mqttService.disconnect(false, {}); // Graceful disconnect
    }
    // No process.exit here, let server.js handle that.
}

process.on('SIGINT', () => gracefulMqttShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulMqttShutdown('SIGTERM'));

module.exports = mqttService;
