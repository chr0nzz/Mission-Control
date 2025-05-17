<style scoped>
@import 'vue3-grid-layout/dist/style.css';
</style>

<template>
  <div class="dashboard-view p-0 md:p-2">
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p class="ml-3 text-lg text-gray-600 dark:text-gray-300">Loading Dashboard...</p>
    </div>
    <div v-else-if="error" class="text-center p-8">
      <p class="text-2xl text-red-600 dark:text-red-400">🚫 Error Loading Dashboard</p>
      <p class="text-gray-700 dark:text-gray-300 mt-2">{{ error }}</p>
      <button @click="loadInitialConfigAndLayout"
              class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
        Retry
      </button>
    </div>

    <div v-else-if="hasWidgetsInCurrentLayout" class="vue-grid-layout-container">
      <grid-layout
          :layout.sync="currentLayout" :layouts="responsiveLayouts" :col-num="colsForCurrentBreakpoint" :row-height="gridRowHeight"
          :is-draggable="isEditingMode"
          :is-resizable="isEditingMode"
          :responsive="true"
          :breakpoints="gridBreakpoints"
          :cols="gridColsByBreakpoint"
          :vertical-compact="true"
          :use-css-transforms="true"
          :margin="[gridMargin, gridMargin]"
          @layout-updated="layoutUpdatedEvent"
          @breakpoint-changed="breakpointChangedEvent"
          class="bg-gray-100 dark:bg-gray-800/30 rounded-md min-h-[400px]"
      >
          <grid-item v-for="item in currentLayout"
                     :key="item.i"
                     :x="item.x"
                     :y="item.y"
                     :w="item.w"
                     :h="item.h"
                     :i="item.i"
                     :min-w="item.minW"
                     :min-h="item.minH"
                     :max-w="item.maxW"
                     :max-h="item.maxH"
                     @resized="resizedGridItemEvent"
                     @moved="movedGridItemEvent"
                     class="vue-grid-item touch-actions-none"
                     :drag-allow-from="isEditingMode ? '.widget-drag-handle' : null"
                     :resize-allow-from="isEditingMode ? '.vue-resizable-handle' : null"
          >
              <WidgetWrapper
                :widget-id="item.i"
                :widget-type="item.widgetType"
                :widget-options="item.widgetOptions"
                :is-editing="isEditingMode"
                class="h-full w-full"
                @configure-widget="openEditWidgetModalFromGridItem"
                @request-remove="handleWidgetRemoveRequestFromGridItem"
                @update-widget-property="handleWidgetPropertyUpdateFromGridItem"
              />
          </grid-item>
      </grid-layout>
      <div v-if="isEditingMode" class="mt-6 text-center">
          <button @click="openAddNewWidgetModalToGrid"
                  class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm">
              <span class="material-icons mr-1 align-bottom">add_circle</span> Add Widget to Grid
          </button>
      </div>
    </div>
     <div v-else class="text-center p-8">
      <p class="text-xl text-gray-600 dark:text-gray-300">📋 Dashboard is empty.</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        <span v-if="isEditingMode">Add widgets to the grid.</span>
        <span v-else>Enter Edit Mode to add widgets.</span>
      </p>
       <button v-if="isEditingMode" @click="openAddNewWidgetModalToGrid" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
        Add First Widget
      </button>
    </div>


    <div class="fixed bottom-5 right-5 z-[90] print:hidden">
        <button @click="toggleEditMode"
                :class="isEditingMode ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'"
                class="text-white px-4 py-3 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                :title="isEditingMode ? 'Save Layout & Exit Edit Mode' : 'Enter Edit Mode'">
            <span v-if="isEditingMode" class="material-icons">save</span>
            <span v-else class="material-icons">edit</span>
        </button>
    </div>

    <WidgetConfigModal
      :is-open="isConfigModalOpen"
      :widget-to-edit="widgetToEditInModal"
      :available-widget-types="availableWidgetTypes"
      @close="closeConfigModal"
      @save-widget="handleSaveWidgetFromModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject, watch } from 'vue';
import { GridLayout, GridItem } from 'vue3-grid-layout'; 

import WidgetWrapper from '../components/widgets/WidgetWrapper.vue';
import WidgetConfigModal from '../components/common/WidgetConfigModal.vue';

const appConfig = inject('appConfig');
const apiClient = inject('apiClient');

const responsiveLayouts = ref({}); 
const isLoading = ref(true);
const error = ref(null);
const isEditingMode = ref(false);
const layoutDirty = ref(false); 

const gridBreakpoints = ref({lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0});
const gridColsByBreakpoint = ref({lg: 12, md: 10, sm: 6, xs: 4, xxs: 2});
const currentBreakpoint = ref('lg'); 
const gridRowHeight = ref(30); // Reduced row height for potentially shorter header widgets
const gridMargin = ref(10); 

const isConfigModalOpen = ref(false);
const widgetToEditInModal = ref(null);

const currentLayout = computed({
    get: () => responsiveLayouts.value[currentBreakpoint.value] || [],
    set: (newLayoutArray) => {
        if (responsiveLayouts.value[currentBreakpoint.value]) {
            responsiveLayouts.value[currentBreakpoint.value] = newLayoutArray;
            markLayoutAsDirty();
        }
    }
});

const colsForCurrentBreakpoint = computed(() => {
    return gridColsByBreakpoint.value[currentBreakpoint.value] || 12;
});

const hasWidgetsInCurrentLayout = computed(() => {
    return currentLayout.value && currentLayout.value.length > 0;
});


const availableWidgetTypes = ref([
  {
    type: 'SectionHeaderWidget', name: 'Section Header', description: 'Displays a title or separator for a section.', icon: 'title',
    defaultLayout: { w: 12, h: 1, minW: 2, minH: 1, maxW: 12, maxH: 2 }, // Full width, short height
    optionsSchema: [
      { name: 'customLabel', label: 'Header Text', type: 'text', required: true, placeholder: 'E.g., System Monitoring' },
      { name: 'subtitle', label: 'Subtitle (Optional)', type: 'text', placeholder: 'A short description below the header' },
      { name: 'textAlign', label: 'Text Alignment', type: 'select', default: 'left', options: [ {value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'} ] },
      { name: 'textSize', label: 'Text Size', type: 'select', default: 'xl', options: [ {value: 'lg', label: 'Large (lg)'}, {value: 'xl', label: 'Extra Large (xl)'}, {value: '2xl', label: '2XL'}, {value: '3xl', label: '3XL'} ] },
      { name: 'showDivider', label: 'Show Bottom Divider Line', type: 'checkbox', default: true },
      { name: 'marginTop', label: 'Margin Top (px)', type: 'number', default: 0, min:0, step: 4 },
      { name: 'marginBottom', label: 'Margin Bottom (px)', type: 'number', default: 0, min:0, step: 4 },
    ]
  },
  {
    type: 'DateTimeWidget', name: 'Date & Time', description: 'Shows current date and time.', icon: 'today',
    defaultLayout: { w: 4, h: 2, minW: 2, minH: 2, maxW: 6, maxH: 3 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'GlancesWidget', name: 'Glances System Stats', description: 'Monitors system resources via Glances.', icon: 'computer',
    defaultLayout: { w: 4, h: 5, minW: 3, minH: 3, maxW:8, maxH:8 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'SonarrWidget', name: 'Sonarr Upcoming', description: 'Shows upcoming Sonarr episodes.', icon: 'tv',
    defaultLayout: { w: 4, h: 6, minW: 3, minH: 4, maxW: 6, maxH: 10 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'RadarrWidget', name: 'Radarr Downloads', description: 'Shows Radarr download queue.', icon: 'movie_filter',
    defaultLayout: { w: 4, h: 5, minW: 3, minH: 3, maxW:6, maxH:8 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'QbittorrentWidget', name: 'qBittorrent Status', description: 'qBittorrent transfer info.', icon: 'download',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3, maxW:6, maxH:6 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'PiholeWidget', name: 'Pi-hole Stats', description: 'Pi-hole DNS blocking stats.', icon: 'security',
    defaultLayout: { w: 3, h: 5, minW: 2, minH: 4, maxW:5, maxH:6 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'UptimeKumaWidget', name: 'Uptime Kuma Status', description: 'Service uptime from Uptime Kuma.', icon: 'network_check',
    defaultLayout: { w: 3, h: 3, minW: 2, minH: 2, maxW:5, maxH:5 },
    optionsSchema: [ /* ... as before ... */ ]
  },
   {
    type: 'WeatherWidget', name: 'Weather Forecast', description: 'Displays weather for a location.', icon: 'wb_sunny',
    defaultLayout: { w: 3, h: 4, minW: 2, minH: 3, maxW:5, maxH:5 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'DockerWidget', name: 'Docker Containers', description: 'Lists Docker containers via a proxy.', icon: 'memory',
    defaultLayout: { w: 4, h: 5, minW: 3, minH: 3, maxW:8, maxH:8 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'HomeAssistantWidget', name: 'Home Assistant Entity', description: 'Shows state of an HA entity.', icon: 'home_iot_device',
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2, maxW:6, maxH:4 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'OverseerrWidget', name: 'Overseerr Requests', description: 'Media requests from Overseerr.', icon: 'playlist_add_check',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3, maxW:6, maxH:6 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'PlexTautulliWidget', name: 'Plex/Tautulli Activity', description: 'Plex streaming activity.', icon: 'play_circle_filled',
    defaultLayout: { w: 4, h: 5, minW: 3, minH: 3, maxW:8, maxH:8 },
    optionsSchema: [ /* ... as before ... */ ]
  },
  {
    type: 'MqttSubscriberWidget', name: 'MQTT Subscriber', description: 'Displays messages from an MQTT topic.', icon: 'rss_feed',
    defaultLayout: {w: 3, h: 2, minW:2, minH:2, maxW:6, maxH:4},
    optionsSchema: [ /* ... as before ... */ ]
  }
]);


const generateLayoutForBreakpoint = (sourceLayout, breakpointCols) => {
    let currentX = 0;
    let currentY = 0;
    let rowMaxH = 0;
    return sourceLayout.map(widget => {
        const widgetTypeDetails = availableWidgetTypes.value.find(wt => wt.type === widget.widgetType);
        const defaultDims = widgetTypeDetails?.defaultLayout || { w: 4, h: 2 };
        
        let newW = Math.min(breakpointCols, defaultDims.w);
        if (widget.w && breakpointCols >= widget.w) newW = widget.w;
        else if (widget.w) newW = breakpointCols; 

        if (currentX + newW > breakpointCols) {
            currentX = 0;
            currentY += rowMaxH;
            rowMaxH = 0;
        }
        const newItem = {
            ...widget, 
            x: currentX, y: currentY, w: newW, h: widget.h || defaultDims.h, 
            minW: Math.min(defaultDims.minW || 1, colsForCurrentBreakpoint.value), // Ensure minW is not > cols
            minH: defaultDims.minH || 1,
            maxW: defaultDims.maxW ? Math.min(defaultDims.maxW, colsForCurrentBreakpoint.value) : colsForCurrentBreakpoint.value,
            maxH: defaultDims.maxH,
        };
        currentX += newW;
        rowMaxH = Math.max(rowMaxH, newItem.h);
        return newItem;
    });
};


const transformLegacyLayoutToResponsive = (legacyLayoutData) => {
    const newResponsiveLayouts = {};
    let baseLgLayout = [];
    if (legacyLayoutData && legacyLayoutData.length > 0 && legacyLayoutData[0].hasOwnProperty('x') && legacyLayoutData[0].hasOwnProperty('widgetType')) {
        baseLgLayout = JSON.parse(JSON.stringify(legacyLayoutData));
    } else {
        let tempY = 0, tempX = 0;
        (legacyLayoutData || []).forEach(column => {
            let colMaxH = 0;
            (column.sections || []).forEach(section => {
                let secMaxH = 0;
                (section.widgets || []).forEach(widget => {
                    const widgetTypeDetails = availableWidgetTypes.value.find(wt => wt.type === widget.type);
                    const defaultGridProps = widgetTypeDetails?.defaultLayout || { w: 4, h: 2, minW:1, minH:1 };
                    baseLgLayout.push({
                        i: widget.id, x: tempX, y: tempY,
                        w: widget.layout?.w || defaultGridProps.w,
                        h: widget.layout?.h || defaultGridProps.h,
                        minW: widget.layout?.minW || defaultGridProps.minW,
                        maxW: widget.layout?.maxW || defaultGridProps.maxW,
                        minH: widget.layout?.minH || defaultGridProps.minH,
                        maxH: widget.layout?.maxH || defaultGridProps.maxH,
                        widgetType: widget.type, widgetOptions: widget.options || {}
                    });
                    tempX += (widget.layout?.w || defaultGridProps.w);
                    secMaxH = Math.max(secMaxH, (widget.layout?.h || defaultGridProps.h));
                    if (tempX >= gridColsByBreakpoint.value.lg) { tempX = 0; tempY += colMaxH > 0 ? colMaxH : secMaxH; colMaxH = 0; }
                });
                if (section.widgets?.length > 0) colMaxH = Math.max(colMaxH, secMaxH);
            });
            if (column.sections?.length > 0 && colMaxH > 0) tempY += colMaxH;
            tempX = 0;
        });
    }

    Object.keys(gridBreakpoints.value).forEach(bp => {
        newResponsiveLayouts[bp] = generateLayoutForBreakpoint(baseLgLayout, gridColsByBreakpoint.value[bp]);
    });
    return newResponsiveLayouts;
};


const loadInitialConfigAndLayout = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let configToProcess;
    if (appConfig.value && appConfig.value.dashboard) {
      configToProcess = appConfig.value.dashboard;
    } else {
      const fullConfig = await apiClient.get('/config');
      if (fullConfig && fullConfig.dashboard) {
        configToProcess = fullConfig.dashboard;
        appConfig.value = appConfig.value ? { ...appConfig.value, ...fullConfig } : fullConfig;
      } else {
        configToProcess = { layouts: {} }; 
      }
    }

    if (configToProcess.layouts && typeof configToProcess.layouts === 'object' && Object.keys(configToProcess.layouts).length > 0) {
        const loadedLayouts = JSON.parse(JSON.stringify(configToProcess.layouts));
        Object.keys(gridBreakpoints.value).forEach(bp => {
            if (!loadedLayouts[bp] || !Array.isArray(loadedLayouts[bp])) { // Ensure array exists
                // If a breakpoint layout is missing, generate it from 'lg' or an empty array
                const sourceForGeneration = loadedLayouts.lg || [];
                loadedLayouts[bp] = generateLayoutForBreakpoint(sourceForGeneration, gridColsByBreakpoint.value[bp]);
                if (sourceForGeneration.length > 0 || !configToProcess.layouts[bp]) { // Mark dirty if we generated or if it was truly missing
                  markLayoutAsDirty();
                }
            }
        });
        responsiveLayouts.value = loadedLayouts;
    } else if (configToProcess.layout) { 
        console.warn("Legacy dashboard.layout format detected. Transforming to responsive layouts.");
        responsiveLayouts.value = transformLegacyLayoutToResponsive(configToProcess.layout);
        markLayoutAsDirty(); 
    } else {
        console.log("No layout configuration found. Initializing empty responsive layouts.");
        const emptyLayouts = {};
        Object.keys(gridBreakpoints.value).forEach(bp => { emptyLayouts[bp] = []; });
        responsiveLayouts.value = emptyLayouts;
    }

  } catch (err) {
    console.error('Error processing dashboard configuration:', err);
    error.value = err.message || 'Could not load dashboard data.';
    const emptyLayouts = {};
    Object.keys(gridBreakpoints.value).forEach(bp => { emptyLayouts[bp] = []; });
    responsiveLayouts.value = emptyLayouts;
  } finally {
    isLoading.value = false;
  }
};

watch(appConfig, (newVal, oldVal) => {
    if (newVal?.dashboard && JSON.stringify(newVal.dashboard) !== JSON.stringify(oldVal?.dashboard)) {
        loadInitialConfigAndLayout();
    } else if (!newVal && oldVal) {
        const emptyLayouts = {};
        Object.keys(gridBreakpoints.value).forEach(bp => { emptyLayouts[bp] = []; });
        responsiveLayouts.value = emptyLayouts;
        isLoading.value = false;
    }
}, { deep: true });

onMounted(() => {
    loadInitialConfigAndLayout();
});

const markLayoutAsDirty = () => {
    if (isEditingMode.value) {
        layoutDirty.value = true;
    }
};

const saveGridLayout = async () => {
  try {
    const currentDashboardStructure = appConfig.value?.dashboard || { pageInfo: { title: "Mission Control"}, layouts: {} };
    const layoutsToSave = JSON.parse(JSON.stringify(responsiveLayouts.value));
    
    for (const bp in layoutsToSave) {
        layoutsToSave[bp] = layoutsToSave[bp].map(item => ({
            i: item.i, x: item.x, y: item.y, w: item.w, h: item.h,
            minW: item.minW, maxW: item.maxW, minH: item.minH, maxH: item.maxH,
            widgetType: item.widgetType, widgetOptions: item.widgetOptions,
        }));
    }

    const updatedFullConfig = { ...currentDashboardStructure, layouts: layoutsToSave }; 

    await apiClient.post('/config', { type: 'dashboard', payload: updatedFullConfig });
    
    if (appConfig.value) { appConfig.value.dashboard = updatedFullConfig; }
    layoutDirty.value = false;
    console.log('Responsive grid layouts saved successfully.');
  } catch (err) {
    console.error('Failed to save responsive grid layouts:', err);
    error.value = 'Failed to save layout: ' + err.message;
  }
};

const toggleEditMode = async () => {
  const exitingEditMode = isEditingMode.value;
  isEditingMode.value = !isEditingMode.value;
  if (exitingEditMode && layoutDirty.value) {
    await saveGridLayout();
  } else if (exitingEditMode && !layoutDirty.value) {
    console.log("Exited edit mode. No changes to save.");
  } else { 
    layoutDirty.value = false; 
  }
};

const openAddNewWidgetModalToGrid = () => {
  widgetToEditInModal.value = null;
  isConfigModalOpen.value = true;
};

const openEditWidgetModalFromGridItem = (configureEventPayload) => {
  const widgetItem = currentLayout.value.find(w => w.i === configureEventPayload.widgetId);
  if (widgetItem) {
    widgetToEditInModal.value = { 
        id: widgetItem.i,
        type: widgetItem.widgetType,
        options: JSON.parse(JSON.stringify(widgetItem.widgetOptions || {}))
    };
    isConfigModalOpen.value = true;
  } else {
      console.error("Cannot find widget to edit in current layout:", configureEventPayload.widgetId);
  }
};

const closeConfigModal = () => {
  isConfigModalOpen.value = false;
  widgetToEditInModal.value = null;
};

const handleSaveWidgetFromModal = (savedWidgetData) => {
  if (widgetToEditInModal.value && widgetToEditInModal.value.id === savedWidgetData.id) { 
    Object.keys(responsiveLayouts.value).forEach(bp => {
        const bpLayout = responsiveLayouts.value[bp];
        const index = bpLayout.findIndex(w => w.i === savedWidgetData.id);
        if (index !== -1) {
            bpLayout[index].widgetOptions = savedWidgetData.options;
            if (bpLayout[index].widgetType !== savedWidgetData.type) {
                const newTypeDetails = availableWidgetTypes.value.find(wt => wt.type === savedWidgetData.type);
                const newDefaultLayout = newTypeDetails?.defaultLayout || {w:4,h:2,minW:1,minH:1};
                bpLayout[index].widgetType = savedWidgetData.type;
                const colsForBp = gridColsByBreakpoint.value[bp] || 12;
                bpLayout[index].w = Math.min(newDefaultLayout.w, colsForBp);
                bpLayout[index].h = newDefaultLayout.h;
                bpLayout[index].minW = Math.min(newDefaultLayout.minW || 1, colsForBp);
                bpLayout[index].minH = newDefaultLayout.minH || 1;
                bpLayout[index].maxW = newDefaultLayout.maxW ? Math.min(newDefaultLayout.maxW, colsForBp) : colsForBp;
                bpLayout[index].maxH = newDefaultLayout.maxH;
            }
        }
    });
  } else { 
    const widgetTypeDetails = availableWidgetTypes.value.find(wt => wt.type === savedWidgetData.type);
    const defaultGridProps = widgetTypeDetails?.defaultLayout || { w: 4, h: 2, minW:1, minH:1 };
    
    Object.keys(responsiveLayouts.value).forEach(bp => {
        let maxY = 0;
        responsiveLayouts.value[bp].forEach(item => {
            if (item.y + item.h > maxY) maxY = item.y + item.h;
        });
        const colsForBp = gridColsByBreakpoint.value[bp] || 12;
        const newWidget = {
            i: savedWidgetData.id, x: 0, y: maxY, 
            w: Math.min(defaultGridProps.w, colsForBp), 
            h: defaultGridProps.h,
            minW: Math.min(defaultGridProps.minW || 1, colsForBp),
            minH: defaultGridProps.minH || 1,
            maxW: defaultGridProps.maxW ? Math.min(defaultGridProps.maxW, colsForBp) : colsForBp,
            maxH: defaultGridProps.maxH,
            widgetType: savedWidgetData.type,
            widgetOptions: savedWidgetData.options,
        };
        responsiveLayouts.value[bp].push(newWidget);
    });
  }
  markLayoutAsDirty();
};

const handleWidgetRemoveRequestFromGridItem = ({ widgetId }) => {
  if (!confirm(`Are you sure you want to remove widget "${widgetId}"?`)) return;
  Object.keys(responsiveLayouts.value).forEach(bp => {
      responsiveLayouts.value[bp] = responsiveLayouts.value[bp].filter(w => w.i !== widgetId);
  });
  markLayoutAsDirty();
};

const layoutUpdatedEvent = (newLayoutArrayForCurrentBreakpoint) => {
  if (currentBreakpoint.value && responsiveLayouts.value[currentBreakpoint.value]) {
      if (JSON.stringify(responsiveLayouts.value[currentBreakpoint.value]) !== JSON.stringify(newLayoutArrayForCurrentBreakpoint)) {
          responsiveLayouts.value[currentBreakpoint.value] = newLayoutArrayForCurrentBreakpoint;
          markLayoutAsDirty();
          console.log(`Layout updated for breakpoint: ${currentBreakpoint.value}`);
      }
  }
};

const breakpointChangedEvent = (newBreakpoint, newCols) => {
  console.log(`Breakpoint changed to: ${newBreakpoint}, Columns: ${newCols}`);
  currentBreakpoint.value = newBreakpoint;
};

const resizedGridItemEvent = (i, newH, newW, newHPx, newWPx) => {
  const layoutForCurrentBp = responsiveLayouts.value[currentBreakpoint.value];
  if (layoutForCurrentBp) {
      const item = layoutForCurrentBp.find(it => it.i === i);
      if (item && (item.w !== newW || item.h !== newH)) {
          item.w = newW; item.h = newH;
          markLayoutAsDirty();
      }
  }
};

const movedGridItemEvent = (i, newX, newY) => {
   const layoutForCurrentBp = responsiveLayouts.value[currentBreakpoint.value];
   if (layoutForCurrentBp) {
      const item = layoutForCurrentBp.find(it => it.i === i);
      if (item && (item.x !== newX || item.y !== newY)) {
          item.x = newX; item.y = newY;
          markLayoutAsDirty();
      }
  }
};

const handleWidgetPropertyUpdateFromGridItem = ({ widgetId, propertyName, newValue }) => {
    Object.keys(responsiveLayouts.value).forEach(bp => {
        const widget = responsiveLayouts.value[bp].find(w => w.i === widgetId);
        if (widget) {
            if (!widget.widgetOptions) widget.widgetOptions = {};
            widget.widgetOptions[propertyName] = newValue;
        }
    });
    markLayoutAsDirty();
};

</script>

<style>
@import 'vue3-grid-layout/dist/style.css';

.vue-grid-layout { transition: background-color 0.3s ease; }
.vue-grid-item { transition: all 0.2s ease; overflow: hidden; }
.vue-grid-item.vue-grid-placeholder { background: #a0aec0; opacity: 0.4; border-radius: 0.5rem; transition-duration: 100ms; }
.vue-grid-item .vue-resizable-handle {
  background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Cpath d="M 8 0 L 10 0 L 10 2 L 8 2 L 8 0 M 0 8 L 2 8 L 2 10 L 0 10 L 0 8 M 8 8 L 10 8 L 10 10 L 8 10 L 8 8 M 0 0" fill="%23333"/%3E%3C/svg%3E') !important;
  background-position: bottom right; padding: 0 3px 3px 0; background-repeat: no-repeat;
  background-origin: content-box; box-sizing: border-box; cursor: se-resize;
  right: 5px !important; bottom: 5px !important; width: 20px !important; height: 20px !important;
}
.vue-grid-item > .widget-wrapper-container { height: 100%; width: 100%; display: flex; flex-direction: column; }
.touch-actions-none { touch-action: none; }
</style>
