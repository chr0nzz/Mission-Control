<template>
  <div :data-widget-id="widgetId"
       class="widget-wrapper-container h-full w-full"
       :class="{ 'is-dragging-placeholder-style': isDragging }">
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
          <button v-if="!isEditing && hasRefreshMethod" @click="triggerChildRefresh" :disabled="isDataLoading"
                  class="p-1 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                  title="Refresh widget data">
            <span class="material-icons text-lg" :class="{ 'animate-spin': isDataLoading && refreshButtonInitiated }">refresh</span>
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
        <component
          :is="dynamicallyLoadedComponent"
          v-if="dynamicallyLoadedComponent"
          :widget-id="widgetId"
          :options="currentOptions"
          @widget-error="handleChildDataError"
          @widget-loading="handleChildDataLoading"
          @widget-data-updated="handleChildDataUpdated"
          ref="dynamicWidgetInstanceRef"
          class="h-full"
        />
        <div v-else-if="componentImportAttempted && !dynamicallyLoadedComponent" class="flex justify-center items-center h-full text-xs text-red-400 p-2">
            <i>Could not load widget component: {{ widgetType }}. Check console.</i>
        </div>


        <div v-if="dynamicallyLoadedComponent && isDataLoading"
             class="absolute inset-0 flex flex-col justify-center items-center bg-white/70 dark:bg-gray-800/70 z-10 backdrop-blur-sm">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading data...</p>
        </div>
        <div v-if="dynamicallyLoadedComponent && dataError"
             class="absolute inset-0 flex flex-col justify-center items-center text-center p-2 bg-red-50/80 dark:bg-red-900/50 z-10 backdrop-blur-sm">
          <span class="material-icons text-red-500 dark:text-red-400 text-3xl">error_outline</span>
          <p class="mt-1 text-xs text-red-600 dark:text-red-300">
            {{ dataErrorMessage || 'Error loading widget data.' }}
          </p>
          <button @click="triggerChildRetry" class="mt-2 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded">
            Retry Data
          </button>
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
  isDragging: { type: Boolean, default: false }
});

const emit = defineEmits(['configure-widget', 'request-remove']);

// State for data operations of the child widget
const isDataLoading = ref(false);
const dataError = ref(false);
const dataErrorMessage = ref('');

const currentOptions = ref(JSON.parse(JSON.stringify(props.widgetOptions)));
const dynamicallyLoadedComponent = shallowRef(null);
const dynamicWidgetInstanceRef = ref(null); // Ref to the dynamic component instance
const refreshButtonInitiated = ref(false); // For refresh button spinner
const componentImportAttempted = ref(false); // Flag to know if we tried to load the component

const widgetTitle = computed(() => {
  return currentOptions.value.customLabel || props.widgetType.replace('Widget', '') || 'Widget';
});

// Component to show while the async widget is loading
const AsyncLoadingComponent = {
  template: '<div class="flex justify-center items-center h-full text-sm text-gray-400 dark:text-gray-500"><div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-300 mr-2"></div><i>Loading widget...</i></div>'
};

// Component to show if the async widget fails to load
const AsyncErrorComponent = {
  props: ['errorMsg'],
  template: '<div class="flex flex-col justify-center items-center h-full text-xs text-red-500 dark:text-red-400 p-2"><span class="material-icons text-xl">warning</span><span>{{ errorMsg }}</span><span class="mt-1">Cannot load component: {{ widgetType }}</span></div>',
  setup(props) {
    // Access widgetType from the outer scope (WidgetWrapper's props)
    // This is a bit of a hack for setup components; normally use props for error component too.
    // For simplicity, we'll rely on the outer widgetType.
    return { widgetType: props.widgetType }; // Make widgetType available if passed as prop
  }
};


const loadWidgetComponent = () => {
  console.log(`WidgetWrapper (${props.widgetId}): Attempting to load component type: ${props.widgetType}`);
  componentImportAttempted.value = true;
  isDataLoading.value = false; // Reset data states
  dataError.value = false;
  dataErrorMessage.value = '';

  if (!props.widgetType) {
    console.error(`WidgetWrapper (${props.widgetId}): widgetType is undefined or empty.`);
    dynamicallyLoadedComponent.value = shallowRef({ template: '<div class="text-red-500 p-2 text-xs">Error: Widget type is missing.</div>' });
    return;
  }

  dynamicallyLoadedComponent.value = defineAsyncComponent({
    loader: () => import(`./builtin/${props.widgetType}.vue`)
      .catch(err => {
        console.error(`WidgetWrapper (${props.widgetId}): Failed to import component module for "${props.widgetType}":`, err);
        // Return a component that displays the error, or throw to use errorComponent
        return { template: `<div class="text-red-500 p-2 text-xs">Error loading ${props.widgetType}: ${err.message}. Check console.</div>` };
      }),
    loadingComponent: AsyncLoadingComponent,
    errorComponent: { // More specific error component for import failure
        props: { error: Object, widgetTypeOuter: String }, // widgetTypeOuter to avoid conflict
        template: `<div class="flex flex-col justify-center items-center h-full text-xs text-red-500 dark:text-red-400 p-2">
                     <span class="material-icons text-xl">error</span>
                     <span>Failed to load component: <strong>{{ widgetTypeOuter }}</strong></span>
                     <span class="mt-1 text-gray-400 text-xxs">{{ error?.message }}</span>
                   </div>`,
        setup(props) { return { error: props.error, widgetTypeOuter: props.widgetTypeOuter }; } // Pass widgetType here
    },
    delay: 200, // Show loading component after 200ms
    timeout: 15000, // Timeout for loading
    // onError: (error, retry, fail, attempts) => { ... } // Can be used for more complex error handling/retry logic for component load
  });
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

// This is now primarily for retrying data fetching *within* the child
const triggerChildRetry = () => {
  dataError.value = false;
  dataErrorMessage.value = '';
  if (dynamicWidgetInstanceRef.value && typeof dynamicWidgetInstanceRef.value.fetchData === 'function') {
    dynamicWidgetInstanceRef.value.fetchData();
  } else {
    console.warn(`WidgetWrapper (${props.widgetId}): Retry data fetch called, but no fetchData method on child or child not loaded.`);
    // If component itself failed to load, retrying data won't help. User should fix component type.
    // loadWidgetComponent(); // This might be too aggressive if it was a data error.
  }
};

// Event handlers for data states from the child widget
const handleChildDataError = (errPayload) => {
  dataError.value = true;
  dataErrorMessage.value = typeof errPayload === 'string' ? errPayload : (errPayload?.message || 'An error occurred fetching widget data.');
  isDataLoading.value = false;
  refreshButtonInitiated.value = false;
};

const handleChildDataLoading = (loadingState) => {
  isDataLoading.value = loadingState;
  if (!loadingState) {
      refreshButtonInitiated.value = false;
  }
};

const handleChildDataUpdated = () => {
  isDataLoading.value = false;
  dataError.value = false;
  dataErrorMessage.value = '';
  refreshButtonInitiated.value = false;
};

const hasRefreshMethod = computed(() => {
    return dynamicWidgetInstanceRef.value && typeof dynamicWidgetInstanceRef.value.fetchData === 'function';
});

const hasConfigurableOptions = computed(() => {
    return true; 
});

const triggerChildRefresh = () => {
  if (hasRefreshMethod.value) {
    console.log(`WidgetWrapper: Refreshing data for ${props.widgetId}`);
    refreshButtonInitiated.value = true; // For spinner on button
    // isDataLoading.value = true; // Child will emit its own loading state
    dataError.value = false; 
    dataErrorMessage.value = '';
    dynamicWidgetInstanceRef.value.fetchData();
  }
};

defineExpose({
  refreshData: triggerChildRefresh, // Expose a consistent method name
});

</script>

<style scoped>
.widget-wrapper-container {
    /* Styles for the outer container if needed */
}
.widget-wrapper-content {
  display: flex;
  flex-direction: column;
}
.widget-content-area {
  flex-grow: 1;
  min-height: 80px;
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