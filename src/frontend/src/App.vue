<template>
  <div id="mission-control-app" class="flex flex-col min-h-screen">
    <header class="bg-gray-800 dark:bg-gray-900 text-white shadow-md sticky top-0 z-50 print:hidden">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-xl sm:text-2xl font-semibold tracking-tight flex items-center">
          <span class="material-icons mr-2 text-indigo-400">rocket_launch</span>
          {{ pageTitle || 'Mission Control' }}
        </h1>
        <div class="flex items-center space-x-3">
          <span v-if="mqttGlobalConnectedRef" title="MQTT Connected" class="material-icons text-green-400 animate-pulse">wifi</span>
          <span v-else title="MQTT Disconnected" class="material-icons text-red-400">wifi_off</span>

          <button @click="toggleTheme"
                  class="p-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Toggle theme">
            <span v-if="currentAppliedTheme === 'dark'" class="material-icons">light_mode</span>
            <span v-else class="material-icons">dark_mode</span>
          </button>
          </div>
      </div>
    </header>

    <main class="flex-grow container mx-auto p-2 sm:p-4 md:p-6">
      <div v-if="initialLoadingError" class="text-center p-10 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md">
          <h2 class="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center justify-center">
            <span class="material-icons mr-2 text-3xl">error_outline</span>
            Failed to Load Application
          </h2>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Could not fetch initial configuration from the server: <br> <code class="text-sm bg-red-100 dark:bg-red-800 p-1 rounded display-block my-1">{{ initialLoadingError }}</code></p>
          <p class="text-gray-500 dark:text-gray-400">Please ensure the backend server is running and accessible.</p>
          <button @click="initializeApp"
              class="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
            <span class="material-icons mr-1 align-middle text-base">refresh</span>
            Retry Initialization
          </button>
      </div>
      <DashboardView v-else />
    </main>

    <footer class="bg-gray-200 dark:bg-gray-800 text-center p-3 text-sm text-gray-600 dark:text-gray-400 print:hidden">
      Mission Control &copy; {{ new Date().getFullYear() }}. Homelab an Bord!
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, provide, computed, watch } from 'vue';
import DashboardView from './views/DashboardView.vue';

// Inject services and reactive refs provided in main.js
const apiClient = inject('apiClient');
const themeService = inject('themeService');
const currentThemeStoredRef = inject('currentTheme'); // This is the ref for the *stored* preference (light, dark, auto)
const mqttClient = inject('mqttClient');
const mqttGlobalConnectedRef = inject('mqttConnected'); // This is the reactive ref for MQTT connection status

const pageTitle = ref('Mission Control'); // Default title, will be updated from config
const appConfig = ref(null); // Will store the entire fetched config (settings & dashboard)
const initialLoadingError = ref(null);

// Computed property to reflect the *actually applied* theme (light/dark), resolving 'auto'
const currentAppliedTheme = computed(() => {
  if (!themeService) return 'dark'; // Fallback before themeService is ready
  return themeService.getCurrentAppliedTheme();
});

const toggleTheme = () => {
  if (themeService) {
    themeService.toggleTheme();
    // currentThemeStoredRef should update automatically if themeService modifies it,
    // or if we watch currentAppliedTheme and update stored preference.
    // The themeService.setTheme now updates the reactive ref if provided during init.
    if (currentThemeStoredRef) currentThemeStoredRef.value = themeService.getCurrentStoredTheme();
  }
};

const initializeApp = async () => {
  initialLoadingError.value = null;
  console.log('[App.vue] Initializing application...');
  try {
    // 1. Fetch initial application configuration
    const config = await apiClient.get('/config');
    appConfig.value = config; // Store the fetched config
    console.log('[App.vue] Configuration loaded:', config);

    // Update page title from dashboard config
    if (config.dashboard?.pageInfo?.title) {
      pageTitle.value = config.dashboard.pageInfo.title;
      document.title = config.dashboard.pageInfo.title; // Update browser tab title
    } else if (config.settings?.app_title) { // Fallback to app_title from settings.yml
      pageTitle.value = config.settings.app_title;
      document.title = config.settings.app_title;
    }


    // 2. Initialize Theme Service with theme from settings
    if (themeService) {
      // Pass the theme from settings.yml as the default, and the reactive ref from main.js
      themeService.initTheme(config.settings?.theme, currentThemeStoredRef);
    }

    // 3. Connect to MQTT broker if configured
    if (mqttClient && config.settings?.mqtt?.broker_url && (config.settings.mqtt.enable !== false)) {
      console.log('[App.vue] MQTT configuration found, attempting to connect...');
      const mqttOpts = {
        username: config.settings.mqtt.username,
        password: config.settings.mqtt.password,
        clientId: `${config.settings.mqtt.client_id_prefix || 'mc_front'}_${Math.random().toString(16).substr(2, 8)}`,
        // Pass through any MQTT.js specific options from settings.mqtt.options
        // These options are directly passed to MQTT.js connect method by mqttClientService
        ...(config.settings.mqtt.options || {}),
      };

      // TLS options from settings.yml (ca_file, cert_file, key_file, reject_unauthorized)
      // are now handled within mqttClientService.connect if settings.mqtt.tls_enabled is true.
      // We just need to pass the whole settings.mqtt.options (or a structured TLS part) to it.
      // For simplicity, if `tls_enabled` is true, mqttClientService will look for relevant file paths.
      // This assumes `config.settings.mqtt.options` might contain `ca`, `cert`, `key` as Buffers/Strings
      // if they were pre-loaded, or paths that mqttClientService can handle (which it currently doesn't for browser).
      // The current mqttClientService expects paths for Node.js, not browser.
      // For browser WSS, it usually relies on browser's trust store.
      if (config.settings.mqtt.tls_enabled) {
          mqttOpts.protocol = config.settings.mqtt.broker_url.startsWith('wss') ? 'wss' : 'mqtts'; // Ensure protocol is set for TLS
          if (config.settings.mqtt.reject_unauthorized === false) {
              mqttOpts.rejectUnauthorized = false;
          }
          // Note: Passing ca, cert, key file paths directly to browser MQTT.js for WSS is not standard.
          // These are usually for Node.js clients or specific server-side WSS setups.
          // For browser WSS, the server certificate must be trusted by the browser.
          console.warn("[App.vue] For WSS (secure WebSockets), ensure your MQTT broker's certificate is trusted by the browser. Custom CA/cert/key file paths from settings.yml are primarily for backend MQTT client or Node.js environments.");
      }


      try {
        // mqttGlobalConnectedRef is passed to connect and updated by the service
        await mqttClient.connect(config.settings.mqtt.broker_url, mqttOpts, mqttGlobalConnectedRef);
      } catch (mqttError) {
        console.error('[App.vue] Failed to connect MQTT client during initialization:', mqttError);
        if (mqttGlobalConnectedRef) mqttGlobalConnectedRef.value = false;
      }
    } else {
      console.log('[App.vue] MQTT broker URL not configured or MQTT is disabled. MQTT client not started.');
      if (mqttGlobalConnectedRef) mqttGlobalConnectedRef.value = false;
    }

  } catch (error) {
    console.error('[App.vue] Failed to load initial application configuration:', error);
    initialLoadingError.value = error.message || 'Unknown error during initialization.';
    if (mqttGlobalConnectedRef) mqttGlobalConnectedRef.value = false;
  }
};

// Provide the full appConfig reactively to child components (like DashboardView)
provide('appConfig', appConfig);


onMounted(() => {
  initializeApp();
});

// Watch the stored theme preference to potentially update the applied theme if 'auto' logic changes
watch(currentThemeStoredRef, (newStoredTheme) => {
    if (themeService && newStoredTheme) {
        themeService.setTheme(newStoredTheme);
    }
}, { immediate: false });

</script>

<style>
/* Global styles can be placed here or in a main.css imported in main.js */
#mission-control-app {
  /* Styles for the main app container if needed */
}
.material-icons {
  font-feature-settings: 'liga'; /* Enables ligatures for Material Icons font */
  user-select: none; /* Prevent text selection on icons */
}

/* Basic print styles */
@media print {
  .print\:hidden {
    display: none !important;
  }
  body {
    background-color: white !important; /* Ensure white background for printing */
    color: black !important;
  }
  .dark\:bg-gray-900, .dark\:bg-gray-800, .dark\:bg-gray-700, .dark\:bg-black {
      background-color: white !important;
  }
  .dark\:text-gray-100, .dark\:text-gray-200, .dark\:text-gray-300, .dark\:text-gray-400, .dark\:text-gray-500 {
      color: black !important;
  }
  .dark\:border-gray-700, .dark\:border-gray-600 {
      border-color: #ccc !important;
  }
  .shadow-md, .shadow-lg, .shadow-xl {
      box-shadow: none !important;
  }
}
</style>
