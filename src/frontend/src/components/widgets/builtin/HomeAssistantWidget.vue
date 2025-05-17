<template>
  <div class="home-assistant-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading HA entity...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="entityState" class="space-y-1">
      <div class="flex items-center justify-between mb-1">
        <h4 class="font-semibold text-gray-800 dark:text-gray-100 truncate" :title="entityFriendlyName">
          <span v-if="showEntityIcon && entityIcon" class="material-icons text-base mr-1 align-middle" :style="{ color: entityIconColor }">
            {{ entityIcon }}
          </span>
          {{ entityFriendlyName }}
        </h4>
        <span class="text-lg font-bold px-2 py-0.5 rounded"
              :class="stateDisplayClass(entityState.state)">
          {{ entityState.state }}
        </span>
      </div>
      <div v-if="showLastChanged" class="text-xs text-gray-500 dark:text-gray-400">
        Last Changed: {{ formatRelativeTime(entityState.last_changed) }}
      </div>
      <div v-if="attributesToDisplay && attributesToDisplay.length > 0" class="attributes mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
        <div v-for="attr in attributesToDisplay" :key="attr.key" class="flex justify-between text-gray-600 dark:text-gray-300">
          <span class="capitalize">{{ attr.key.replace(/_/g, ' ') }}:</span>
          <span class="font-medium text-gray-700 dark:text-gray-200 truncate ml-1" :title="String(attr.value)">{{ String(attr.value) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      HA entity data not available. Check configuration.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, inject, computed } from 'vue';

const props = defineProps({
  widgetId: { type: String, required: true },
  options: {
    type: Object,
    default: () => ({
      ha_url: '',
      long_lived_token: '',
      entity_id: '',
      custom_label: '',
      show_attributes: [], // e.g., ['brightness', 'temperature'] or '*' for all
      show_last_changed: true,
      use_entity_icon: true,
      refresh_interval: 60, // seconds
      // use_websocket: false, // Future: for real-time updates
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const entityState = ref(null); // Stores the full state object from HA API
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => entityState.value && entityState.value.state !== undefined);

const effectiveOptions = computed(() => ({
  ha_url: props.options.ha_url || '',
  long_lived_token: props.options.long_lived_token || '',
  entity_id: props.options.entity_id || '',
  custom_label: props.options.custom_label,
  show_attributes: Array.isArray(props.options.show_attributes) ? props.options.show_attributes : [],
  show_last_changed: props.options.show_last_changed !== false,
  use_entity_icon: props.options.use_entity_icon !== false,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 60,
}));

const entityFriendlyName = computed(() => {
  if (effectiveOptions.value.custom_label) return effectiveOptions.value.custom_label;
  return entityState.value?.attributes?.friendly_name || effectiveOptions.value.entity_id;
});

const showLastChanged = computed(() => effectiveOptions.value.show_last_changed);
const showEntityIcon = computed(() => effectiveOptions.value.use_entity_icon);

const entityIcon = computed(() => {
  return entityState.value?.attributes?.icon?.replace('mdi:', '') || getDefaultIcon(entityState.value?.entity_id);
});

const entityIconColor = computed(() => {
    // Example: if it's a light and it's on, and has rgb_color attribute
    if (entityState.value?.entity_id?.startsWith('light.') && entityState.value?.state === 'on') {
        if (entityState.value?.attributes?.rgb_color) {
            const [r, g, b] = entityState.value.attributes.rgb_color;
            return `rgb(${r}, ${g}, ${b})`;
        }
        if (entityState.value?.attributes?.hs_color) { // Fallback for hs color if needed
             // Conversion from HS to RGB is more complex, placeholder
            return 'var(--primary-color)'; // Use a theme color
        }
    }
    return entityState.value?.attributes?.icon_color || 'inherit'; // Or a default color
});


const attributesToDisplay = computed(() => {
  if (!entityState.value || !entityState.value.attributes) return [];
  const attributes = effectiveOptions.value.show_attributes;
  if (attributes.includes('*')) { // Show all attributes
    return Object.entries(entityState.value.attributes)
      .filter(([key]) => !['friendly_name', 'icon', 'entity_picture'].includes(key)) // Exclude common ones
      .map(([key, value]) => ({ key, value }));
  }
  return attributes
    .map(attrKey => ({ key: attrKey, value: entityState.value.attributes[attrKey] }))
    .filter(attr => attr.value !== undefined);
});

const fetchData = async () => {
  if (!effectiveOptions.value.ha_url || !effectiveOptions.value.long_lived_token || !effectiveOptions.value.entity_id) {
    internalError.value = 'Home Assistant URL, Token, or Entity ID is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // widgetProxyService for HomeAssistantWidget will use options.ha_url, options.long_lived_token, options.entity_id
    const response = await apiClient.getWidgetData(props.widgetId, {});
    entityState.value = response;
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching HA entity data for ${props.widgetId} (${effectiveOptions.value.entity_id}):`, error);
    internalError.value = `Failed to fetch HA entity: ${effectiveOptions.value.entity_id}.`;
    apiResponseError.value = error.message || 'Unknown API error.';
    entityState.value = null;
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getDefaultIcon = (entityId = '') => {
    if (entityId.startsWith('light.')) return 'lightbulb';
    if (entityId.startsWith('switch.')) return 'toggle_on'; // or toggle_off based on state
    if (entityId.startsWith('sensor.')) return 'sensors';
    if (entityId.startsWith('binary_sensor.')) return 'visibility'; // or visibility_off
    if (entityId.startsWith('cover.')) return 'blinds';
    if (entityId.startsWith('media_player.')) return 'play_circle';
    if (entityId.startsWith('climate.')) return 'thermostat';
    return 'help_outline'; // Default icon
};

const stateDisplayClass = (state) => {
    const s = String(state).toLowerCase();
    // Basic state styling, can be expanded
    if (s === 'on' || s === 'open' || s === 'unlocked' || s === 'playing' || s === 'home' || s === 'active') return 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-200';
    if (s === 'off' || s === 'closed' || s === 'locked' || s === 'paused' || s === 'idle' || s === 'away' || s === 'inactive') return 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-200';
    if (s === 'unavailable' || s === 'unknown') return 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300';
    return 'bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200'; // Default for other states
};


const setupRefreshTimer = () => {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
  }
  const intervalSeconds = effectiveOptions.value.refresh_interval;
  if (intervalSeconds > 0) {
    refreshTimerId = setInterval(fetchData, intervalSeconds * 1000);
  }
};

onMounted(() => {
  fetchData();
  setupRefreshTimer();
});

onUnmounted(() => {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
  }
});

watch(() => props.options, () => {
  fetchData();
  setupRefreshTimer();
}, { deep: true });

defineExpose({
  fetchData,
});
</script>

<style scoped>
/* Custom styles for HomeAssistantWidget if needed */
.attributes span {
    word-break: break-all; /* Prevent long attribute values from breaking layout */
}
</style>
