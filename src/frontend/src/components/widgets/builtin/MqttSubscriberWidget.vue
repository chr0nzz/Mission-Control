<template>
  <div class="mqtt-subscriber-widget p-2 h-full text-xs sm:text-sm flex flex-col justify-center items-center text-center">
    <div v-if="!effectiveOptions.topic" class="text-yellow-600 dark:text-yellow-400">
      MQTT Topic not configured.
    </div>
    <div v-else-if="!mqttConnected" class="text-orange-500 dark:text-orange-400">
      MQTT client not connected. Check settings.
    </div>
    <div v-else-if="internalError" class="text-red-500 dark:text-red-400">
      Error: {{ internalError }}
    </div>
    <div v-else class="w-full">
      <div v-if="lastMessage !== null" class="message-display break-all">
        <pre v-if="isJsonPayload && effectiveOptions.pretty_print_json" class="text-left bg-gray-100 dark:bg-gray-700 p-1.5 rounded text-xs whitespace-pre-wrap">{{ formattedJsonMessage }}</pre>
        <span v-else class="text-gray-800 dark:text-gray-100 text-base sm:text-lg md:text-xl font-medium">
          {{ effectiveOptions.prefix || '' }}{{ displayMessage }}{{ effectiveOptions.suffix || '' }}
        </span>
      </div>
      <div v-else class="text-gray-400 dark:text-gray-500 italic">
        Waiting for message on "{{ effectiveOptions.topic }}"...
      </div>
      <div v-if="lastUpdated" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Last update: {{ formatRelativeTime(lastUpdated) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, inject, computed } from 'vue';
import get from 'lodash/get'; // For safe deep access with json_path

const props = defineProps({
  widgetId: { type: String, required: true },
  options: {
    type: Object,
    default: () => ({
      topic: '', // MQTT topic to subscribe to
      json_path: '', // Optional: dot-notation path to extract from JSON payload
      label: 'MQTT Message', // Used by WidgetWrapper for title
      prefix: '',
      suffix: '',
      qos: 0,
      payload_is_json: false, // Hint if payload is JSON, for pretty printing
      pretty_print_json: false, // If true and payload_is_json, pretty print full JSON
    }),
  },
});

const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

const mqtt = inject('mqttClient'); // Injected from App.vue
const appConfig = inject('appConfig'); // To check global MQTT connection status

const lastMessage = ref(null);
const lastUpdated = ref(null);
const internalError = ref(null);
let subscriptionId = null;

const mqttConnected = computed(() => mqtt?.client?.connected || false); // Check actual client connection

const effectiveOptions = computed(() => ({
  topic: props.options.topic || '',
  json_path: props.options.json_path || '',
  prefix: props.options.prefix || '',
  suffix: props.options.suffix || '',
  qos: parseInt(props.options.qos, 10) || 0,
  payload_is_json: props.options.payload_is_json === true,
  pretty_print_json: props.options.pretty_print_json === true,
}));

const isJsonPayload = computed(() => {
  if (effectiveOptions.value.payload_is_json) return true;
  if (lastMessage.value) {
    try {
      JSON.parse(lastMessage.value.toString()); // Check if it's valid JSON
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
});

const displayMessage = computed(() => {
  if (lastMessage.value === null) return 'N/A';
  let messageContent = lastMessage.value.toString(); // MQTT.js message is often a Buffer

  if (effectiveOptions.value.json_path && isJsonPayload.value) {
    try {
      const parsedJson = JSON.parse(messageContent);
      const extractedValue = get(parsedJson, effectiveOptions.value.json_path, 'N/A (path not found)');
      return typeof extractedValue === 'object' ? JSON.stringify(extractedValue) : extractedValue;
    } catch (e) {
      console.warn(`MQTTWidget (${props.widgetId}): Failed to parse JSON or extract path:`, e);
      return messageContent; // Show raw if path extraction fails
    }
  }
  return messageContent;
});

const formattedJsonMessage = computed(() => {
    if (lastMessage.value && isJsonPayload.value && effectiveOptions.value.pretty_print_json) {
        try {
            return JSON.stringify(JSON.parse(lastMessage.value.toString()), null, 2);
        } catch (e) {
            return lastMessage.value.toString(); // Fallback
        }
    }
    return '';
});


const handleMessage = (topic, message) => {
  // This check is redundant if mqttClient.subscribe handles specific callbacks per subscription ID,
  // but good for safety if it's a shared topic handler.
  if (topic === effectiveOptions.value.topic) {
    lastMessage.value = message; // message is already a string from mqttService wrapper
    lastUpdated.value = new Date();
    internalError.value = null;
    emit('widget-data-updated');
  }
};

const subscribeToTopic = () => {
  unsubscribeFromTopic(); // Unsubscribe from old topic first if any
  if (mqttConnected.value && effectiveOptions.value.topic && mqtt && typeof mqtt.subscribe === 'function') {
    try {
      subscriptionId = mqtt.subscribe(effectiveOptions.value.topic, handleMessage, { qos: effectiveOptions.value.qos });
      if (subscriptionId) {
        console.log(`MQTTWidget (${props.widgetId}): Subscribed to ${effectiveOptions.value.topic} with ID ${subscriptionId}`);
        internalError.value = null;
      } else {
        internalError.value = `Failed to subscribe to ${effectiveOptions.value.topic}. MQTT client might not be ready or method failed.`;
        emit('widget-error', internalError.value);
      }
    } catch (e) {
      internalError.value = `Error subscribing to ${effectiveOptions.value.topic}: ${e.message}`;
      console.error(internalError.value);
      emit('widget-error', internalError.value);
    }
  } else if (effectiveOptions.value.topic && !mqttConnected.value) {
    internalError.value = 'MQTT client not connected. Cannot subscribe.';
    emit('widget-error', internalError.value);
  } else if (!effectiveOptions.value.topic) {
    internalError.value = 'MQTT topic not configured for subscription.';
    // emit('widget-error', internalError.value); // Don't treat as error if no topic
  }
};

const unsubscribeFromTopic = () => {
  if (subscriptionId && mqtt && typeof mqtt.unsubscribe === 'function') {
    try {
      mqtt.unsubscribe(subscriptionId);
      console.log(`MQTTWidget (${props.widgetId}): Unsubscribed from ID ${subscriptionId} (topic: ${effectiveOptions.value.topic || 'previous topic'})`);
    } catch (e) {
        console.error(`MQTTWidget (${props.widgetId}): Error unsubscribing: ${e.message}`);
    }
    subscriptionId = null;
  }
};

const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

onMounted(() => {
  emit('widget-loading', false); // This widget has no initial data fetch, relies on MQTT messages
  if (mqttConnected.value) {
    subscribeToTopic();
  } else {
    // Wait for MQTT connection from App.vue (if not already connected)
    const unwatch = watch(mqttConnected, (isConnected) => {
        if (isConnected) {
            subscribeToTopic();
            unwatch(); // Stop watching once connected
        }
    });
  }
});

onUnmounted(() => {
  unsubscribeFromTopic();
});

watch(() => effectiveOptions.value.topic, (newTopic, oldTopic) => {
  if (newTopic !== oldTopic) {
    lastMessage.value = null; // Clear message from old topic
    lastUpdated.value = null;
    subscribeToTopic(); // Resubscribe to the new topic
  }
});
watch(() => effectiveOptions.value.qos, () => { // Resubscribe if QoS changes
    subscribeToTopic();
});

// This widget is reactive to MQTT, no explicit fetchData to expose
</script>

<style scoped>
.message-display pre {
  max-height: 150px; /* Adjust as needed */
  overflow-y: auto;
  word-break: break-all;
}
</style>
