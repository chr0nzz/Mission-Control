
// src/frontend/src/main.js

import { createApp, ref } from 'vue';
import App from './App.vue'
import 'vue-grid-layout/dist/vue-grid-layout.css';
// Optional: Import a router if you plan to have multiple views/pages
// import router from './router';

// Optional: Import a global state management solution (e.g., Pinia)
// import { createPinia } from 'pinia';

// Import global styles or Tailwind entry point if not handled by index.html or a build process
// import './assets/styles/main.css'; // Example: if you have a main.css importing Tailwind


// Create the Vue application instance
const app = createApp(App);

// Use plugins (optional)
// if (router) {
//   app.use(router);
// }
// const pinia = createPinia();
// app.use(pinia);


// --- Global Services (Conceptual - can be refined with provide/inject or Pinia actions) ---
// These would be properly structured in a larger application.
// For now, we can make them available globally for easier access in components,
// or components can import them directly.

// apiClient.js (Example structure, will be created as a separate file)
const apiClient = {
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api${endpoint}${queryString ? `?${queryString}` : ''}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error (${response.status}): ${errorData.message || 'Failed to fetch'}`);
      }
      return response.json();
    } catch (error) {
      console.error(`[apiClient] GET ${url} failed:`, error);
      throw error;
    }
  },
  async post(endpoint, body) {
    const url = `/api${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error (${response.status}): ${errorData.message || 'Failed to post'}`);
      }
      return response.json();
    } catch (error) {
      console.error(`[apiClient] POST ${url} failed:`, error);
      throw error;
    }
  },
  // Specific helper for widget data proxy
  async getWidgetData(widgetId, params = {}) {
    return this.get(`/widgets/data/${widgetId}`, params);
  }
};
// Make apiClient globally available (one way to do it, consider provide/inject for better practice)
app.config.globalProperties.$api = apiClient;
// Or for Composition API: provide('api', apiClient);

// mqttClient.js (Placeholder - will be created as a separate file using a library like MQTT.js)
// This is a simplified conceptual placeholder. A real MQTT client is more complex.
const mqttClientService = {
  client: null,
  subscriptions: new Map(), // topic -> Set of callbacks
  nextSubscriptionId: 1,
  activeSubscriptionDetails: new Map(), // id -> { topic, callback }

  async connect(brokerUrl, options) {
    // This would use the MQTT.js library
    console.warn('[mqttClient] Conceptual connect. MQTT.js library needed for actual implementation.');
    // Example: this.client = mqtt.connect(brokerUrl, options);
    // ... add event listeners for 'connect', 'message', 'error'
    // For now, simulate a connection
    return new Promise(resolve => {
        console.log(`[mqttClient] Simulating connection to ${brokerUrl}`);
        this.client = { connected: true, on: () => {}, publish: () => {}, subscribe: () => {}, unsubscribe: () => {} }; // Mock client
        resolve();
    });
  },
  subscribe(topic, callback, options = { qos: 0 }) {
    if (!this.client || !this.client.connected) {
      console.warn('[mqttClient] Cannot subscribe. Client not connected.');
      return null;
    }
    const subId = this.nextSubscriptionId++;
    this.activeSubscriptionDetails.set(subId, { topic, callback });

    let topicCallbacks = this.subscriptions.get(topic);
    if (!topicCallbacks) {
      topicCallbacks = new Set();
      this.subscriptions.set(topic, topicCallbacks);
      // Actual MQTT subscribe call: this.client.subscribe(topic, options, (err) => {...});
      console.log(`[mqttClient] Subscribed to (or added callback for) topic: ${topic} with ID ${subId}`);
    }
    topicCallbacks.add(callback);
    return subId; // Return an ID for unsubscribing this specific callback
  },
  unsubscribe(subscriptionId) {
    if (!this.client) return;
    const subDetails = this.activeSubscriptionDetails.get(subscriptionId);
    if (!subDetails) return;

    const { topic, callback } = subDetails;
    const topicCallbacks = this.subscriptions.get(topic);
    if (topicCallbacks) {
      topicCallbacks.delete(callback);
      console.log(`[mqttClient] Unsubscribed callback ID ${subscriptionId} from topic: ${topic}`);
      if (topicCallbacks.size === 0) {
        this.subscriptions.delete(topic);
        // Actual MQTT unsubscribe call: this.client.unsubscribe(topic, (err) => {...});
        console.log(`[mqttClient] No more callbacks for topic ${topic}, unsubscribing from broker.`);
      }
    }
    this.activeSubscriptionDetails.delete(subscriptionId);
  },
  publish(topic, message, options = { qos: 0, retain: false }) {
    if (!this.client || !this.client.connected) {
      console.warn('[mqttClient] Cannot publish. Client not connected.');
      return;
    }
    // Actual MQTT publish: this.client.publish(topic, message, options, (err) => {...});
    console.log(`[mqttClient] Published to ${topic}:`, message);
  },
  // Mock message handling for simulation
  _simulateMessage(topic, message) {
    const topicCallbacks = this.subscriptions.get(topic);
    if (topicCallbacks) {
      topicCallbacks.forEach(cb => cb(topic, message));
    }
  }
};
// Make mqttClient globally available
app.config.globalProperties.$mqtt = mqttClientService;
// Or provide('mqtt', mqttClientService);

// --- Theme Service (Conceptual) ---
const themeService = {
  initTheme() {
    const storedTheme = localStorage.getItem('mission_control_theme');
    const settingsTheme = window.missionControlInitialConfig?.settings?.theme || 'dark'; // Assuming initial config is loaded
    const preferredTheme = storedTheme || settingsTheme;
    this.setTheme(preferredTheme);
  },
  setTheme(theme) { // theme can be 'light', 'dark', or 'auto'
    localStorage.setItem('mission_control_theme', theme);
    if (theme === 'auto') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Dispatch an event or use a reactive variable if other components need to know
    // window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  },
  getCurrentTheme() {
    return localStorage.getItem('mission_control_theme') || 'dark';
  }
};
app.config.globalProperties.$theme = themeService;
// Or provide('theme', themeService);

// Mount the application to the #app element in index.html
app.mount('#app');

// Expose services globally for easier access from custom widgets if dynamically loaded
// This is a simplified approach. In a production app, consider event buses or more structured plugin systems.
window.missionControl = {
  apiClient: apiClient,
  mqttClient: mqttClientService,
  themeService: themeService,
  // other global utilities or services can be added here
};