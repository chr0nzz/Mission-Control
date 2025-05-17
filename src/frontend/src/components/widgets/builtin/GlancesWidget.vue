    <template>
      <div class="glances-widget p-1 h-full">
        <div v-if="internalLoading && !hasData" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-400"></div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">Fetching Glances data...</p>
        </div>
        <div v-else-if="internalError" class="text-red-500 dark:text-red-400 text-xs p-2 text-center">
          <p><strong>Error:</strong> {{ internalError }}</p>
          <p v-if="apiResponseError" class="mt-1 text-xs">({{ apiResponseError }})</p>
        </div>
        <div v-else-if="glancesData" class="space-y-2 text-xs sm:text-sm">
          <div v-if="shouldDisplay('cpu') && glancesData.cpu" class="metric-item">
            <div class="flex justify-between items-center mb-0.5">
              <span class="font-medium text-gray-600 dark:text-gray-300">CPU</span>
              <span class="text-indigo-600 dark:text-indigo-400 font-semibold">{{ glancesData.cpu.total?.toFixed(1) || 'N/A' }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-2.5">
              <div class="bg-indigo-500 h-2 sm:h-2.5 rounded-full transition-all duration-300" :style="{ width: (glancesData.cpu.total || 0) + '%' }"></div>
            </div>
          </div>

          <div v-if="shouldDisplay('mem') && glancesData.mem" class="metric-item">
            <div class="flex justify-between items-center mb-0.5">
              <span class="font-medium text-gray-600 dark:text-gray-300">RAM</span>
              <span class="text-green-600 dark:text-green-400 font-semibold">{{ glancesData.mem.percent?.toFixed(1) || 'N/A' }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-2.5">
              <div class="bg-green-500 h-2 sm:h-2.5 rounded-full transition-all duration-300" :style="{ width: (glancesData.mem.percent || 0) + '%' }"></div>
            </div>
            <div class="text-right text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {{ formatBytes(glancesData.mem.used) }} / {{ formatBytes(glancesData.mem.total) }}
            </div>
          </div>
          
          <div v-if="shouldDisplay('swap') && glancesData.swap && glancesData.swap.total > 0" class="metric-item">
            <div class="flex justify-between items-center mb-0.5">
              <span class="font-medium text-gray-600 dark:text-gray-300">Swap</span>
              <span class="text-yellow-600 dark:text-yellow-400 font-semibold">{{ glancesData.swap.percent?.toFixed(1) || 'N/A' }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-2.5">
              <div class="bg-yellow-500 h-2 sm:h-2.5 rounded-full transition-all duration-300" :style="{ width: (glancesData.swap.percent || 0) + '%' }"></div>
            </div>
             <div class="text-right text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {{ formatBytes(glancesData.swap.used) }} / {{ formatBytes(glancesData.swap.total) }}
            </div>
          </div>

          <div v-if="shouldDisplay('load') && glancesData.load" class="metric-item">
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-600 dark:text-gray-300">Load Avg</span>
              <span class="text-gray-700 dark:text-gray-200">
                {{ glancesData.load.min1?.toFixed(2) || 'N/A' }},
                {{ glancesData.load.min5?.toFixed(2) || 'N/A' }},
                {{ glancesData.load.min15?.toFixed(2) || 'N/A' }}
              </span>
            </div>
          </div>
          
          <div v-if="shouldDisplay('network') && glancesData.network" class="metric-item">
            <div v-for="(netInterface, name) in glancesData.network" :key="name">
              <div v-if="name === networkInterface || !networkInterface" class="mt-1">
                <div class="font-medium text-gray-600 dark:text-gray-300">Network ({{ name }})</div>
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>RX: {{ formatBytes(netInterface.cx_speed_rx || netInterface.rx_rate || 0, true) }}/s</span>
                  <span>TX: {{ formatBytes(netInterface.cx_speed_tx || netInterface.tx_rate || 0, true) }}/s</span>
                </div>
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Total RX: {{ formatBytes(netInterface.cumulative_cx_rx || netInterface.cumulative_rx || 0) }}</span>
                  <span>Total TX: {{ formatBytes(netInterface.cumulative_cx_tx || netInterface.cumulative_tx || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="shouldDisplay('fs') && glancesData.fs" class="metric-item">
            <div v-for="fs_item in glancesData.fs" :key="fs_item.mnt_point">
                <div v-if="!diskName || fs_item.disk_name === diskName || fs_item.mnt_point === diskName" class="mt-1">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="font-medium text-gray-600 dark:text-gray-300 truncate" :title="fs_item.mnt_point">FS ({{ fs_item.disk_name || fs_item.mnt_point }})</span>
                        <span class="text-purple-600 dark:text-purple-400 font-semibold">{{ fs_item.percent?.toFixed(1) || 'N/A' }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-2.5">
                        <div class="bg-purple-500 h-2 sm:h-2.5 rounded-full transition-all duration-300" :style="{ width: (fs_item.percent || 0) + '%' }"></div>
                    </div>
                    <div class="text-right text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        {{ formatBytes(fs_item.used) }} / {{ formatBytes(fs_item.size) }}
                    </div>
                </div>
            </div>
          </div>

          <div v-if="shouldDisplay('uptime') && glancesData.uptime" class="metric-item">
             <div class="flex justify-between items-center">
              <span class="font-medium text-gray-600 dark:text-gray-300">Uptime</span>
              <span class="text-gray-700 dark:text-gray-200">{{ glancesData.uptime }}</span>
            </div>
          </div>

        </div>
        <div v-else class="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
          No Glances data available or widget not configured to display metrics.
        </div>
      </div>
    </template>

    <script setup>
    import { ref, onMounted, onUnmounted, watch, inject, computed, defineEmits, defineExpose } from 'vue';

    const props = defineProps({
      widgetId: { type: String, required: true },
      options: {
        type: Object,
        default: () => ({
          url: '', 
          metrics_to_display: 'cpu,mem,load,fs,uptime', // Default metrics as a string
          glances_api_version: '4', 
          refresh_interval: 10, 
          network_interface: null, 
          disk_name: null, 
        }),
      },
    });

    const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

    const apiClient = inject('apiClient');
    const glancesData = ref(null);
    const internalLoading = ref(false);
    const internalError = ref(null);
    const apiResponseError = ref('');
    let refreshTimerId = null;

    const hasData = computed(() => glancesData.value && Object.keys(glancesData.value).length > 0);

    const metricsToDisplayArray = computed(() => {
        if (typeof effectiveOptions.value.metrics_to_display === 'string') {
            return effectiveOptions.value.metrics_to_display.split(',').map(m => m.trim()).filter(m => m);
        }
        return Array.isArray(effectiveOptions.value.metrics_to_display) ? effectiveOptions.value.metrics_to_display : ['cpu', 'mem', 'load'];
    });


    const effectiveOptions = computed(() => {
        return {
            url: props.options.url || '',
            metrics_to_display: props.options.metrics_to_display || 'cpu,mem,load,fs,uptime',
            glances_api_version: props.options.glances_api_version || '4',
            refresh_interval: parseInt(props.options.refresh_interval, 10) || 10,
            network_interface: props.options.network_interface || null,
            disk_name: props.options.disk_name || null,
        };
    });

    const networkInterface = computed(() => effectiveOptions.value.network_interface);
    const diskName = computed(() => effectiveOptions.value.disk_name);

    const fetchData = async () => {
      if (!effectiveOptions.value.url) {
        internalError.value = 'Glances API URL is not configured.';
        apiResponseError.value = '';
        emit('widget-error', internalError.value);
        return;
      }

      internalLoading.value = true;
      internalError.value = null;
      apiResponseError.value = '';
      emit('widget-loading', true);

      try {
        // The backend proxy service now expects options.metrics_to_display to be used directly.
        // No need to pass metrics as clientQuery params here if proxy handles it.
        const response = await apiClient.getWidgetData(props.widgetId, {});
        glancesData.value = response;
        emit('widget-data-updated');
      } catch (error) {
        console.error(`Error fetching Glances data for widget ${props.widgetId}:`, error);
        internalError.value = 'Failed to fetch Glances data.';
        apiResponseError.value = error.message || 'Unknown API error.';
        emit('widget-error', { message: internalError.value, details: apiResponseError.value });
      } finally {
        internalLoading.value = false;
        emit('widget-loading', false);
      }
    };

    const shouldDisplay = (metricKey) => {
      return metricsToDisplayArray.value.includes(metricKey);
    };

    const formatBytes = (bytes, perSecond = false) => {
      if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
      if (bytes === 0) return '0 B' + (perSecond ? '/s' : '');
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
      return `${value} ${sizes[i]}` + (perSecond ? '/s' : '');
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
    .metric-item {
      /* Styles for individual metric items if needed */
    }
    </style>
    
