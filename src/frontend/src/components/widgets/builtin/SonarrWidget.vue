<template>
  <div class="sonarr-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-400"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Sonarr data...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="upcomingEpisodes && upcomingEpisodes.length > 0" class="space-y-2 overflow-y-auto h-full">
      <div v-for="episode in upcomingEpisodes" :key="episode.id || episode.series?.id + '_' + episode.episodeNumber + '_' + episode.seasonNumber"
           class="episode-item bg-gray-50 dark:bg-gray-700 p-2 rounded-md shadow">
        <div class="flex items-start space-x-2">
          <img v-if="showSeriesPoster && episode.series?.images"
               :src="getSonarrImageUrl(episode.series.images, 'poster')"
               :alt="episode.series?.title || 'Poster'"
               class="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-sm flex-shrink-0"
               @error="onImageError"/>
          <div class="flex-grow truncate">
            <h4 class="font-semibold text-gray-800 dark:text-gray-100 truncate" :title="episode.series?.title">
              {{ episode.series?.title || 'Unknown Series' }}
            </h4>
            <p class="text-gray-600 dark:text-gray-300 truncate" :title="episode.title">
              S{{ String(episode.seasonNumber).padStart(2, '0') }}E{{ String(episode.episodeNumber).padStart(2, '0') }} - {{ episode.title || 'N/A' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Airs: {{ formatDate(episode.airDateUtc || episode.airDate) }}
              <span v-if="episode.series?.network">({{ episode.series.network }})</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No upcoming episodes found within the configured range.
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
      url: '', // Sonarr API base URL
      apiKey: '',
      days_ahead: 7,
      show_series_poster: false,
      date_format: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }, // Example Intl.DateTimeFormat options
      max_items: 10,
      include_unmonitored: false,
      refresh_interval: 300, // 5 minutes
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const upcomingEpisodes = ref([]);
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
let refreshTimerId = null;

const hasData = computed(() => upcomingEpisodes.value && upcomingEpisodes.value.length > 0);

const effectiveOptions = computed(() => ({
  url: props.options.url || '',
  apiKey: props.options.apiKey || '',
  days_ahead: parseInt(props.options.days_ahead, 10) || 7,
  show_series_poster: props.options.show_series_poster === true,
  date_format: props.options.date_format || { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  max_items: parseInt(props.options.max_items, 10) || 10,
  include_unmonitored: props.options.include_unmonitored === true,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 300,
}));

const showSeriesPoster = computed(() => effectiveOptions.value.show_series_poster);

const fetchData = async () => {
  if (!effectiveOptions.value.url || !effectiveOptions.value.apiKey) {
    internalError.value = 'Sonarr URL or API Key is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // The widgetProxyService for Sonarr will use options like days_ahead, include_unmonitored
    const params = {
        // These are now handled by widgetProxyService based on widgetOptions
        // days_ahead: effectiveOptions.value.days_ahead,
        // include_unmonitored: effectiveOptions.value.include_unmonitored,
    };
    const response = await apiClient.getWidgetData(props.widgetId, params);
    // Sort by airDateUtc and then limit
    const sortedEpisodes = response.sort((a, b) => new Date(a.airDateUtc || a.airDate) - new Date(b.airDateUtc || b.airDate));
    upcomingEpisodes.value = sortedEpisodes.slice(0, effectiveOptions.value.max_items);
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Sonarr data for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch Sonarr data.';
    apiResponseError.value = error.message || 'Unknown API error.';
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat(undefined, effectiveOptions.value.date_format).format(new Date(dateString));
  } catch (e) {
    console.warn("Error formatting date for Sonarr:", e, "Input:", dateString);
    return dateString; // Fallback to original string
  }
};

const getSonarrImageUrl = (images, type = 'poster') => {
  // Sonarr API typically provides image URLs relative to its own host or absolute.
  // This function assumes the URL provided by Sonarr is directly usable.
  // Type can be 'poster', 'banner', 'fanart'.
  const imageObject = images.find(img => img.coverType === type);
  if (imageObject && imageObject.url) {
    // If Sonarr provides a relative URL, it needs to be prefixed with Sonarr's base URL.
    // However, Sonarr v3 usually provides full URLs or URLs that work with its own image handling.
    // For simplicity, assume `imageObject.url` is usable. If it's relative, more logic is needed.
    // If the URL is relative and needs the Sonarr host, this is tricky as the image tag is in browser,
    // and Sonarr might not be directly accessible or might require API key for images.
    // The backend proxy might need to serve these images if direct access is an issue.
    // For now, we assume the URL is absolute or handled by Sonarr's setup.
    return imageObject.remoteUrl || imageObject.url; // Prefer remoteUrl if available
  }
  return 'https://placehold.co/100x150/333/ccc?text=No+Poster'; // Placeholder
};

const onImageError = (event) => {
  event.target.src = 'https://placehold.co/100x150/333/ccc?text=Error';
  event.target.style.objectFit = 'contain'; // Adjust style for placeholder
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
.episode-item {
  /* Add any specific styling for episode items */
}
.h-full.overflow-y-auto { /* Ensure scrollbar appears if content overflows */
    max-height: calc(100% - 0px); /* Adjust if there's padding in parent */
}
</style>
