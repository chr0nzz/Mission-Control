<template>
  <div class="qbittorrent-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading qBittorrent data...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="qbitData" class="space-y-2">
      <div class="global-stats grid grid-cols-2 gap-2 mb-2">
        <div class="stat-item p-2 bg-gray-50 dark:bg-gray-700 rounded text-center shadow">
          <div class="text-gray-500 dark:text-gray-400">DL Speed</div>
          <div class="font-semibold text-teal-600 dark:text-teal-400 text-base">
            {{ formatSpeed(qbitData.transferInfo?.dl_info_speed) }}
          </div>
        </div>
        <div class="stat-item p-2 bg-gray-50 dark:bg-gray-700 rounded text-center shadow">
          <div class="text-gray-500 dark:text-gray-400">UL Speed</div>
          <div class="font-semibold text-sky-600 dark:text-sky-400 text-base">
            {{ formatSpeed(qbitData.transferInfo?.up_info_speed) }}
          </div>
        </div>
        <div class="stat-item p-2 bg-gray-50 dark:bg-gray-700 rounded text-center shadow col-span-1">
          <div class="text-gray-500 dark:text-gray-400">Active DL</div>
          <div class="font-semibold text-gray-700 dark:text-gray-200 text-base">
            {{ qbitData.transferInfo?.dl_rate_limit > 0 ? activeDownloadingTorrentsCount : totalDownloadingTorrentsCount }}
            <span v-if="qbitData.transferInfo?.dl_rate_limit > 0" class="text-xs"> ({{ formatSpeed(qbitData.transferInfo.dl_rate_limit) }} limit)</span>
          </div>
        </div>
         <div class="stat-item p-2 bg-gray-50 dark:bg-gray-700 rounded text-center shadow col-span-1">
          <div class="text-gray-500 dark:text-gray-400">Active UL</div>
          <div class="font-semibold text-gray-700 dark:text-gray-200 text-base">
            {{ qbitData.transferInfo?.up_rate_limit > 0 ? activeUploadingTorrentsCount : totalUploadingTorrentsCount }}
             <span v-if="qbitData.transferInfo?.up_rate_limit > 0" class="text-xs"> ({{ formatSpeed(qbitData.transferInfo.up_rate_limit) }} limit)</span>
          </div>
        </div>
      </div>

      <div v-if="showTorrentList && torrentsToDisplay.length > 0" class="torrent-list space-y-1 overflow-y-auto max-h-[calc(100%-80px)]"> <div v-for="torrent in torrentsToDisplay" :key="torrent.hash"
             class="torrent-item bg-gray-100 dark:bg-gray-700 p-1.5 rounded">
          <p class="font-medium text-gray-800 dark:text-gray-100 truncate text-xs" :title="torrent.name">{{ torrent.name }}</p>
          <div class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300">
            <span>{{ (torrent.progress * 100).toFixed(1) }}%</span>
            <span :class="torrentStateColor(torrent.state)">{{ torrent.state }}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>DL: {{ formatSpeed(torrent.dlspeed) }}</span>
            <span>UL: {{ formatSpeed(torrent.upspeed) }}</span>
            <span>ETA: {{ formatEta(torrent.eta) }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="showTorrentList" class="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
        No torrents match filter "{{ effectiveOptions.torrent_list_filter }}".
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No qBittorrent data available.
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
      url: '', // qBittorrent WebUI URL
      username: '',
      password: '',
      show_torrent_list_count: 3,
      torrent_list_filter: 'downloading', // e.g., 'all', 'downloading', 'seeding', 'paused', 'active'
      refresh_interval: 15, // seconds
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const qbitData = ref(null); // Will store { transferInfo: {}, torrents: [] }
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => qbitData.value && (qbitData.value.transferInfo || qbitData.value.torrents));

const effectiveOptions = computed(() => ({
  url: props.options.url || '',
  username: props.options.username, // Can be empty
  password: props.options.password, // Can be empty
  show_torrent_list_count: parseInt(props.options.show_torrent_list_count, 10) || 0,
  torrent_list_filter: props.options.torrent_list_filter || 'downloading',
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 15,
}));

const showTorrentList = computed(() => effectiveOptions.value.show_torrent_list_count > 0);

const torrentsToDisplay = computed(() => {
  if (!qbitData.value || !qbitData.value.torrents) return [];
  // The backend proxy already filters by `torrent_list_filter` passed in clientQuery
  // So, qbitData.value.torrents should already be filtered. We just slice.
  return qbitData.value.torrents.slice(0, effectiveOptions.value.show_torrent_list_count);
});

const activeDownloadingTorrentsCount = computed(() => {
    if (!qbitData.value || !qbitData.value.torrents) return 0;
    return qbitData.value.torrents.filter(t => t.state === 'downloading' || t.state === 'metaDL' || t.state === 'stalledDL').length;
});
const totalDownloadingTorrentsCount = computed(() => qbitData.value?.transferInfo?.downloading_torrents || activeDownloadingTorrentsCount.value); // Fallback if specific field not in API

const activeUploadingTorrentsCount = computed(() => {
    if (!qbitData.value || !qbitData.value.torrents) return 0;
    return qbitData.value.torrents.filter(t => t.state === 'uploading' || t.state === 'stalledUP' || t.state === 'forcedUP').length;
});
const totalUploadingTorrentsCount = computed(() => qbitData.value?.transferInfo?.uploading_torrents || activeUploadingTorrentsCount.value);

const fetchData = async () => {
  if (!effectiveOptions.value.url) {
    internalError.value = 'qBittorrent URL is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    const params = {
      filter: effectiveOptions.value.torrent_list_filter, // Pass filter to backend proxy
    };
    const response = await apiClient.getWidgetData(props.widgetId, params);
    qbitData.value = response; // Expects { transferInfo: {}, torrents: [] }
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching qBittorrent data for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch qBittorrent data.';
    apiResponseError.value = error.message || 'Unknown API error.';
    qbitData.value = null; // Clear old data on error
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === undefined || bytesPerSecond === null || isNaN(bytesPerSecond) || bytesPerSecond < 0) return '0 B/s';
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatEta = (seconds) => {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0 || seconds === 8640000) { // 8640000 is often qBit's way of saying 'infinity'
    return '∞';
  }
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  let etaString = '';
  if (d > 0) etaString += `${d}d `;
  if (h > 0 || d > 0) etaString += `${h}h `;
  if (m > 0 || h > 0 || d > 0) etaString += `${m}m `;
  etaString += `${s}s`;
  return etaString.trim();
};

const torrentStateColor = (state) => {
  const s = state?.toLowerCase();
  if (s?.includes('downloading') || s === 'metadl' || s === 'stalldl') return 'text-yellow-600 dark:text-yellow-400';
  if (s?.includes('uploading') || s === 'stalledup' || s === 'forcedup') return 'text-sky-600 dark:text-sky-400';
  if (s === 'pauseddl' || s === 'pausedup') return 'text-gray-500 dark:text-gray-400';
  if (s === 'checkingup' || s === 'checkingdl' || s === 'queueddl' || s === 'queuedup') return 'text-indigo-500 dark:text-indigo-400';
  if (s === 'completed' || s === 'seeding' || s === 'forcedseeding') return 'text-green-600 dark:text-green-400';
  if (s?.includes('error') || s === 'missingfiles') return 'text-red-600 dark:text-red-400';
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
.global-stats .stat-item {
  min-height: 60px; /* Ensure consistent height for stat boxes */
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.max-h-\[calc\(100\%-80px\)\] { /* Example for limiting torrent list height */
    max-height: calc(100% - 90px); /* Adjust this value based on global stats height */
}
</style>
