<template>
  <div class="radarr-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Radarr queue...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="downloadQueue && downloadQueue.length > 0" class="space-y-3 overflow-y-auto h-full">
      <div v-for="item in downloadQueue" :key="item.id || item.title"
           class="download-item bg-gray-50 dark:bg-gray-700 p-2 rounded-md shadow">
        <h4 class="font-semibold text-gray-800 dark:text-gray-100 truncate" :title="item.movie?.title || item.title">
          {{ item.movie?.title || item.title || 'Unknown Movie' }}
          <span v-if="item.movie?.year">({{ item.movie.year }})</span>
        </h4>
        <div class="text-gray-600 dark:text-gray-300 mt-0.5">
          Status: <span class="font-medium" :class="statusColor(item.status)">{{ item.statusLabel || item.status }}</span>
          <span v-if="item.protocol" class="ml-1 text-xs">({{ item.protocol }})</span>
        </div>
        <div v-if="item.sizeleft > 0 && item.size > 0" class="mt-1">
          <div class="flex justify-between items-center mb-0.5">
            <span class="text-gray-500 dark:text-gray-400">{{ (100 * (item.size - item.sizeleft) / item.size).toFixed(1) }}%</span>
            <span v-if="item.estimatedCompletionTime" class="text-xs text-gray-500 dark:text-gray-400">
              ETA: {{ formatEta(item.estimatedCompletionTime) }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-2.5">
            <div class="bg-yellow-500 h-2 sm:h-2.5 rounded-full transition-all duration-300"
                 :style="{ width: (100 * (item.size - item.sizeleft) / item.size) + '%' }"></div>
          </div>
          <div class="text-right text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            {{ formatBytes(item.size - item.sizeleft) }} / {{ formatBytes(item.size) }}
            <span v-if="item.trackedDownloadStatus === 'downloading' && item.downloadClientStatus?.totalDownloadSpeed > 0" class="ml-1">
              @ {{ formatBytes(item.downloadClientStatus.totalDownloadSpeed, true) }}/s
            </span>
          </div>
        </div>
        <div v-else-if="item.status === 'completed'" class="mt-1 text-green-600 dark:text-green-400">
          Completed!
        </div>
         <div v-if="item.statusMessages && item.statusMessages.length > 0" class="mt-1">
            <div v-for="(msg, idx) in item.statusMessages" :key="idx" class="text-xs text-orange-500 dark:text-orange-400 truncate" :title="msg.messages.join(', ')">
                {{ msg.title }}: {{ msg.messages.join(', ') }}
            </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      Download queue is empty or no items match filters.
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
      url: '', // Radarr API base URL
      apiKey: '',
      show_completed_for_minutes: 10,
      max_items: 10,
      include_grabbed: true, // Radarr queue API usually includes these
      include_importing: true,
      refresh_interval: 60, // 1 minute
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const downloadQueue = ref([]);
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => downloadQueue.value && downloadQueue.value.length > 0);

const effectiveOptions = computed(() => ({
  url: props.options.url || '',
  apiKey: props.options.apiKey || '',
  show_completed_for_minutes: parseInt(props.options.show_completed_for_minutes, 10) || 0,
  max_items: parseInt(props.options.max_items, 10) || 10,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 60,
}));

const fetchData = async () => {
  if (!effectiveOptions.value.url || !effectiveOptions.value.apiKey) {
    internalError.value = 'Radarr URL or API Key is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // Radarr's /api/v3/queue endpoint returns 'records'
    const response = await apiClient.getWidgetData(props.widgetId, {}); // No specific client query params for now
    let items = response.records || response || []; // Handle if response is the array directly

    // Filter out completed items older than `show_completed_for_minutes`
    if (effectiveOptions.value.show_completed_for_minutes > 0) {
      const cutoffTime = new Date(Date.now() - effectiveOptions.value.show_completed_for_minutes * 60 * 1000);
      items = items.filter(item => {
        if (item.status?.toLowerCase() === 'completed' || item.trackedDownloadStatus?.toLowerCase() === 'ok') {
          // Radarr's queue items might not have a simple completion timestamp.
          // This logic might need adjustment based on actual API response for completed items.
          // For items actively in the queue, 'status' and 'trackedDownloadStatus' are more relevant.
          // For this example, we'll assume items are removed from queue by Radarr after processing.
          // If they linger with status 'completed', we'd need a 'finishedTime' field.
          // For now, we'll keep them if they are 'completed' and rely on Radarr to clear them.
          // This filter is more for items that *might* have a completion time.
          // If 'downloadedOn' exists (hypothetical):
          // return item.status.toLowerCase() !== 'completed' || (item.downloadedOn && new Date(item.downloadedOn) > cutoffTime);
          return true; // Keep all items from queue for now, Radarr manages its queue
        }
        return true;
      });
    } else { // If 0, filter out all completed items
        items = items.filter(item => item.status?.toLowerCase() !== 'completed' && item.trackedDownloadStatus?.toLowerCase() !== 'ok');
    }

    downloadQueue.value = items.slice(0, effectiveOptions.value.max_items);
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Radarr data for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch Radarr data.';
    apiResponseError.value = error.message || 'Unknown API error.';
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const formatBytes = (bytes, perSecond = false) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
  if (bytes === 0 && !perSecond) return '0 B';
  if (bytes === 0 && perSecond) return '0 B/s';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${value} ${sizes[i]}` + (perSecond ? '/s' : '');
};

const formatEta = (etaString) => {
  if (!etaString || etaString === "00:00:00") return '∞'; // Radarr sometimes uses this for unknown ETA
  // Check if it's a TimeSpan format like "00:01:23.456" or a full ISO date
  if (etaString.includes('T') && etaString.includes('Z')) { // ISO Date
    const etaDate = new Date(etaString);
    const now = new Date();
    let diffMs = etaDate - now;
    if (diffMs <= 0) return 'Done';

    let diffString = '';
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= d * (1000 * 60 * 60 * 24);
    const h = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= h * (1000 * 60 * 60);
    const m = Math.floor(diffMs / (1000 * 60));
    diffMs -= m * (1000 * 60);
    const s = Math.floor(diffMs / 1000);

    if (d > 0) diffString += `${d}d `;
    if (h > 0 || d > 0) diffString += `${h}h `; // Show hours if days or hours exist
    diffString += `${m}m `;
    // diffString += `${s}s`; // Optional: include seconds
    return diffString.trim();

  } else if (etaString.match(/^\d{2}:\d{2}:\d{2}/)) { // TimeSpan like "HH:MM:SS"
      const parts = etaString.split(':');
      let displayEta = '';
      if (parseInt(parts[0], 10) > 0) displayEta += `${parseInt(parts[0], 10)}h `;
      if (parseInt(parts[1], 10) > 0 || displayEta) displayEta += `${parseInt(parts[1], 10)}m `;
      if (parseInt(parts[2], 10) > 0 || displayEta) displayEta += `${parseInt(parts[2].split('.')[0], 10)}s`;
      return displayEta.trim() || 'N/A';
  }
  return etaString; // Fallback
};

const statusColor = (status) => {
  const s = status?.toLowerCase();
  if (s === 'downloading') return 'text-yellow-600 dark:text-yellow-400';
  if (s === 'completed' || s === 'ok') return 'text-green-600 dark:text-green-400';
  if (s === 'warning' || s?.includes('problem')) return 'text-orange-500 dark:text-orange-400';
  if (s === 'queued' || s === 'grabbed') return 'text-blue-500 dark:text-blue-400';
  if (s === 'paused') return 'text-gray-500 dark:text-gray-400';
  return 'text-gray-700 dark:text-gray-200';
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
.download-item {
  /* Custom styles for download items if needed */
}
.h-full.overflow-y-auto {
    max-height: calc(100% - 0px);
}
</style>
