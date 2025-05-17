<template>
  <div class="docker-widget p-2 h-full text-xs sm:text-sm">
    <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
      <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      <p class="ml-2 text-gray-500 dark:text-gray-400">Loading Docker containers...</p>
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400 p-2 text-center">
      <p><strong>Error:</strong> {{ internalError }}</p>
      <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
    </div>
    <div v-else-if="containers && containers.length > 0" class="space-y-1.5 overflow-y-auto h-full">
      <div v-for="container in containers" :key="container.Id"
           class="container-item bg-gray-50 dark:bg-gray-700 p-1.5 rounded shadow-sm flex justify-between items-center">
        <div class="flex-grow truncate mr-2">
          <p class="font-medium text-gray-800 dark:text-gray-100 truncate" :title="getContainerName(container)">
            <span class="material-icons text-base mr-1 align-bottom" :class="statusIconColor(container.State)">
              {{ statusIcon(container.State) }}
            </span>
            {{ getContainerName(container) }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 truncate text-xs" :title="container.Image">
            {{ container.Image.startsWith('sha256:') ? container.Image.substring(0, 19)+'...' : container.Image }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">
            Status: <span :class="statusTextColor(container.State)">{{ container.Status || container.State }}</span>
          </p>
        </div>
        <div v-if="allowActions" class="actions flex-shrink-0 space-x-1">
          <button v-if="container.State !== 'running'" @click="performAction(container.Id, 'start')" :disabled="actionInProgress === container.Id"
                  class="p-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs" title="Start">
            <span class="material-icons text-sm">play_arrow</span>
          </button>
          <button v-if="container.State === 'running'" @click="performAction(container.Id, 'stop')" :disabled="actionInProgress === container.Id"
                  class="p-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs" title="Stop">
            <span class="material-icons text-sm">stop</span>
          </button>
          <button v-if="container.State === 'running'" @click="performAction(container.Id, 'restart')" :disabled="actionInProgress === container.Id"
                  class="p-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-xs" title="Restart">
            <span class="material-icons text-sm">replay</span>
          </button>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 dark:text-gray-500 py-4">
      No Docker containers found or proxy not configured.
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
      proxy_url: '', // URL of the secure Docker socket proxy
      show_all_containers: false,
      allow_actions: false, // Enable start/stop/restart buttons
      refresh_interval: 30, // seconds
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const apiClient = inject('apiClient');
const containers = ref([]);
const internalLoading = ref(false);
const internalError = ref(null);
const apiResponseError = ref('');
const actionInProgress = ref(null); // Stores ID of container an action is being performed on
let refreshTimerId = null;

const hasData = computed(() => containers.value && containers.value.length > 0);

const effectiveOptions = computed(() => ({
  proxy_url: props.options.proxy_url || '',
  show_all_containers: props.options.show_all_containers === true,
  allow_actions: props.options.allow_actions === true,
  refresh_interval: parseInt(props.options.refresh_interval, 10) || 30,
}));

const allowActions = computed(() => effectiveOptions.value.allow_actions);

const fetchData = async () => {
  if (!effectiveOptions.value.proxy_url) {
    internalError.value = 'Docker proxy URL is not configured.';
    apiResponseError.value = '';
    emit('widget-error', internalError.value);
    return;
  }

  internalLoading.value = true;
  internalError.value = null;
  apiResponseError.value = '';
  emit('widget-loading', true);

  try {
    // widgetProxyService for DockerWidget will use options.proxy_url and options.show_all_containers
    const response = await apiClient.getWidgetData(props.widgetId, {}); // Params handled by proxy based on options
    containers.value = response.sort((a,b) => getContainerName(a).localeCompare(getContainerName(b)));
    emit('widget-data-updated');
  } catch (error) {
    console.error(`Error fetching Docker containers for widget ${props.widgetId}:`, error);
    internalError.value = 'Failed to fetch Docker containers.';
    apiResponseError.value = error.message || 'Unknown API error.';
    containers.value = [];
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    internalLoading.value = false;
    emit('widget-loading', false);
  }
};

const performAction = async (containerId, action) => {
  if (!allowActions.value || !effectiveOptions.value.proxy_url) {
    alert('Actions are disabled or proxy URL is not configured.');
    return;
  }
  if (!confirm(`Are you sure you want to ${action} container ${containerId.substring(0,12)}?`)) {
    return;
  }

  actionInProgress.value = containerId;
  internalError.value = null; // Clear previous errors
  apiResponseError.value = '';

  try {
    // The backend proxy needs to be called with specific parameters for actions
    const response = await apiClient.getWidgetData(props.widgetId, {
      containerId: containerId,
      action: action, // 'start', 'stop', 'restart'
    });
    console.log(`Docker action '${action}' on ${containerId} response:`, response);
    // alert(`Container ${action} action successful.`); // Or use a more subtle notification
    fetchData(); // Refresh list after action
  } catch (error) {
    console.error(`Error performing Docker action '${action}' on ${containerId}:`, error);
    internalError.value = `Failed to ${action} container.`;
    apiResponseError.value = error.message || 'Action failed via proxy.';
    // alert(`Failed to ${action} container: ${error.message}`);
    emit('widget-error', { message: internalError.value, details: apiResponseError.value });
  } finally {
    actionInProgress.value = null;
  }
};

const getContainerName = (container) => {
  // Docker API returns names with a leading slash, e.g., "/nginx"
  return container.Names && container.Names.length > 0 ? container.Names[0].substring(1) : container.Id.substring(0, 12);
};

const statusIcon = (state) => {
  const s = state?.toLowerCase();
  if (s === 'running') return 'lens'; // Filled circle
  if (s === 'paused') return 'pause_circle_filled';
  if (s === 'restarting') return 'autorenew'; // Or loop
  if (s === 'exited' || s === 'dead' || s === 'created') return 'panorama_fish_eye'; // Empty circle
  return 'help_outline';
};

const statusIconColor = (state) => {
  const s = state?.toLowerCase();
  if (s === 'running') return 'text-green-500';
  if (s === 'paused') return 'text-yellow-500';
  if (s === 'restarting') return 'text-blue-500 animate-pulse';
  if (s === 'exited' || s === 'dead') return 'text-red-500';
  if (s === 'created') return 'text-gray-400';
  return 'text-gray-500';
};
const statusTextColor = (state) => {
  const s = state?.toLowerCase();
  if (s === 'running') return 'text-green-600 dark:text-green-400';
  if (s === 'paused') return 'text-yellow-600 dark:text-yellow-400';
  if (s === 'restarting') return 'text-blue-600 dark:text-blue-400';
  if (s === 'exited' || s === 'dead') return 'text-red-600 dark:text-red-400';
  if (s === 'created') return 'text-gray-500 dark:text-gray-400';
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
.container-item .material-icons {
    font-size: inherit; /* Make icons same size as surrounding text */
    vertical-align: middle;
}
.actions .material-icons {
    font-size: 1rem; /* 16px for action buttons */
}
.h-full.overflow-y-auto {
    max-height: calc(100% - 0px);
}
</style>
