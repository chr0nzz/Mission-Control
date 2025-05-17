<template>
  <div class="uptime-kuma-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-lime-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Uptime Kuma data...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="monitorStatusCounts" class="space-y-2">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-1.5 bg-green-100 dark:bg-green-700 rounded shadow">
          <div class="text-xs text-green-700 dark:text-green-300">UP</div>
          <div class="font-bold text-green-600 dark:text-green-200 text-xl">{{ monitorStatusCounts.up || 0 }}</div>
        </div>
        <div class="p-1.5 bg-red-100 dark:bg-red-700 rounded shadow">
          <div class="text-xs text-red-700 dark:text-red-300">DOWN</div>
          <div class="font-bold text-red-600 dark:text-red-200 text-xl">{{ monitorStatusCounts.down || 0 }}</div>
        </div>
        <div class="p-1.5 bg-yellow-100 dark:bg-yellow-700 rounded shadow">
          <div class="text-xs text-yellow-700 dark:text-yellow-300">PAUSED</div>
          <div class="font-bold text-yellow-600 dark:text-yellow-200 text-xl">{{ monitorStatusCounts.paused || 0 }}</div>
        </div>
      </div>

      <div v-if="showDownMonitorsList && downMonitors.length > 0" class="mt-2">
        <h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-1">Currently Down:</h4>
        <ul class="space-y-1 max-h-28 overflow-y-auto text-xs">
          <li v-for="monitor in downMonitors" :key="monitor.id || monitor.name"
              class="p-1 bg-red-50 dark:bg-red-800/50 rounded truncate" :title="monitor.name">
            {{ monitor.name }}
          </li>
        </ul>
      </div>
       <div v-if="showPausedMonitorsList && pausedMonitors.length > 0 && !showDownMonitorsList" class="mt-2"> <h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-1">Paused:</h4>
        <ul class="space-y-1 max-h-28 overflow-y-auto text-xs">
          <li v-for="monitor in pausedMonitors" :key="monitor.id || monitor.name"
              class="p-1 bg-yellow-50 dark:bg-yellow-800/50 rounded truncate" :title="monitor.name">
            {{ monitor.name }}
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No Uptime Kuma data or no monitors found.
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
      url: '', // Uptime Kuma instance URL
      apiKey: '', // Optional, for fetching all monitors if status page not used
      statusPageSlug: '', // Slug for a public status page
      show_down_monitors_list: true,
      show_paused_monitors_list: false,
      max_list_items: 5,
      refresh_interval: 120, // 2 minutes
      // use_socketio: false, // Socket.IO would be a frontend-only implementation usually
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const allMonitors = ref([]); // Stores the list of monitors if fetched
const monitorStatusCounts = ref({ up: 0, down: 0, paused: 0 });
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => monitorStatusCounts.value.up > 0 || monitorStatusCounts.value.down > 0 || monitorStatusCounts.value.paused > 0);

const effectiveOptions = computed(() => ({
  url: props.options.url || '',
  apiKey: props.options.apiKey,
  statusPageSlug: props.options.statusPageSlug,
  show_down_monitors_list: props.options.show_down_monitors_list !== false,
  show_paused_monitors_list: props.options.show_paused_monitors_list === true,
  max_list_items: parseInt(props.options.max_list_items, 10) || 5,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 120,
}));

const showDownMonitorsList = computed(() => effectiveOptions.value.show_down_monitors_list);
const showPausedMonitorsList = computed(() => effectiveOptions.value.show_paused_monitors_list);

const downMonitors = computed(() => {
  if (!allMonitors.value || !showDownMonitorsList.value) return [];
  return allMonitors.value
    .filter(m => m.status === 0) // Uptime Kuma status: 0 = down
    .slice(0, effectiveOptions.value.max_list_items);
});

const pausedMonitors = computed(() => {
  if (!allMonitors.value || !showPausedMonitorsList.value) return [];
   return allMonitors.value
    .filter(m => m.status === 3) // Uptime Kuma status: 3 = paused
    .slice(0, effectiveOptions.value.max_list_items);
});

const fetchData = async () => {
  if (!effectiveOptions.value.url) {
    internalError.value = 'Uptime Kuma URL is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }
  // if (!effectiveOptions.value.apiKey && !effectiveOptions.value.statusPageSlug) {
  //   internalError.value = 'Uptime Kuma API Key or Status Page Slug must be configured.';
  //   emit('widget-error', internalError.value);
  //   return;
  // }


  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // The widgetProxyService for UptimeKuma will use options.apiKey or options.statusPageSlug
    const response = await apiClient.getWidgetData(props.widgetId, {});
    
    // Response structure depends on what the proxy returns (e.g., list of monitors or status page data)
    // Assuming proxy returns an object with a 'monitors' array or similar structure
    // For a status page, it might be response.publicGroupList[0].monitorList
    let monitors = [];
    if (response && Array.isArray(response.monitors)) { // If proxy fetched all monitors
        monitors = response.monitors;
    } else if (response && response.publicGroupList && response.publicGroupList[0] && response.publicGroupList[0].monitorList) { // From status page
        monitors = response.publicGroupList[0].monitorList.map(m => ({...m, status: m.status})); // map status if needed
    } else if (Array.isArray(response)) { // If proxy returns array directly
        monitors = response;
    }


    allMonitors.value = monitors;
    calculateStatusCounts(monitors);
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Uptime Kuma data for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch Uptime Kuma data.';
    apiResponseError.value = error.message || 'Unknown API error.';
    allMonitors.value = [];
    monitorStatusCounts.value = { up: 0, down: 0, paused: 0 };
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const calculateStatusCounts = (monitors) => {
  let up = 0, down = 0, paused = 0;
  // Uptime Kuma status codes: 0 = down, 1 = up, 2 = pending, 3 = maintenance (paused)
  monitors.forEach(monitor => {
    if (monitor.status === 1) up++;
    else if (monitor.status === 0) down++;
    else if (monitor.status === 3) paused++;
  });
  monitorStatusCounts.value = { up, down, paused };
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
.max-h-28 {
  max-height: 7rem; /* 28 * 0.25rem = 7rem */
}
</style>
