<template>
  <div v-if="isOpen"
       class="fixed inset-0 bg-gray-800 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex items-center justify-center z-[100] p-4 transition-opacity duration-300"
       @click.self="closeModal"
       role="dialog"
       aria-modal="true"
       :aria-labelledby="modalTitleId">
    <div class="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 :id="modalTitleId" class="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
          {{ isEditing ? 'Configure Widget' : 'Add New Widget' }}
          <span v-if="isEditing && currentWidgetTypeDetails" class="text-base font-normal text-indigo-600 dark:text-indigo-400">- {{ currentWidgetTypeDetails.name }}</span>
        </h3>
        <button @click="closeModal"
                class="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Close modal">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="flex-grow overflow-y-auto py-4 space-y-4 custom-scrollbar">
        <div v-if="!isEditing" class="form-group">
          <label for="widget-type-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Widget Type:</label>
          <select id="widget-type-select" v-model="selectedWidgetType" @change="onWidgetTypeChange"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500">
            <option disabled value="">-- Please select a type --</option>
            <option v-for="widget in availableWidgetTypes" :key="widget.type" :value="widget.type">
              <span v-if="widget.icon" class="material-icons align-middle text-sm mr-1">{{ widget.icon }}</span>
              {{ widget.name }}
              <span v-if="widget.description" class="text-xs text-gray-500 dark:text-gray-400"> - {{ widget.description }}</span>
            </option>
          </select>
        </div>

        <div v-if="currentSchema.length > 0" class="options-form space-y-3">
          <div v-for="field in currentSchema" :key="field.name" class="form-group">
            <label :for="`widget-option-${field.name}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
              {{ field.label || field.name.replace(/_/g, ' ') }}
              <span v-if="field.required" class="text-red-500">*</span>
            </label>
            
            <input v-if="['text', 'url', 'password', 'email'].includes(field.type)"
                   :type="field.type === 'password' ? 'password' : (field.type === 'url' ? 'url' : (field.type === 'email' ? 'email' : 'text'))"
                   :id="`widget-option-${field.name}`"
                   v-model.trim="formData[field.name]"
                   :placeholder="field.placeholder || ''"
                   :required="field.required"
                   class="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500">
            
            <input v-else-if="field.type === 'number'"
                   type="number"
                   :id="`widget-option-${field.name}`"
                   v-model.number="formData[field.name]"
                   :placeholder="field.placeholder || ''"
                   :required="field.required"
                   :min="field.min" :max="field.max" :step="field.step || 1"
                   class="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500">

            <textarea v-else-if="field.type === 'textarea' || field.type === 'object_string'"
                      :id="`widget-option-${field.name}`"
                      v-model="formData[field.name]"
                      :placeholder="field.placeholder || (field.type === 'object_string' ? 'Enter valid JSON or parsable object string, e.g., {\"key\":\"value\"}' : '')"
                      :required="field.required"
                      rows="3"
                      class="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"></textarea>
            
            <div v-else-if="field.type === 'checkbox'" class="mt-1 flex items-center">
              <input :id="`widget-option-${field.name}`"
                     type="checkbox"
                     v-model="formData[field.name]"
                     class="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500">
              <label :for="`widget-option-${field.name}`" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ field.checkboxLabel || (field.label ? `Enable ${field.label.toLowerCase()}` : 'Enable') }}
              </label>
            </div>

            <select v-else-if="field.type === 'select' && field.options"
                    :id="`widget-option-${field.name}`"
                    v-model="formData[field.name]"
                    :required="field.required"
                    class="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500">
              <option v-if="!field.required && field.allowEmpty !== false" value="">-- Optional --</option>
              <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            
            <p v-if="field.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ field.description }}</p>
          </div>
        </div>
        <div v-else-if="selectedWidgetType && !isEditing" class="text-gray-500 dark:text-gray-400">
          This widget type has no specific options to configure.
        </div>
        <div v-else-if="!selectedWidgetType && !isEditing" class="text-gray-500 dark:text-gray-400">
          Select a widget type above to see its configuration options.
        </div>
      </div>

      <div class="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button @click="closeModal"
                type="button"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          Cancel
        </button>
        <button @click="handleSave"
                type="button"
                :disabled="!canSave"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ isEditing ? 'Save Changes' : 'Add Widget' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  widgetToEdit: { type: Object, default: null }, // Contains { id, type, options }
  availableWidgetTypes: { type: Array, required: true }, // Array of { type, name, description, optionsSchema, defaultLayout }
});

const emit = defineEmits(['close', 'save-widget']);

const modalTitleId = `widget-config-modal-title-${Date.now()}`;
const isEditing = computed(() => !!props.widgetToEdit);
const selectedWidgetType = ref(''); // Stores the 'type' string, e.g., "GlancesWidget"
const currentWidgetTypeDetails = ref(null); // Stores the full object { type, name, optionsSchema, defaultLayout }
const currentSchema = ref([]); // Array of field objects for the form
const formData = ref({}); // Holds the values for the form fields

const canSave = computed(() => {
  if (isEditing.value) return true; // Can always try to save edits
  return !!selectedWidgetType.value; // For new widgets, a type must be selected
});

const getDefaultValueForField = (field) => {
    if (field.default !== undefined) {
        return field.default;
    }
    switch (field.type) {
        case 'checkbox': return false;
        case 'number': return field.min !== undefined ? field.min : 0;
        case 'object_string': return '{}'; // Default to empty JSON object string
        case 'select': return field.options && field.options.length > 0 ? field.options[0].value : '';
        default: return '';
    }
};


const resetFormAndPopulate = () => {
  selectedWidgetType.value = '';
  currentWidgetTypeDetails.value = null;
  currentSchema.value = [];
  formData.value = {};

  if (props.widgetToEdit) {
    // Editing existing widget
    const widgetDetails = props.availableWidgetTypes.find(w => w.type === props.widgetToEdit.type);
    if (widgetDetails) {
      selectedWidgetType.value = widgetDetails.type; // Set selected type for consistency
      currentWidgetTypeDetails.value = widgetDetails;
      currentSchema.value = widgetDetails.optionsSchema || [];
      
      const initialData = {};
      (widgetDetails.optionsSchema || []).forEach(field => {
        let value = props.widgetToEdit.options?.[field.name];
        if (value === undefined) {
          value = getDefaultValueForField(field);
        }
        // Special handling for object_string: ensure it's a string for the textarea
        if (field.type === 'object_string' && typeof value === 'object' && value !== null) {
          try {
            initialData[field.name] = JSON.stringify(value, null, 2);
          } catch (e) {
            console.warn(`Could not stringify object for field ${field.name}:`, value, e);
            initialData[field.name] = '{}'; // Fallback to empty JSON string
          }
        } else if (field.type === 'object_string' && typeof value !== 'string') {
            initialData[field.name] = '{}'; // Ensure it's a string if not already
        } else {
          initialData[field.name] = value;
        }
      });
      formData.value = initialData;
    } else {
      console.error(`Cannot find widget type details for editing: ${props.widgetToEdit.type}`);
      emit('close'); // Close modal if type is invalid
    }
  }
  // When adding new, form populates on onWidgetTypeChange
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetFormAndPopulate();
    nextTick(() => { // Ensure DOM is updated before trying to focus
        const firstFocusableElement = document.querySelector(
            `#${modalTitleId}` // For accessibility, focus modal itself first
        ) || document.querySelector(
            '#widget-type-select, .options-form input, .options-form textarea, .options-form select'
        );
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }
    });
  }
});

const onWidgetTypeChange = () => {
  const widgetDetails = props.availableWidgetTypes.find(w => w.type === selectedWidgetType.value);
  if (widgetDetails) {
    currentWidgetTypeDetails.value = widgetDetails;
    currentSchema.value = widgetDetails.optionsSchema || [];
    const initialData = {};
    (widgetDetails.optionsSchema || []).forEach(field => {
      initialData[field.name] = getDefaultValueForField(field);
    });
    formData.value = initialData;
  } else {
    currentWidgetTypeDetails.value = null;
    currentSchema.value = [];
    formData.value = {};
  }
};

const closeModal = () => {
  emit('close');
};

const handleSave = () => {
  if (!canSave.value) return;

  const processedOptions = {};
  let validationError = false;
  let firstErrorField = null;

  currentSchema.value.forEach(field => {
    if (validationError) return; // Stop processing if an error already occurred

    let value = formData.value[field.name];

    if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
      alert(`Field "${field.label || field.name.replace(/_/g, ' ')}" is required.`);
      validationError = true;
      if (!firstErrorField) firstErrorField = field.name;
      return;
    }

    // Type-specific processing/validation
    if (field.type === 'number' && (value !== undefined && value !== null && String(value).trim() !== '')) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        alert(`Field "${field.label || field.name}" must be a valid number.`);
        validationError = true;
        if (!firstErrorField) firstErrorField = field.name;
        return;
      }
      // Check min/max constraints
      if (field.min !== undefined && numValue < field.min) {
        alert(`Field "${field.label || field.name}" must be at least ${field.min}.`);
        validationError = true;
        if (!firstErrorField) firstErrorField = field.name;
        return;
      }
      if (field.max !== undefined && numValue > field.max) {
        alert(`Field "${field.label || field.name}" must be no more than ${field.max}.`);
        validationError = true;
        if (!firstErrorField) firstErrorField = field.name;
        return;
      }
      value = numValue;
    }

    if (field.type === 'object_string' && (value !== undefined && String(value).trim() !== '')) {
        try {
            value = JSON.parse(String(value));
        } catch (e) {
            alert(`Field "${field.label || field.name}" must be valid JSON. Error: ${e.message}`);
            validationError = true;
            if (!firstErrorField) firstErrorField = field.name;
            return;
        }
    }
    
    if (field.type === 'checkbox') {
        value = !!value; // Ensure boolean
    }

    // Only add to processedOptions if value is not empty or it's a boolean (checkbox)
    // or if it's a number 0 (which is not empty but valid)
    if (String(value).trim() !== '' || typeof value === 'boolean' || (typeof value === 'number' && !isNaN(value)) || (typeof value === 'object' && value !== null) ) {
        processedOptions[field.name] = value;
    } else if (field.default === undefined && !field.required) {
        // If field is not required and has no default, and is empty, don't include it in options
        // This keeps the YAML cleaner.
    } else if (field.default !== undefined) {
        processedOptions[field.name] = getDefaultValueForField(field); // Ensure default is set if empty but has default
    }
  });

  if (validationError) {
    nextTick(() => {
        const errorInput = document.getElementById(`widget-option-${firstErrorField}`);
        if (errorInput) errorInput.focus();
    });
    return;
  }

  const widgetData = {
    id: props.widgetToEdit ? props.widgetToEdit.id : `${selectedWidgetType.value.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    type: selectedWidgetType.value, // This is set correctly when adding or editing
    options: processedOptions,
  };
  emit('save-widget', widgetData);
  // closeModal(); // Parent (DashboardView) will close it after handling save
};

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-700 rounded-full;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-gray-400 dark:bg-gray-500 rounded-full;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500 dark:bg-gray-400;
}
.form-group { /* Add some bottom margin to form groups for better spacing */
  margin-bottom: 0.75rem; /* Equivalent to space-y-3 on parent, but per group */
}
</style>
