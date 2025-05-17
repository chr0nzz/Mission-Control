// src/frontend/src/services/mqttClientService.js

import * as mqtt from 'mqtt/dist/mqtt.min'; // Import browser-compatible version of MQTT.js

/**
 * mqttClientService.js
 *
 * Manages the MQTT connection and subscriptions for the frontend.
 * Assumes the MQTT broker is configured for WebSockets (ws:// or wss://).
 */

let client = null;
const subscriptions = new Map(); // key: subscriptionId, value: { topic: string, callback: function, options: object }
let nextSubscriptionId = 1;
let connectionPromise = null;
let connectionStatusRef = null; // Optional Vue ref for global status

const mqttClientService = {
  /**
   * Connects to the MQTT broker.
   * @param {string} brokerUrl - The WebSocket URL of the MQTT broker (e.g., "ws://localhost:9001").
   * @param {object} options - MQTT connection options (e.g., username, password, clientId).
   * @param {import('vue').Ref<boolean>} [reactiveStatusRef] - Optional Vue ref to update with connection status.
   * @returns {Promise<mqtt.MqttClient>} Resolves with the client instance on successful connection.
   */
  connect(brokerUrl, options = {}, reactiveStatusRef = null) {
    if (client && client.connected) {
      console.log('[MQTTClientService] Already connected.');
      if (reactiveStatusRef) reactiveStatusRef.value = true;
      return Promise.resolve(client);
    }

    if (connectionPromise) {
      console.log('[MQTTClientService] Connection attempt already in progress.');
      return connectionPromise;
    }
    
    if (reactiveStatusRef) {
        connectionStatusRef = reactiveStatusRef;
        connectionStatusRef.value = false; // Set to false initially
    }

    const connectOptions = {
      clientId: options.clientId || `mission_control_front_${Math.random().toString(16).substr(2, 8)}`,
      username: options.username,
      password: options.password,
      reconnectPeriod: options.reconnectPeriod || 5000, // milliseconds
      connectTimeout: options.connectTimeout || 10 * 1000, // milliseconds
      // For wss://, TLS options might be needed if using self-signed certs,
      // but browsers handle standard TLS validation for WebSockets.
      // Custom CA for wss might be tricky in browser without specific browser config.
      ...options.mqttJsOptions, // Allow passing any other MQTT.js specific options
    };

    console.log(`[MQTTClientService] Attempting to connect to MQTT broker: ${brokerUrl} with client ID ${connectOptions.clientId}`);

    connectionPromise = new Promise((resolve, reject) => {
      try {
        client = mqtt.connect(brokerUrl, connectOptions);
      } catch (error) {
        console.error('[MQTTClientService] MQTT connection instantiation error:', error);
        connectionPromise = null;
        if (connectionStatusRef) connectionStatusRef.value = false;
        reject(error);
        return;
      }

      client.on('connect', () => {
        console.log(`[MQTTClientService] ✅ Connected to MQTT broker: ${brokerUrl}`);
        if (connectionStatusRef) connectionStatusRef.value = true;
        // Re-subscribe to all topics upon successful (re)connection
        this._resubscribeAll();
        connectionPromise = null; // Clear promise once connected
        resolve(client);
      });

      client.on('reconnect', () => {
        console.log(`[MQTTClientService] 🔄 Reconnecting to MQTT broker...`);
        if (connectionStatusRef) connectionStatusRef.value = false; // Show as disconnected during reconnect
      });

      client.on('error', (error) => {
        console.error(`[MQTTClientService] ❌ MQTT Connection Error: ${error.message}`);
        // Don't reject promise here if it's a reconnect attempt error,
        // as the client handles retries. Only reject on initial connect failure.
        if (!client.connected && !client.reconnecting && connectionPromise) { // Check if it's the initial attempt
            connectionPromise = null;
            if (connectionStatusRef) connectionStatusRef.value = false;
            reject(error);
        }
      });

      client.on('offline', () => {
        console.warn('[MQTTClientService] ⚠️ MQTT client is offline.');
        if (connectionStatusRef) connectionStatusRef.value = false;
      });

      client.on('close', () => {
        console.log('[MQTTClientService] MQTT connection closed.');
        if (connectionStatusRef) connectionStatusRef.value = false;
        // Do not nullify client here if auto-reconnect is enabled by default
      });

      client.on('message', (topic, messageBuffer, packet) => {
        const messageString = messageBuffer.toString();
        // console.log(`[MQTTClientService] Raw message on topic '${topic}': ${messageString}`);
        subscriptions.forEach((sub) => {
          // Basic topic matching (no wildcards implemented here for simplicity, MQTT.js handles it)
          // This loop is if we want to call multiple callbacks for the same topic if broker sends it once.
          // MQTT.js client itself will only emit 'message' once per incoming message.
          // The key is that the `client.on('message')` is the single point of reception.
          // We then iterate our *internal* subscription map to see who is interested.
          // A more efficient way is if MQTT.js allows multiple handlers per topic, or if we manage topics more granularly.
          // For now, if a component subscribes, its callback is stored.
          // This needs to be refined if a single component subscribes multiple times to the same topic with different callbacks.
          // The current model with subscriptionId is better:
          if (sub.topic === topic || this._topicMatches(sub.topic, topic)) { // Basic wildcard check needed
            try {
              sub.callback(topic, messageString, packet);
            } catch (callbackError) {
              console.error(`[MQTTClientService] Error in message callback for topic ${topic} (ID ${sub.id}):`, callbackError);
            }
          }
        });
      });
    });
    return connectionPromise;
  },

  /**
   * Subscribes to an MQTT topic.
   * @param {string} topic - The topic to subscribe to.
   * @param {function} callback - Function to call when a message is received. (topic, messageString, packet) => void
   * @param {object} options - MQTT subscribe options (e.g., qos).
   * @returns {number | null} A subscription ID for unsubscribing, or null if failed.
   */
  subscribe(topic, callback, options = { qos: 0 }) {
    if (!client || !client.connected) {
      console.warn(`[MQTTClientService] Cannot subscribe to "${topic}". Client not connected. Will attempt on reconnect.`);
      // Store it to attempt on reconnect
      const subId = nextSubscriptionId++;
      subscriptions.set(subId, { topic, callback, options, id: subId, isPending: true });
      return subId;
    }

    const subId = nextSubscriptionId++;
    subscriptions.set(subId, { topic, callback, options, id: subId, isPending: false });

    client.subscribe(topic, options, (err, granted) => {
      if (err) {
        console.error(`[MQTTClientService] Error subscribing to topic '${topic}':`, err);
        subscriptions.delete(subId); // Remove failed subscription
        // Potentially emit an error or return a specific failure indicator
        return null; // Indicate failure
      }
      if (granted && granted.length > 0) {
        console.log(`[MQTTClientService] Subscribed to topic '${granted[0].topic}' with QoS ${granted[0].qos} (ID: ${subId})`);
      } else {
         console.warn(`[MQTTClientService] Subscription to '${topic}' granted but no details returned, or not granted.`);
      }
    });
    return subId;
  },

  /**
   * Unsubscribes from a previously made subscription using its ID.
   * @param {number} subscriptionId - The ID returned by the subscribe method.
   */
  unsubscribe(subscriptionId) {
    const sub = subscriptions.get(subscriptionId);
    if (!sub) {
      console.warn(`[MQTTClientService] No subscription found with ID: ${subscriptionId}`);
      return;
    }

    subscriptions.delete(subscriptionId); // Remove from our internal tracking

    // Check if other subscriptions exist for the same topic before unsubscribing from broker
    let stillSubscribedToTopic = false;
    subscriptions.forEach(s => {
      if (s.topic === sub.topic) {
        stillSubscribedToTopic = true;
      }
    });

    if (!stillSubscribedToTopic && client && client.connected) {
      client.unsubscribe(sub.topic, {}, (err) => { // options object is mandatory for mqtt.js v5
        if (err) {
          console.error(`[MQTTClientService] Error unsubscribing from topic '${sub.topic}':`, err);
        } else {
          console.log(`[MQTTClientService] Unsubscribed from topic '${sub.topic}' on broker.`);
        }
      });
    } else if (stillSubscribedToTopic) {
        console.log(`[MQTTClientService] Removed callback ID ${subscriptionId} for topic '${sub.topic}', but other subscriptions exist.`);
    }
  },

  _resubscribeAll() {
    if (subscriptions.size > 0) {
      console.log('[MQTTClientService] Re-subscribing to topics after (re)connection...');
      subscriptions.forEach((sub, subId) => {
        if (client && client.connected) { // Ensure client is valid
          client.subscribe(sub.topic, sub.options, (err, granted) => {
            if (err) {
              console.error(`[MQTTClientService] Error re-subscribing to topic '${sub.topic}' (ID ${subId}):`, err);
            } else if (granted && granted.length > 0) {
              console.log(`[MQTTClientService] Re-subscribed to topic '${granted[0].topic}' with QoS ${granted[0].qos} (ID: ${subId})`);
              sub.isPending = false;
            }
          });
        } else {
            console.warn(`[MQTTClientService] Client not connected during re-subscribe attempt for ${sub.topic}`);
            sub.isPending = true; // Mark as pending if client disconnected again
        }
      });
    }
  },
  
  // Basic wildcard matching (for internal callback dispatch if needed, MQTT.js handles actual sub)
  _topicMatches(filter, topic) {
    if (filter === topic) return true;
    // This is a very simplified matcher, doesn't handle all MQTT wildcard cases correctly.
    // For robust wildcard support, rely on MQTT.js's own subscription mechanism.
    // This helper is more for the internal dispatch if multiple callbacks share a wildcard sub.
    if (filter.endsWith('/#')) {
        const baseFilter = filter.substring(0, filter.length - 2);
        return topic.startsWith(baseFilter);
    }
    // Add '+' wildcard handling if necessary, but it gets complex.
    return false;
  },

  /**
   * Publishes a message to an MQTT topic.
   * @param {string} topic - The topic to publish to.
   * @param {string | Buffer | object} message - The message payload. Objects are JSON.stringified.
   * @param {object} options - MQTT publish options (e.g., qos, retain).
   * @returns {Promise<void>}
   */
  publish(topic, message, options = { qos: 0, retain: false }) {
    return new Promise((resolve, reject) => {
      if (!client || !client.connected) {
        const errMessage = '[MQTTClientService] Cannot publish. MQTT client not connected.';
        console.warn(errMessage);
        return reject(new Error(errMessage));
      }

      let payload = message;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        try {
          payload = JSON.stringify(message);
        } catch (e) {
          console.error('[MQTTClientService] Error stringifying JSON message for publishing:', e);
          return reject(e);
        }
      }

      client.publish(topic, payload, options, (err) => {
        if (err) {
          console.error(`[MQTTClientService] Error publishing to topic '${topic}':`, err);
          return reject(err);
        }
        // console.log(`[MQTTClientService] Message published to topic '${topic}'`);
        resolve();
      });
    });
  },

  /**
   * Disconnects the MQTT client.
   * @param {boolean} force - Force close, do not send DISCONNECT.
   * @param {object} opts - Options for end().
   * @returns {Promise<void>}
   */
  disconnect(force = false, opts = {}) {
    return new Promise((resolve) => {
      if (client) {
        console.log('[MQTTClientService] Disconnecting MQTT client...');
        client.end(force, opts, () => {
          console.log('[MQTTClientService] MQTT client disconnected.');
          if (connectionStatusRef) connectionStatusRef.value = false;
          // client = null; // Setting to null might prevent auto-reconnect logic if that's desired later.
          // For now, allow `connect` to reuse if `end` doesn't fully destroy.
          connectionPromise = null; // Reset connection promise
          resolve();
        });
      } else {
        resolve();
      }
    });
  },

  isConnected() {
    return client ? client.connected : false;
  },

  getClient() {
      return client; // Expose client for advanced use cases if necessary
  }
};

export default mqttClientService;
