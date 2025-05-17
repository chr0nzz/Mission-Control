# 🧑‍💻🔧 06: Custom Widget Development

**(⚠️ Note: The dynamic loading of custom user-provided widgets from `/app_data/custom_widgets/` is a planned feature and may not be fully implemented in the current version of the generated codebase. This document outlines the intended design, API, and steps for when this feature is available.)**

So you want to build your own widget for Mission Control? Awesome! 🎉 This guide will walk you through the planned process, concepts, and best practices for creating and integrating your own custom widgets once the dynamic loading feature is implemented.

Mission Control is designed to be extensible. If there's a service or piece of information you want on your dashboard that isn't covered by a built-in widget, the goal is to allow you to create your own.

## 🎒 Prerequisites

Before you start developing a custom widget, it's helpful to have:

* **Frontend Framework Knowledge**: Strong familiarity with **Vue.js 3 (Composition API)**, as Mission Control's frontend is built with it.
* **JavaScript (ES6+)**: Solid understanding of modern JavaScript.
* **HTML & CSS**: For structuring and styling your widget. Knowledge of **Tailwind CSS** is highly beneficial as it's used throughout Mission Control for styling.
* **Understanding of APIs**: If your widget will fetch data from an external service.
* **MQTT Knowledge (Optional)**: If your widget will subscribe to MQTT topics for real-time data.
* **Vue Single File Components (SFCs)**: You'll be creating `.vue` files.

## 🏛️ Widget Architecture Overview (Planned)

A custom widget in Mission Control will typically consist of two main parts:

1.  **Frontend Vue Component (`YourWidgetName.vue`)**:
    * This is the visual part of your widget, written as a standard Vue Single File Component (SFC).
    * It will be dynamically loaded and rendered by the `WidgetWrapper.vue` component.
    * **Responsibilities**:
        * Displaying data fetched or received.
        * Handling any user interactions specific to your widget.
        * Receiving configuration `options` (defined by you in a manifest, configured by the user in `dashboard.yml` via the UI modal).
        * Fetching data:
            * Using the provided `apiClient` to make requests through Mission Control's backend proxy (for security, especially if API keys are involved). This is done by calling `apiClient.getWidgetData(widgetId, clientSpecificParams)`. The backend `widgetProxyService` would need a case for your custom widget type if it requires specific backend logic beyond a simple URL proxy. For truly generic custom widgets fetching from a user-supplied URL, the `widgetProxyService` might need a generic "proxy URL" capability.
            * Directly fetching from public, keyless APIs (being mindful of CORS).
            * Subscribing to MQTT topics using the provided `mqttClientService`.
        * Managing its own internal loading and error states.
        * Emitting standard events (`@widget-loading`, `@widget-error`, `@widget-data-updated`) to the `WidgetWrapper` for consistent UI feedback.

2.  **Widget Manifest File (`manifest.json`)**:
    * A JSON file placed alongside your `.vue` component.
    * This file describes your widget to Mission Control, allowing it to be discovered and used.
    * **Contents**:
        * `type` (string, required): A unique type identifier for your widget (e.g., `"MyCustomApiWidget"`). This is used in `dashboard.yml`.
        * `name` (string, required): A user-friendly name displayed in the "Add Widget" modal (e.g., "My Custom API Display").
        * `description` (string, optional): A brief description of what your widget does.
        * `icon` (string, optional): A Material Icons name (e.g., `"star"`, `"api"`) to be displayed in the widget list.
        * `defaultLayout` (object, required): Default dimensions and constraints for `vue-grid-layout` when the widget is first added.
            * Example: `{ "w": 4, "h": 3, "minW": 2, "minH": 2, "maxW": 8, "maxH": 6 }`
        * `optionsSchema` (array, optional): An array of objects defining the configurable options for your widget. This schema is used by `WidgetConfigModal.vue` to automatically generate a configuration form. Each object in the array defines a field:
            * `name` (string): The key for the option (e.g., `apiUrl`, `refreshRate`).
            * `label` (string): User-friendly label for the form field.
            * `type` (string): Input type (e.g., `text`, `url`, `password`, `number`, `checkbox`, `select`, `textarea`, `object_string`).
            * `default`: Default value for the option.
            * `required` (boolean, optional): If the field is mandatory.
            * `placeholder` (string, optional): Placeholder text for input fields.
            * `description` (string, optional): Help text displayed below the field.
            * `options` (array, for `type: 'select'`): `[{value: 'val1', label: 'Label 1'}, ...]`.
            * `min`, `max`, `step` (for `type: 'number'`).

## 📂 File Placement & Loading (Planned)

The intended mechanism for adding custom widgets is dynamic loading of Vue SFCs from a user-mappable directory.

* **Location**: Users will place their custom widgets inside the `/app_data/custom_widgets/` directory (this host directory is mounted into the container, e.g., to `/app/custom_widgets_mount`).
* **Structure per Widget**: Each custom widget should reside in its own subdirectory.
    ```
    app_data/
    └── custom_widgets/
        ├── my_first_widget/
        │   ├── MyFirstWidget.vue  # Your Vue SFC
        │   └── manifest.json        # Describes your widget
        │   └── icon.svg             # Optional: custom icon if not using Material Icons
        └── my_second_widget/
            ├── MySecondWidget.vue
            └── manifest.json
    ```
* **Discovery & Loading**:
    1.  Mission Control's backend might provide an API endpoint (e.g., `/api/custom-widgets/list`) that scans the designated directory for `manifest.json` files and returns a list of available custom widgets.
    2.  The frontend (`DashboardView.vue` or `WidgetConfigModal.vue`) would fetch this list.
    3.  When a custom widget needs to be rendered, `WidgetWrapper.vue` would use Vue's `defineAsyncComponent` with a dynamic `import()` statement. The path for this dynamic import would need to be resolvable. This is the most complex part:
        * **Option A (Backend Serves Components):** The backend might need to serve the `.vue` files from the custom widgets directory under a specific path (e.g., `/custom-widget-assets/my_first_widget/MyFirstWidget.vue`). The frontend would then `import('/custom-widget-assets/my_first_widget/MyFirstWidget.vue')`. This requires backend routes and careful security considerations (serving arbitrary user files).
        * **Option B (Build-Time Integration - Less "Dynamic"):** If true dynamic loading of SFCs at runtime is too complex/insecure, a fallback might involve users placing widgets in a specific source folder and rebuilding the main Mission Control Docker image. This is less user-friendly for non-developers.
        * **Option C (Plugin System with Pre-compiled JS):** Users provide pre-compiled JavaScript bundles for their widgets (e.g., as UMD modules) that register themselves with a global Mission Control plugin API. This is more robust but requires users to have a build process for their widgets.

    **For the purpose of this initial documentation, we'll assume a mechanism similar to Option A or a future Vue feature that simplifies runtime SFC loading is envisioned.**

## 🎨 Frontend Development (Your Custom Widget SFC)

Your custom widget will be a Vue 3 Single File Component, likely using `<script setup>`.

### Props Received:

Your component will automatically receive these props from `WidgetWrapper.vue`:

* **`widgetId: String`**: The unique ID of this widget instance (e.g., `"my_first_widget_123"`).
* **`options: Object`**: An object containing the user-configured options for this instance of your widget, based on the `optionsSchema` you defined in your `manifest.json`.

### Emitting Standard Events:

To integrate smoothly with `WidgetWrapper`'s loading and error display:

* **`emit('widget-loading', true/false)`**: Inform the wrapper when your widget starts fetching data or is in a loading state, and `false` when done.
* **`emit('widget-error', 'Error message' | { message: '...', details: '...' })`**: Inform the wrapper if an error occurs.
* **`emit('widget-data-updated')`**: Inform the wrapper that your widget has successfully loaded/updated its data and is ready to display (this can help the wrapper clear any previous error/loading states).

### Accessing Mission Control Services (Planned):

Mission Control will provide access to shared services like `apiClient` and `mqttClientService` via Vue's `inject` mechanism (as set up in `main.js` and `App.vue`).

```javascript
// Inside your custom widget's <script setup>
import { inject, onMounted, onUnmounted, ref, computed, watch, defineProps, defineEmits, defineExpose } from 'vue';

const props = defineProps({ /* ... */ });
const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

// Inject shared services
const apiClient = inject('apiClient');
const mqttClient = inject('mqttClient');
const mqttConnected = inject('mqttConnected'); // Reactive ref for MQTT connection status
const currentThemeRef = inject('currentTheme'); // Reactive ref for current theme ('light', 'dark', 'auto')

// ... your widget's logic ...
Exposing a fetchData Method (Recommended for Polling Widgets):If your widget polls for data, expose a fetchData method. WidgetWrapper.vue can then call this for its manual "Refresh" button.// Inside your custom widget's <script setup>
// ...
const fetchData = async () => {
  emit('widget-loading', true);
  try {
    // ... your data fetching logic ...
    // Example: If your widget needs to call a specific URL defined in its options:
    // const data = await apiClient.getWidgetData(props.widgetId, { 
    //   _proxyUrl: props.options.targetApiUrl, // Special param for a generic proxy endpoint
    //   _proxyHeaders: props.options.headers // If headers are needed
    // });
    emit('widget-data-updated');
  } catch (err) {
    emit('widget-error', err.message || 'Failed to fetch widget data');
  } finally {
    emit('widget-loading', false);
  }
};
defineExpose({ fetchData }); // Expose it
// ...
Note on getWidgetData for Custom Widgets:For truly custom widgets fetching from arbitrary user-defined URLs, the backend widgetProxyService would need a generic capability. Instead of a switch case for every widget type, it might have a default case that takes a targetUrl (and optionally headers, method, body) from clientQuery (passed by apiClient.getWidgetData) or from the widget's saved options. The widget would pass these to getWidgetData. This requires careful security considerations on the backend proxy (e.g., allow/deny lists for target domains).Example manifest.json for a "Simple Text Panel" Widget:{
  "type": "SimpleTextPanelWidget",
  "name": "Simple Text Panel",
  "description": "Displays configurable static text or simple HTML.",
  "icon": "notes",
  "defaultLayout": { "w": 4, "h": 2, "minW": 2, "minH": 1 },
  "optionsSchema": [
    {
      "name": "customLabel",
      "label": "Widget Title",
      "type": "text",
      "default": "Text Panel"
    },
    {
      "name": "content",
      "label": "Content (Markdown/HTML)",
      "type": "textarea",
      "default": "Hello, **world**!",
      "description": "Enter text content. Basic Markdown or HTML can be used."
    },
    {
      "name": "allowHtml",
      "label": "Allow HTML Rendering",
      "type": "checkbox",
      "default": false,
      "description": "WARNING: Enabling this can be a security risk if untrusted content is used."
    }
  ]
}
Example SimpleTextPanelWidget.vue (Conceptual):<template>
  <div class="simple-text-panel p-3 h-full overflow-y-auto custom-scrollbar">
    <div v-if="options.allowHtml" v-html="renderedContent" class="prose dark:prose-invert max-w-none"></div>
    <div v-else class="whitespace-pre-wrap break-words">{{ renderedContent }}</div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, onMounted } from 'vue';
// For Markdown rendering, you might import a library like 'marked'
// import { marked } from 'marked'; // Example

const props = defineProps({
  widgetId: { type: String, required: true },
  options: { type: Object, default: () => ({ content: '', allowHtml: false }) },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const renderedContent = computed(() => {
  const rawContent = props.options.content || '';
  if (props.options.allowHtml) {
    // If you wanted Markdown support, you'd parse it here:
    // return marked.parse(rawContent);
    return rawContent; // Directly rendering HTML (use with caution)
  }
  return rawContent; // Render as plain text
});

onMounted(() => {
  emit('widget-loading', false); // No async loading
  emit('widget-data-updated');
});

// No fetchData needed for this static widget
</script>

<style scoped>
.simple-text-panel pre { /* Example if content has preformatted text */
  white-space: pre-wrap;
  word-break: break-all;
}
/* If using Tailwind Typography plugin for v-html content */
.prose :where(code):not(:where([class~="not-prose"] *))::before { content: ""; }
.prose :where(code):not(:where([class~="not-prose"] *))::after { content: ""; }
</style>
This documentation provides the intended framework for custom widget development. As this feature is built into Mission Control, the exact APIs for dynamic component loading, manifest validation, and secure service access will be finalized and
