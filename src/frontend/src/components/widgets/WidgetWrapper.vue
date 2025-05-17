<template>
  <div :data-widget-id="widgetId"
       class="widget-wrapper-container h-full w-full"
       :class="{ 'is-dragging-placeholder-style': isDragging }"> {/* Apply a style if isDragging prop is true */}
    <div class="widget-wrapper-content bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col h-full transition-all duration-150 ease-in-out">
      <div class="widget-header flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div class="flex items-center truncate">
          <button v-if="isEditing"
                  class="widget-drag-handle cursor-move p-1 mr-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  title="Drag to reorder widget">
            <span class="material-icons text-base">drag_indicator</span>
          </button>
          <h3 class="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 truncate" :title="widgetTitle">
            {{ widgetTitle }}
          </h3>
        </div>
        <div class="widget-actions flex items-center space-x-1 sm:space-x-2">
          <button v-if="!isEditing && hasRefresh" @click="refreshWidgetData" :disabled="isLoading"
                  class="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                  title="Refresh widget data">
            <span class="material-icons text-lg" :class="{ 'animate-spin': isLoading && refreshInitiated }">refresh</span>
          </button>
          <button v-if="isEditing || hasConfigurableOptions" @click="openConfigurationModal"
                  class="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                  title="Configure widget">
            <span class="material-icons text-lg">settings</span>
          </button>
          <button v-if="isEditing" @click="requestRemove"
                  class="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 focus:outline-none"
                  title="Remove widget">
            <span class="material-icons text-lg">delete_outline</span>
          </button>
        </div>
      </div>

      <div class="widget-content-area p-3 sm:p-4 flex-grow min-h-[80px] relative overflow-y-auto custom-scrollbar">
        <div v-if="isLoading && !refreshInitiated && !componentLoadFailed" class="absolute inset-0 flex flex-col justify-center items-center bg-white/50 dark:bg-gray-800/50 z-10">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
        <div v-if="error || componentLoadFailed" class="absolute inset-0 flex flex-col justify-center items-center text-center p-2 bg-red-50 dark:bg-red-900/30 z-10">
          <span class="material-icons text-red-500 dark:text-red-400 text-3xl">error_outline</span>
          <p class="mt-1 text-xs text-red-600 dark:text-red-300">
            {{ componentLoadFailed ? 'Widget component failed to load.' : (errorMessage || 'Error loading data.') }}
          </p>
          <button @click="retryDataFetch" class="mt-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded">
            Retry
          </button>
        </div>

        <component
          :is="loadedWidgetComponent"
          v-if="loadedWidgetComponent && !error && !componentLoadFailed && !(isLoading && !refreshInitiated)"
          :widget-id="widgetId"
          :options="currentOptions"
          @widget-error="handleWidgetError"
          @widget-loading="handleWidgetLoading"
          @widget-data-updated="handleWidgetDataUpdated"
          ref="dynamicWidgetRef"
          class="h-full"
        />
        <div v-if="!loadedWidgetComponent && !isLoading && !error && !componentLoadFailed" class="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          Widget type "{{ widgetType }}" not found or is not yet loaded.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, onMounted, watch, shallowRef } from 'vue';

const props = defineProps({
  widgetId: { type: String, required: true },
  widgetType: { type: String, required: true },
  widgetOptions: { type: Object, default: () => ({}) },
  isEditing: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false } // New prop to indicate if item is being dragged by grid library
});

const emit = defineEmits(['configure-widget', 'request-remove']);

const isLoading = ref(false); // For data loading within the widget, or initial component load
const error = ref(null);    // For data loading errors within the widget
const errorMessage = ref('');
const componentLoadFailed = ref(false); // Specifically for dynamic component import failure

const currentOptions = ref(JSON.parse(JSON.stringify(props.widgetOptions)));
const loadedWidgetComponent = shallowRef(null);
const dynamicWidgetRef = ref(null); // Ref to the dynamic component instance
const refreshInitiated = ref(false); // To differentiate initial load from manual refresh spin

const widgetTitle = computed(() => {
  return currentOptions.value.customLabel || props.widgetType.replace('Widget', '') || 'Widget';
});

const loadWidgetComponent = async () => {
  isLoading.value = true; // Indicate loading while component is being imported
  error.value = null;
  componentLoadFailed.value = false;
  errorMessage.value = '';
  try {
    // Dynamically import the widget component based on widgetType
    // Assuming widget components are in src/components/widgets/builtin/
    // The name should match the file name, e.g., GlancesWidget.vue for "GlancesWidget" type
    const component = defineAsyncComponent({
      loader: () => import(`./builtin/${props.widgetType}.vue`),
      loadingComponent: { // Optional: A simple component to show during async load
        template: '<div class="flex justify-center items-center h-full text-xs text-gray-400"><i>Loading component...</i></div>'
      },
      errorComponent: { // Optional: Component to show if async load fails
        template: '<div class="flex justify-center items-center h-full text-xs text-red-400 p-2"><i>Error loading widget component.</i></div>'
      },
      timeout: 15000, // Timeout for loading component
      // onError(err, retry, fail, attempts) handled by catch below
    });
    loadedWidgetComponent.value = component;
  } catch (err) {
    console.error(`WidgetWrapper: Failed to start loading component for widget type "${props.widgetType}":`, err);
    error.value = true; // Generic error flag
    componentLoadFailed.value = true; // Specific flag for component load failure
    errorMessage.value = `Could not load widget component: ${props.widgetType}. ${err.message}`;
    loadedWidgetComponent.value = null;
  } finally {
    // isLoading.value = false; // Let the async component's loading/error state manage this primarily
    // The defineAsyncComponent itself has loading/error states.
    // We set isLoading to true initially, and the child widget (or defineAsyncComponent's states) should manage it further.
    // If the import itself fails, the catch block handles it.
  }
};

onMounted(() => {
  loadWidgetComponent();
});

watch(() => props.widgetOptions, (newOptions) => {
  currentOptions.value = JSON.parse(JSON.stringify(newOptions));
}, { deep: true, immediate: true });


watch(() => props.widgetType, (newType, oldType) => {
  if (newType !== oldType) {
    console.log(`WidgetWrapper (${props.widgetId}): Type changed from ${oldType} to ${newType}. Reloading component.`);
    loadWidgetComponent();
  }
});


const openConfigurationModal = () => {
  emit('configure-widget', { widgetId: props.widgetId, currentOptions: currentOptions.value });
};

const requestRemove = () => {
  if (confirm(`Are you sure you want to remove the "${widgetTitle.value}" widget?`)) {
    emit('request-remove', { widgetId: props.widgetId });
  }
};

const retryDataFetch = () => {
  error.value = null;
  componentLoadFailed.value = false;
  errorMessage.value = '';
  if (!loadedWidgetComponent.value || componentLoadFailed.value) { // If component itself failed to load
    loadWidgetComponent();
  } else if (dynamicWidgetRef.value && typeof dynamicWidgetRef.value.fetchData === 'function') {
    dynamicWidgetRef.value.fetchData(); // Call child's fetchData method
  } else {
    console.warn(`WidgetWrapper (${props.widgetId}): Retry called, but no fetchData method on child or component not loaded.`);
  }
};

// Event handlers for events emitted by the dynamically loaded widget
const handleWidgetError = (errPayload) => {
  error.value = true;
  componentLoadFailed.value = false; // This is a data error, not component load error
  errorMessage.value = typeof errPayload === 'string' ? errPayload : (errPayload?.message || 'An error occurred in the widget.');
  isLoading.value = false;
  refreshInitiated.value = false;
};

const handleWidgetLoading = (loadingState) => {
  if (!refreshInitiated.value) { // Only update main isLoading if not a manual refresh
    isLoading.value = loadingState;
  }
  if (!loadingState) { // If loading finishes (successfully or not from child's perspective)
      refreshInitiated.value = false; // Reset refresh flag
  }
};

const handleWidgetDataUpdated = () => {
  isLoading.value = false;
  error.value = null;
  componentLoadFailed.value = false;
  errorMessage.value = '';
  refreshInitiated.value = false;
};

const hasRefresh = computed(() => {
    return loadedWidgetComponent.value && dynamicWidgetRef.value && typeof dynamicWidgetRef.value.fetchData === 'function';
});

const hasConfigurableOptions = computed(() => {
    // This could be more sophisticated if widgets declare if they have options.
    // For now, assume all might have options or a label to configure.
    return true;
});


const refreshWidgetData = () => {
  if (hasRefresh.value) {
    console.log(`WidgetWrapper: Refreshing data for ${props.widgetId}`);
    isLoading.value = true; // Show spinner on refresh button or main loader
    refreshInitiated.value = true;
    error.value = null;
    componentLoadFailed.value = false;
    errorMessage.value = '';
    dynamicWidgetRef.value.fetchData();
  }
};

// Expose methods to parent if needed (e.g., for direct refresh call from DashboardView)
defineExpose({
  refreshWidgetData,
});

</script>

<style scoped>
.widget-wrapper-container {
    /* This outer container is the direct child of GridItem, should be h-full w-full */
    /* Adding a subtle border or effect when being dragged by vue-grid-layout */
}
.widget-wrapper-container.is-dragging-placeholder-style { /* Conceptual class name */
    /* outline: 2px dashed #4f46e5;
    outline-offset: -2px; */
}

.widget-wrapper-content {
  display: flex;
  flex-direction: column;
}

.widget-content-area {
  flex-grow: 1;
  min-height: 80px; /* Ensure a minimum tappable/visible area */
}
.widget-content-area.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.widget-content-area.custom-scrollbar::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-700/50 rounded-full; }
.widget-content-area.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-500 rounded-full; }
.widget-content-area.custom-scrollbar::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-400; }


.widget-drag-handle .material-icons {
  font-size: 20px; /* Adjust drag handle icon size */
}

.widget-actions .material-icons {
  font-size: 18px; /* Adjust action icon size */
}
</style>