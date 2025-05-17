    <template>
      <div class="datetime-widget text-center p-2 h-full flex flex-col justify-center items-center">
        <div v-if="showDate" class="current-date text-xl sm:text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-200">
          {{ formattedDate }}
        </div>
        <div v-if="showTime" class="current-time text-3xl sm:text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2">
          {{ formattedTime }}
        </div>
      </div>
    </template>

    <script setup>
    import { ref, onMounted, onUnmounted, computed, watch, defineEmits } from 'vue';

    const props = defineProps({
      widgetId: { type: String, required: true },
      options: {
        type: Object,
        default: () => ({
          dateFormat: undefined,
          timeFormat: undefined,
          timezone: undefined,
          showDate: true,
          showTime: true,
        }),
      },
    });

    const emit = defineEmits(['widget-loading', 'widget-error', 'widget-data-updated']);

    const now = ref(new Date());
    let timerId = null;

    const effectiveOptions = computed(() => {
      return {
        dateFormat: props.options.dateFormat || { year: 'numeric', month: 'long', day: 'numeric' },
        timeFormat: props.options.timeFormat || { hour: 'numeric', minute: '2-digit', second: '2-digit' },
        timezone: props.options.timezone,
        showDate: props.options.showDate !== undefined ? props.options.showDate : true,
        showTime: props.options.showTime !== undefined ? props.options.showTime : true,
      };
    });

    const formattedDate = computed(() => {
      try {
        let options = effectiveOptions.value.dateFormat;
        if (typeof options === 'string') { // Attempt to parse if it's a JSON string from config
            try { options = JSON.parse(options); } catch (e) {
                console.warn(`DateTimeWidget (${props.widgetId}): Invalid JSON string for dateFormat, using default. Error: ${e.message}`);
                options = { year: 'numeric', month: 'long', day: 'numeric' };
            }
        }
        return new Intl.DateTimeFormat(undefined, { ...options, timeZone: effectiveOptions.value.timezone }).format(now.value);
      } catch (e) {
        console.error(`DateTimeWidget (${props.widgetId}): Error formatting date:`, e);
        emit('widget-error', 'Invalid date format options.');
        return 'Invalid Date Format';
      }
    });

    const formattedTime = computed(() => {
      try {
        let options = effectiveOptions.value.timeFormat;
        if (typeof options === 'string') { // Attempt to parse if it's a JSON string from config
             try { options = JSON.parse(options); } catch (e) {
                console.warn(`DateTimeWidget (${props.widgetId}): Invalid JSON string for timeFormat, using default. Error: ${e.message}`);
                options = { hour: 'numeric', minute: '2-digit', second: '2-digit' };
            }
        }
        return new Intl.DateTimeFormat(undefined, { ...options, timeZone: effectiveOptions.value.timezone }).format(now.value);
      } catch (e) {
        console.error(`DateTimeWidget (${props.widgetId}): Error formatting time:`, e);
        emit('widget-error', 'Invalid time format options.');
        return 'Invalid Time Format';
      }
    });

    const showDate = computed(() => effectiveOptions.value.showDate);
    const showTime = computed(() => effectiveOptions.value.showTime);

    const updateTime = () => {
      now.value = new Date();
    };

    onMounted(() => {
      emit('widget-loading', true);
      updateTime();
      timerId = setInterval(updateTime, 1000);
      emit('widget-loading', false);
      emit('widget-data-updated');
    });

    onUnmounted(() => {
      if (timerId) {
        clearInterval(timerId);
      }
    });

    watch(() => props.options, () => {
        emit('widget-data-updated');
    }, { deep: true });

    </script>

    <style scoped>
    .datetime-widget {
      line-height: 1.2;
    }
    </style>
    
