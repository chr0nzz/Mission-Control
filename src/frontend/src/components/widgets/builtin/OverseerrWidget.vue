<template>
  <div class="overseerr-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Overseerr data...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="overseerrData" class="space-y-2">
      <div v-if="showCounts" class="counts-grid grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-center mb-2">
        <div v-if="shouldShowCount('pending')" class="p-1.5 bg-yellow-100 dark:bg-yellow-700 rounded shadow">
          <div class="text-xs text-yellow-700 dark:text-yellow-300">Pending</div>
          <div class="font-bold text-yellow-600 dark:text-yellow-200 text-lg">{{ overseerrData.counts?.pending || 0 }}</div>
        </div>
        <div v-if="shouldShowCount('approved')" class="p-1.5 bg-blue-100 dark:bg-blue-700 rounded shadow">
          <div class="text-xs text-blue-700 dark:text-blue-300">Approved</div>
          <div class="font-bold text-blue-600 dark:text-blue-200 text-lg">{{ overseerrData.counts?.approved || 0 }}</div>
        </div>
        <div v-if="shouldShowCount('processing')" class="p-1.5 bg-indigo-100 dark:bg-indigo-700 rounded shadow">
          <div class="text-xs text-indigo-700 dark:text-indigo-300">Processing</div>
          <div class="font-bold text-indigo-600 dark:text-indigo-200 text-lg">{{ overseerrData.counts?.processing || 0 }}</div>
        </div>
        <div v-if="shouldShowCount('available')" class="p-1.5 bg-green-100 dark:bg-green-700 rounded shadow">
          <div class="text-xs text-green-700 dark:text-green-300">Available</div>
          <div class="font-bold text-green-600 dark:text-green-200 text-lg">{{ overseerrData.counts?.available || 0 }}</div>
        </div>
         <div v-if="shouldShowCount('failed')" class="p-1.5 bg-red-100 dark:bg-red-700 rounded shadow">
          <div class="text-xs text-red-700 dark:text-red-300">Failed</div>
          <div class="font-bold text-red-600 dark:text-red-200 text-lg">{{ overseerrData.counts?.failed || 0 }}</div>
        </div>
      </div>

      <div v-if="showRecentList && recentRequests.length > 0" class="recent-requests">
        <h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-1 text-xs">Recent Requests ({{ effectiveOptions.recent_list_filter }}):</h4>
        <ul class="space-y-1 max-h-36 overflow-y-auto text-xs">
          <li v-for="request in recentRequests" :key="request.id"
              class="p-1.5 bg-gray-50 dark:bg-gray-700 rounded shadow-sm flex items-center space-x-2">
            <div class="flex-grow truncate">
              <p class="font-medium text-gray-800 dark:text-gray-100 truncate" :title="request.media?.title || request.media?.name">
                {{ request.media?.title || request.media?.name || 'Unknown Media' }}
                <span class="text-gray-500 dark:text-gray-400">({{ request.media?.mediaType }})</span>
              </p>
              <p class="text-gray-600 dark:text-gray-300">
                Status: <span :class="requestStatusColor(request.status)">{{ formatRequestStatus(request.status) }}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500">by {{ request.requestedBy?.displayName || 'User' }}</span>
              </p>
            </div>
          </li>
        </ul>
      </div>
      <div v-else-if="showRecentList" class="text-center text-xs text-gray-400 dark:text-gray-500 py-1">
        No recent requests match filter.
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No Overseerr data available. Check configuration.
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
      url: '', // Overseerr API base URL
      apiKey: '',
      show_counts: ['pending', 'approved', 'available'],
      show_recent_list: true,
      recent_list_count: 3,
      recent_list_filter: 'all', // 'all', 'pending', 'approved', 'available', etc.
      refresh_interval: 300, // 5 minutes
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const overseerrData = ref(null); // Will store { counts: {}, requests: [] }
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => overseerrData.value && (overseerrData.value.counts || overseerrData.value.requests));

const effectiveOptions = computed(() => ({
  url: props.options.url || '',
  apiKey: props.options.apiKey || '',
  show_counts: Array.isArray(props.options.show_counts) ? props.options.show_counts : ['pending', 'approved', 'available'],
  show_recent_list: props.options.show_recent_list !== false,
  recent_list_count: parseInt(props.options.recent_list_count, 10) || 3,
  recent_list_filter: props.options.recent_list_filter || 'all',
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 300,
}));

const showCounts = computed(() => effectiveOptions.value.show_counts.length > 0);
const showRecentList = computed(() => effectiveOptions.value.show_recent_list);

const recentRequests = computed(() => {
  if (overseerrData.value && overseerrData.value.requests) {
    return overseerrData.value.requests; // Already sliced by backend if count was passed
  }
  return [];
});

const fetchData = async () => {
  if (!effectiveOptions.value.url || !effectiveOptions.value.apiKey) {
    internalError.value = 'Overseerr URL or API Key is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // widgetProxyService for Overseerr will use options for counts and list filtering
    const response = await apiClient.getWidgetData(props.widgetId, {
        // filter: effectiveOptions.value.recent_list_filter, // Handled by proxy based on widget options
        // take: effectiveOptions.value.recent_list_count,
    });
    overseerrData.value = response; // Expects { counts: {}, requests: [] }
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Overseerr data for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch Overseerr data.';
    apiResponseError.value = error.message || 'Unknown API error.';
    overseerrData.value = null;
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const shouldShowCount = (countType) => {
  return effectiveOptions.value.show_counts.includes(countType);
};

// Overseerr status codes: 1: PENDING, 2: APPROVED, 3: PROCESSING, 4: PARTIALLY_AVAILABLE, 5: AVAILABLE, 6: FAILED
const requestStatusMap = {
  1: 'Pending',
  2: 'Approved',
  3: 'Processing',
  4: 'Partially Available',
  5: 'Available',
  6: 'Failed',
};
const formatRequestStatus = (status) => {
  return requestStatusMap[status] || `Unknown (${status})`;
};
const requestStatusColor = (status) => {
  if (status === 1) return 'text-yellow-600 dark:text-yellow-400'; // Pending
  if (status === 2) return 'text-blue-600 dark:text-blue-400';   // Approved
  if (status === 3) return 'text-indigo-600 dark:text-indigo-400';// Processing
  if (status === 5) return 'text-green-600 dark:text-green-400'; // Available
  if (status === 6) return 'text-red-600 dark:text-red-400';     // Failed
  return 'text-gray-600 dark:text-gray-300';
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
.max-h-36 {
    max-height: 9rem; /* 36 * 0.25rem */
}
</style>
