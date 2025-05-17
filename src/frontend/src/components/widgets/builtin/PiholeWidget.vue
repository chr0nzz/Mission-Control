<template>
  <div class="pihole-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Pi-hole data...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="piholeData && piholeData.summary" class="space-y-1.5">
      <div class="stat-item p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow">
        <div class="text-gray-500 dark:text-gray-400">DNS Queries (Today)</div>
        <div class="font-semibold text-pink-600 dark:text-pink-400 text-lg">
          {{ piholeData.summary.dns_queries_today?.toLocaleString() || 'N/A' }}
        </div>
      </div>
      <div class="stat-item p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow">
        <div class="text-gray-500 dark:text-gray-400">Queries Blocked (Today)</div>
        <div class="font-semibold text-pink-600 dark:text-pink-400 text-lg">
          {{ piholeData.summary.ads_blocked_today?.toLocaleString() || 'N/A' }}
        </div>
      </div>
      <div class="stat-item p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow">
        <div class="text-gray-500 dark:text-gray-400">Percent Blocked (Today)</div>
        <div class="font-semibold text-pink-600 dark:text-pink-400 text-lg">
          {{ piholeData.summary.ads_percentage_today?.toFixed(1) || 'N/A' }}%
        </div>
      </div>
      <div v-if="showTopDomain && piholeData.topItems && topBlockedDomain" class="stat-item p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow">
        <div class="text-gray-500 dark:text-gray-400">Top Blocked Domain</div>
        <div class="font-medium text-gray-700 dark:text-gray-200 truncate" :title="topBlockedDomain.domain">
          {{ topBlockedDomain.domain }} ({{ topBlockedDomain.hits?.toLocaleString() }} hits)
        </div>
      </div>
      <div v-if="showGravityStatus && piholeData.gravity" class="stat-item p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow">
        <div class="text-gray-500 dark:text-gray-400">Gravity Last Updated</div>
        <div class="font-medium text-gray-700 dark:text-gray-200">
          {{ formatGravityDate(piholeData.gravity.file_exists ? piholeData.gravity.gravity_last_updated?.relative?.days : null) }}
        </div>
      </div>
       <div v-if="piholeData.summary.status" class="stat-item p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow">
        <div class="text-gray-500 dark:text-gray-400">Pi-hole Status</div>
        <div class="font-semibold text-lg" :class="piholeData.summary.status === 'enabled' ? 'text-green-500' : 'text-red-500'">
          {{ piholeData.summary.status === 'enabled' ? 'Enabled' : 'Disabled' }}
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No Pi-hole data available.
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
      url: '', // Pi-hole admin URL
      apiKey: '',
      show_top_domain: true,
      show_gravity_status: true,
      refresh_interval: 300, // 5 minutes
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const piholeData = ref(null); // Will store { summary: {}, topItems: {}, gravity: {} }
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => piholeData.value && piholeData.value.summary);

const effectiveOptions = computed(() => ({
  url: props.options.url || '',
  apiKey: props.options.apiKey || '',
  show_top_domain: props.options.show_top_domain !== false,
  show_gravity_status: props.options.show_gravity_status !== false,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 300,
}));

const showTopDomain = computed(() => effectiveOptions.value.show_top_domain);
const showGravityStatus = computed(() => effectiveOptions.value.show_gravity_status);

const topBlockedDomain = computed(() => {
  if (piholeData.value && piholeData.value.topItems && piholeData.value.topItems.top_ads) {
    // top_ads is an object where keys are domains and values are hit counts
    const domains = Object.keys(piholeData.value.topItems.top_ads);
    if (domains.length > 0) {
      return { domain: domains[0], hits: piholeData.value.topItems.top_ads[domains[0]] };
    }
  }
  return null;
});

const fetchData = async () => {
  if (!effectiveOptions.value.url || !effectiveOptions.value.apiKey) {
    internalError.value = 'Pi-hole URL or API Key is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // The widgetProxyService for Pihole will fetch all necessary parts (summary, topItems, gravity)
    const response = await apiClient.getWidgetData(props.widgetId, {});
    piholeData.value = response;
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Pi-hole data for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch Pi-hole data.';
    apiResponseError.value = error.message || 'Unknown API error.';
    piholeData.value = null;
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const formatGravityDate = (daysAgo) => {
  if (daysAgo === null || daysAgo === undefined) return 'N/A';
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return `${daysAgo} days ago`;
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
.stat-item {
  /* Custom styles for stat items if needed */
}
</style>
