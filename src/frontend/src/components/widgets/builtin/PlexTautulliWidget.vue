<template>
  <div class="plex-tautulli-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Plex/Tautulli activity...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="activityData && activityData.sessions && activityData.sessions.length > 0" class="space-y-2 overflow-y-auto h-full">
      <div class="mb-1 text-gray-600 dark:text-gray-300">
        Active Streams: <span class="font-semibold">{{ activityData.stream_count || activityData.sessions.length }}</span>
        <span v-if="activityData.wan_bandwidth_kbps"> | WAN: {{ formatSpeed(activityData.wan_bandwidth_kbps * 1024 / 8) }}</span>
        <span v-if="activityData.lan_bandwidth_kbps"> | LAN: {{ formatSpeed(activityData.lan_bandwidth_kbps * 1024 / 8) }}</span>
      </div>
      <div v-for="session in activityData.sessions.slice(0, maxStreams)" :key="session.session_key || session.sessionKey || session.id"
           class="session-item bg-gray-50 dark:bg-gray-700 p-2 rounded-md shadow flex items-start space-x-2">
        <img v-if="showMediaPoster && (session.thumb || session.art)"
             :src="getImageUrl(session.thumb || session.art)"
             :alt="session.title || 'Poster'"
             class="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-sm flex-shrink-0"
             @error="onImageError"/>
        <div class="flex-grow truncate">
          <p class="font-semibold text-gray-800 dark:text-gray-100 truncate" :title="session.full_title || session.title">
            {{ session.full_title || session.title || 'Unknown Title' }}
          </p>
          <p class="text-gray-600 dark:text-gray-300 truncate" :title="session.user">
            User: {{ session.user || session.User?.title || 'N/A' }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 truncate text-xs" :title="session.player + (session.product ? ' ('+session.product+')' : '')">
            Player: {{ session.player || session.Player?.title || 'N/A' }} {{ session.product || session.Player?.product || '' }}
          </p>
          <div v-if="session.duration && session.view_offset" class="mt-1">
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 sm:h-2">
              <div class="bg-orange-500 h-1.5 sm:h-2 rounded-full" :style="{ width: calculateProgress(session.view_offset, session.duration) + '%' }"></div>
            </div>
            <div class="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
              {{ formatDuration(session.view_offset) }} / {{ formatDuration(session.duration) }}
            </div>
          </div>
           <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">State: {{ session.state || session.Player?.state || 'N/A' }}</p>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No active Plex streams.
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
      mode: 'tautulli', // 'tautulli' or 'plex'
      tautulli_url: '',
      tautulli_apiKey: '',
      plex_url: '',
      plex_token: '',
      show_media_poster: true,
      max_streams: 5,
      refresh_interval: 30, // seconds
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const activityData = ref(null); // Tautulli: { stream_count, sessions: [] }, Plex: { Metadata: [], size }
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => {
    if (!activityData.value) return false;
    if (effectiveOptions.value.mode === 'tautulli') {
        return activityData.value.sessions && activityData.value.sessions.length > 0;
    } else if (effectiveOptions.value.mode === 'plex') {
        return activityData.value.Metadata && activityData.value.Metadata.length > 0;
    }
    return false;
});

const effectiveOptions = computed(() => ({
  mode: props.options.mode || 'tautulli',
  tautulli_url: props.options.tautulli_url || '',
  tautulli_apiKey: props.options.tautulli_apiKey || '',
  plex_url: props.options.plex_url || '',
  plex_token: props.options.plex_token || '',
  show_media_poster: props.options.show_media_poster !== false,
  max_streams: parseInt(props.options.max_streams, 10) || 5,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 30,
}));

const showMediaPoster = computed(() => effectiveOptions.value.show_media_poster);
const maxStreams = computed(() => effectiveOptions.value.max_streams);

const fetchData = async () => {
  const opts = effectiveOptions.value;
  if (opts.mode === 'tautulli' && (!opts.tautulli_url || !opts.tautulli_apiKey)) {
    internalError.value = 'Tautulli URL or API Key is not configured.';
    emit('widget-error', internalError.value); return;
  }
  if (opts.mode === 'plex' && (!opts.plex_url || !opts.plex_token)) {
    internalError.value = 'Plex URL or Token is not configured.';
    emit('widget-error', internalError.value); return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    const response = await apiClient.getWidgetData(props.widgetId, {}); // Proxy handles mode
    if (opts.mode === 'plex') { // Adapt Plex direct API response to a Tautulli-like structure
        activityData.value = {
            stream_count: response.size || 0,
            sessions: (response.Metadata || []).map(s => ({ // Plex direct session object is different
                session_key: s.sessionKey, // or s.key
                thumb: s.thumb || s.parentThumb, // Thumbnail for series/season or movie
                art: s.art || s.grandparentArt, // Background art
                title: s.title || s.grandparentTitle, // Title of episode or movie
                full_title: s.grandparentTitle ? `${s.grandparentTitle} - S${s.parentIndex}E${s.index} ${s.title}` : s.title,
                user: s.User?.title,
                player: s.Player?.title,
                product: s.Player?.product,
                state: s.Player?.state,
                duration: parseInt(s.duration, 10), // ms
                view_offset: parseInt(s.viewOffset, 10), // ms
                // Add other fields as needed, mapping from Plex session structure
            }))
        };
    } else { // Tautulli mode
        activityData.value = response;
    }
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Plex/Tautulli data for widget ${props.widgetId}:`, error);
    internalError.value = `Failed to fetch ${opts.mode} activity.`;
    apiResponseError.value = error.message || 'Unknown API error.';
    activityData.value = null;
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const getImageUrl = (thumbPath) => {
  if (!thumbPath) return 'https://placehold.co/100x150/333/ccc?text=No+Art';
  // Tautulli often provides relative paths that need its URL, or full URLs for Plex images.
  // Plex direct API usually provides paths that need /photo/:/transcode?url=<path>&... with X-Plex-Token
  // This requires the backend proxy to handle image fetching if direct access is problematic.
  // For simplicity here, assume thumbPath is a usable URL or the backend proxy has a way to serve it.
  // If it's a Tautulli relative path:
  if (effectiveOptions.value.mode === 'tautulli' && thumbPath.startsWith('/pms_image_proxy')) {
      // This is a Tautulli proxied image, may need API key or be directly accessible
      // A robust solution would be for backend to proxy these images.
      // For now, try to construct full URL if Tautulli URL is base.
      // This is a common pattern but might not always work due to auth.
      return `${effectiveOptions.value.tautulli_url}${thumbPath}`;
  }
  // If it's a Plex path (needs token and transcoding usually)
  if (effectiveOptions.value.mode === 'plex' && thumbPath.startsWith('/library/metadata/')) {
      // This is complex. The backend proxy should handle this.
      // For now, return placeholder or a conceptual proxy URL.
      // return `${effectiveOptions.value.plex_url}${thumbPath}?X-Plex-Token=${effectiveOptions.value.plex_token}`; // This won't work directly in browser usually
      return `https://placehold.co/100x150/111/eee?text=PlexArt`; // Placeholder
  }
  // If it's already a full URL (e.g., from Tautulli for some items)
  if (thumbPath.startsWith('http')) {
    return thumbPath;
  }
  // Fallback placeholder
  return 'https://placehold.co/100x150/222/ddd?text=Art?';
};

const onImageError = (event) => {
  event.target.src = 'https://placehold.co/100x150/333/ccc?text=ImgErr';
  event.target.style.objectFit = 'contain';
};

const calculateProgress = (viewOffset, duration) => {
  if (!duration || duration <= 0 || !viewOffset || viewOffset < 0) return 0;
  return Math.min(100, (viewOffset / duration) * 100);
};

const formatDuration = (ms) => {
  if (ms === undefined || ms === null || isNaN(ms)) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === undefined || bytesPerSecond === null || isNaN(bytesPerSecond) || bytesPerSecond < 0) return '0 B/s';
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
.session-item {
  /* Custom styles if needed */
}
.h-full.overflow-y-auto {
    max-height: calc(100% - 0px);
}
</style>
