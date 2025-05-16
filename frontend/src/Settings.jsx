import React, { useState, useEffect, useCallback } from 'react';
import { useStateContext } from './StateContext'; // Uncomment if needed
import { useTheme } from './ThemeManager'; // Uncomment if needed

function Settings() {
  const { appSettings, updateAppSettings } = useStateContext(); // Example usage
  const { theme, updateTheme, availableDarkVariants, availableAccentColors } = useTheme(); // Example usage

  // State to hold service configurations fetched from backend
  const [serviceConfigs, setServiceConfigs] = useState([]);
  // State to manage the form for adding/editing a service
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null); // null for add, object for edit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for custom widget management
  const [customWidgets, setCustomWidgets] = useState([]);
  const [isAddingCustomWidget, setIsAddingCustomWidget] = useState(false);
  const [customWidgetSource, setCustomWidgetSource] = useState(''); // URL or file path
  const [customWidgetSourceType, setCustomWidgetSourceType] = useState('url'); // 'url' or 'file'

  // Function to fetch service configurations from backend
  const fetchServiceConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming backend endpoint is /api/settings and supports filtering by service_type or similar
      // For now, fetching all settings and filtering client-side or assuming all are service configs
      const response = await fetch('/api/settings'); // Adjust endpoint if needed
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Filter for settings that represent service configurations if necessary
      // For now, assuming all fetched settings are service configs based on the placeholder structure
      setServiceConfigs(data);
    } catch (e) {
      console.error('Error fetching service configs:', e);
      setError('Failed to fetch service configurations.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch custom widgets from backend
  const fetchCustomWidgets = useCallback(async () => {
     // TODO: Implement backend endpoint for fetching custom widgets
     console.log('Fetching custom widgets...');
     // Placeholder data for now
     setCustomWidgets([
        { id: 1, name: 'example-widget', displayName: 'Example Widget', version: '1.0.0' },
        { id: 2, name: 'another-widget', displayName: 'Another Widget', version: '0.5.0' },
     ]);
  }, []);


  // Fetch data on component mount
  useEffect(() => {
    fetchServiceConfigs();
    fetchCustomWidgets();
  }, [fetchServiceConfigs, fetchCustomWidgets]);


  // Handler for theme changes
  const handleThemeChange = (newTheme) => {
    updateTheme({ ...theme, mode: newTheme });
    // TODO: Add logic to save theme preference to backend (User preferences in SQLite)
  };

  // Handler for dark variant changes
  const handleDarkVariantChange = (newVariant) => {
     updateTheme({ ...theme, darkVariant: newVariant });
     // TODO: Add logic to save dark variant preference to backend (User preferences in SQLite)
  };

  // Handler for accent color changes
  const handleAccentColorChange = (newColor) => {
     updateTheme({ ...theme, accentColor: newColor });
     // TODO: Add logic to save accent color preference to backend (User preferences in SQLite)
  };

  // Handler for adding a new service
  const handleAddService = () => {
    setCurrentService(null); // Clear form for new service
    setIsServiceFormOpen(true);
  };

  // Handler for editing a service
  const handleEditService = (service) => {
    setCurrentService(service); // Load service data into form
    setIsServiceFormOpen(true);
  };

  // Handler for deleting a service
  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service configuration?')) {
      try {
        const response = await fetch(`/api/settings/${serviceId}`, { // Assuming ID is used for deletion
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Remove the deleted service from the state
        setServiceConfigs(serviceConfigs.filter(service => service.id !== serviceId));
        console.log('Service configuration deleted successfully.');
      } catch (e) {
        console.error('Error deleting service config:', e);
        setError('Failed to delete service configuration.');
      }
    }
  };

  // Handler for saving the service form
  const handleSaveServiceForm = async (formData) => {
    // Basic validation
    if (!formData.service_type || !formData.service_instance_id || !formData.setting_key || !formData.setting_value) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const method = formData.id ? 'PUT' : 'POST'; // Use PUT for existing, POST for new
      const url = formData.id ? `/api/settings/${formData.id}` : '/api/settings'; // Adjust URL based on method

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedService = await response.json(); // Assuming backend returns the saved/updated object

      // Update state based on whether it was a new service or an update
      if (formData.id) {
        setServiceConfigs(serviceConfigs.map(service =>
          service.id === savedService.id ? savedService : service
        ));
      } else {
        setServiceConfigs([...serviceConfigs, savedService]);
      }

      console.log('Service configuration saved successfully:', savedService);
      setIsServiceFormOpen(false);
      setCurrentService(null);
      // Refetch data to ensure state is fully synchronized with backend, especially for new items getting IDs
      fetchServiceConfigs();

    } catch (e) {
      console.error('Error saving service config:', e);
      setError('Failed to save service configuration.');
    }
  };

  // Handler for cancelling the service form
  const handleCancelServiceForm = () => {
    setIsServiceFormOpen(false);
    setCurrentService(null);
  };

  // Handler for adding a custom widget
  const handleAddCustomWidget = async () => {
     // TODO: Implement backend call to add custom widget (from URL or file)
     console.log('Adding custom widget from:', customWidgetSource, 'type:', customWidgetSourceType);
     // After successful backend call, refetch custom widgets
     // fetchCustomWidgets();
     setIsAddingCustomWidget(false);
     setCustomWidgetSource('');
  };

  // Handler for deleting a custom widget
  const handleDeleteCustomWidget = async (widgetId) => {
     if (window.confirm('Are you sure you want to delete this custom widget?')) {
        // TODO: Implement backend call to delete custom widget
        console.log('Deleting custom widget:', widgetId);
        // After successful backend call, refetch custom widgets
        // fetchCustomWidgets();
        setCustomWidgets(customWidgets.filter(widget => widget.id !== widgetId)); // Optimistic update
     }
  };

  // Handler for triggering backup
  const handleCreateBackup = async () => {
     // TODO: Implement backend call to trigger backup
     console.log('Triggering backup...');
     // Show success/error message
  };

  // Handler for restoring from backup
  const handleRestoreBackup = async (event) => {
     // TODO: Implement backend call to handle backup file upload and restore
     console.log('Restoring from backup...');
     const file = event.target.files[0];
     if (file) {
        console.log('Uploaded file:', file.name);
        // Use FormData to send the file to the backend
        // const formData = new FormData();
        // formData.append('backupFile', file);
        // try {
        //    const response = await fetch('/api/backup/restore', { method: 'POST', body: formData });
        //    // Handle response
        // } catch (e) {
        //    console.error('Error restoring backup:', e);
        // }
     }
     // Show success/error message
  };


  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      {/* Global Settings Section */}
      <section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Global Settings</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Configure application-wide settings like default theme, NTfy server, etc.</p>

        {/* Theme Mode (Light/Dark/Auto) */}
        <div className="mb-4">
          <label htmlFor="theme_mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme Mode</label>
          <select
            id="theme_mode"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={theme.mode}
            onChange={(e) => handleThemeChange(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (OS Preference)</option>
          </select>
        </div>

        {/* Dark Mode Variant (if theme.mode is 'dark') */}
        {theme.mode === 'dark' && (
           <div className="mb-4">
             <label htmlFor="dark_variant" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode Background</label>
             <select
               id="dark_variant"
               className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
               value={theme.darkVariant}
               onChange={(e) => handleDarkVariantChange(e.target.value)}
             >
               {availableDarkVariants.map(variant => (
                  &lt;option key={variant.value} value={variant.value}&gt;{variant.label}&lt;/option&gt;
               ))}
             &lt;/select&gt;
           &lt;/div&gt;
        )}


        {/* Accent Color Picker */}
         &lt;div className="mb-4"&gt;
           &lt;label className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;Accent Color&lt;/label&gt;
           &lt;div className="mt-1 grid grid-cols-5 gap-2"&gt;
             {availableAccentColors.map(color => (
                &lt;button
                  key={color.value}
                  className={`h-8 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.accentColor === color.value ? 'ring-blue-500 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleAccentColorChange(color.value)}
                  aria-label={`Select ${color.label} accent color`}
                &gt;&lt;/button&gt;
             ))}
           &lt;/div&gt;
         &lt;/div&gt;

         {/* TODO: Add NTfy Server Configuration */}
         &lt;div className="mb-4"&gt;
            &lt;h4 className="text-lg font-medium text-gray-900 dark:text-white"&gt;NTfy Server Configuration&lt;/h4&gt;
            &lt;p className="text-gray-600 dark:text-gray-400 text-sm"&gt;Configure your self-hosted NTfy server details.&lt;/p&gt;
            {/* TODO: Add form fields for NTfy URL, credentials */}
         &lt;/div&gt;


      &lt;/section&gt;

      {/* Service Configuration Section */}
      &lt;section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"&gt;
        &lt;h3 className="text-xl font-semibold mb-3"&gt;Service Configuration&lt;/h3&gt;
        &lt;p className="text-gray-600 dark:text-gray-400 mb-4"&gt;Manage API keys and URLs for integrated services. (e.g., Sonarr, Radarr, Home Assistant)&lt;/p&gt;

        {/* Button to Add New Service */}
        &lt;button
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={handleAddService}
        &gt;
          Add New Service
        &lt;/button&gt;

        {/* List of Configured Services */}
        &lt;div&gt;
          &lt;h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2"&gt;Configured Services&lt;/h4&gt;
          {loading ? (
            &lt;p className="text-gray-600 dark:text-gray-400"&gt;Loading service configurations...&lt;/p&gt;
          ) : error ? (
            &lt;p className="text-red-600 dark:text-red-400"&gt;Error: {error}&lt;/p&gt;
          ) : serviceConfigs.length === 0 ? (
            &lt;p className="text-gray-600 dark:text-gray-400"&gt;No services configured yet.&lt;/p&gt;
          ) : (
            &lt;ul className="divide-y divide-gray-200 dark:divide-gray-700"&gt;
              {/* Note: This list is simplified. In reality, serviceConfigs might be grouped by service_type */}
              {serviceConfigs.map(service => (
                &lt;li key={service.id} className="py-3 flex items-center justify-between"&gt;
                  &lt;div&gt;
                    &lt;div className="text-sm font-medium text-gray-900 dark:text-white"&gt;{service.service_type} - {service.service_instance_id}&lt;/div&gt;
                    &lt;div className="text-sm text-gray-500 dark:text-gray-400"&gt;{service.setting_key}: {service.setting_value ? '********' : 'No Value'}&lt;/div&gt; {/* Mask sensitive value */}
                  &lt;/div&gt;
                  &lt;div&gt;
                    &lt;button
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 mr-4"
                      onClick={() => handleEditService(service)}
                    &gt;
                      Edit
                    &lt;/button&gt;
                    &lt;button
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
                      onClick={() => handleDeleteService(service.id)}
                    &gt;
                      Delete
                    &lt;/button&gt;
                  &lt;/div&gt;
                &lt;/li&gt;
              ))}
            &lt;/ul&gt;
          )}
        &lt;/div&gt;

        {/* Service Configuration Form/Modal */}
        {isServiceFormOpen && (
           &lt;div className="mt-4 p-4 border border-blue-300 dark:border-blue-700 rounded-lg"&gt;
             &lt;h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4"&gt;{currentService ? 'Edit Service' : 'Add New Service'}&lt;/h4&gt;

             {/* Service Type */}
             &lt;div className="mb-4"&gt;
               &lt;label htmlFor="service_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;Service Type&lt;/label&gt;
               &lt;input
                 type="text"
                 id="service_type"
                 name="service_type"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 value={currentService?.service_type || ''}
                 onChange={(e) => setCurrentService({ ...currentService, service_type: e.target.value })}
               /&gt;
             &lt;/div&gt;

             {/* Service Instance ID */}
             &lt;div className="mb-4"&gt;
               &lt;label htmlFor="service_instance_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;Service Instance ID&lt;/label&gt;
               &lt;input
                 type="text"
                 id="service_instance_id"
                 name="service_instance_id"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 value={currentService?.service_instance_id || ''}
                 onChange={(e) => setCurrentService({ ...currentService, service_instance_id: e.target.value })}
               /&gt;
             &lt;/div&gt;

             {/* Setting Key */}
              &lt;div className="mb-4"&gt;
               &lt;label htmlFor="setting_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;Setting Key&lt;/label&gt;
               &lt;input
                 type="text"
                 id="setting_key"
                 name="setting_key"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 value={currentService?.setting_key || ''}
                 onChange={(e) => setCurrentService({ ...currentService, setting_key: e.target.value })}
               /&gt;
             &lt;/div&gt;

             {/* Setting Value */}
              &lt;div className="mb-4"&gt;
               &lt;label htmlFor="setting_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;Setting Value&lt;/label&gt;
               &lt;input
                 type="password" // Use 'password' type for sensitive values like API keys
                 id="setting_value"
                 name="setting_value"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 value={currentService?.setting_value || ''}
                 onChange={(e) => setCurrentService({ ...currentService, setting_value: e.target.value })}
               /&gt;
             &lt;/div&gt;


             &lt;div className="flex justify-end"&gt;
               &lt;button
                 className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                 onClick={handleCancelServiceForm}
               &gt;
                 Cancel
               &lt;/button&gt;
               &lt;button
                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-800"
                 onClick={() => handleSaveServiceForm(currentService)} // Pass currentService state
               &gt;
                 Save Service
               &lt;/button&gt;
             &lt;/div&gt;
           &lt;/div&gt;
        )}


      &lt;/section&gt;

      {/* Custom Widget Management Section */}
      &lt;section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"&gt;
        &lt;h3 className="text-xl font-semibold mb-3"&gt;Custom Widget Management&lt;/h3&gt;
        &lt;p className="text-gray-600 dark:text-gray-400 mb-4"&gt;Add or remove custom widgets from ZIP files or Git repositories.&lt;/p&gt;

        {/* Button to Add New Custom Widget */}
        {!isAddingCustomWidget && (
           &lt;button
             className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
             onClick={() => setIsAddingCustomWidget(true)}
           &gt;
             Add Custom Widget
           &lt;/button&gt;
        )}


        {/* Add Custom Widget Form */}
        {isAddingCustomWidget && (
           &lt;div className="mt-4 p-4 border border-blue-300 dark:border-blue-700 rounded-lg"&gt;
             &lt;h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4"&gt;Add Custom Widget&lt;/h4&gt;

             {/* Source Type Selection */}
             &lt;div className="mb-4"&gt;
               &lt;label className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;Source Type&lt;/label&gt;
               &lt;select
                 className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                 value={customWidgetSourceType}
                 onChange={(e) => setCustomWidgetSourceType(e.target.value)}
               &gt;
                 &lt;option value="url"&gt;Git Repository URL&lt;/option&gt;
                 &lt;option value="file"&gt;ZIP File Upload&lt;/option&gt;
               &lt;/select&gt;
             &lt;/div&gt;

             {/* Source Input (URL or File) */}
             &lt;div className="mb-4"&gt;
               &lt;label htmlFor="widget_source" className="block text-sm font-medium text-gray-700 dark:text-gray-300"&gt;{customWidgetSourceType === 'url' ? 'Git Repository URL' : 'ZIP File'}&lt;/label&gt;
               {customWidgetSourceType === 'url' ? (
                  &lt;input
                    type="text"
                    id="widget_source"
                    name="widget_source"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    value={customWidgetSource}
                    onChange={(e) => setCustomWidgetSource(e.target.value)}
                    placeholder="e.g., https://github.com/user/my-widget.git"
                  /&gt;
               ) : (
                  &lt;input
                    type="file"
                    id="widget_source"
                    name="widget_source"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"
                    onChange={(e) => setCustomWidgetSource(e.target.files[0])} // Store the File object
                  /&gt;
               )}
             &lt;/div&gt;

             &lt;div className="flex justify-end"&gt;
               &lt;button
                 className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                 onClick={() => { setIsAddingCustomWidget(false); setCustomWidgetSource(''); setCustomWidgetSourceType('url'); }}
               &gt;
                 Cancel
               &lt;/button&gt;
               &lt;button
                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-800"
                 onClick={handleAddCustomWidget}
               &gt;
                 Add Widget
               &lt;/button&gt;
             &lt;/div&gt;
           &lt;/div&gt;
        )}


        {/* List of Installed Custom Widgets */}
        &lt;div className="mt-4"&gt;
           &lt;h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2"&gt;Installed Custom Widgets&lt;/h4&gt;
           {customWidgets.length === 0 ? (
             &lt;p className="text-gray-600 dark:text-gray-400"&gt;No custom widgets installed yet.&lt;/p&gt;
           ) : (
             &lt;ul className="divide-y divide-gray-200 dark:divide-gray-700"&gt;
               {customWidgets.map(widget => (
                 &lt;li key={widget.id} className="py-3 flex items-center justify-between"&gt;
                   &lt;div&gt;
                     &lt;div className="text-sm font-medium text-gray-900 dark:text-white"&gt;{widget.displayName} ({widget.name})&lt;/div&gt;
                     &lt;div className="text-sm text-gray-500 dark:text-gray-400"&gt;Version: {widget.version}&lt;/div&gt;
                   &lt;/div&gt;
                   &lt;div&gt;
                     {/* TODO: Add Edit/View Details button if needed */}
                     &lt;button
                       className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600"
                       onClick={() => handleDeleteCustomWidget(widget.id)}
                     &gt;
                       Delete
                     &lt;/button&gt;
                   &lt;/div&gt;
                 &lt;/li&gt;
               ))}
             &lt;/ul&gt;
           )}
        &lt;/div&gt;

      &lt;/section&gt;

      {/* Backup & Restore Section */}
      &lt;section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"&gt;
        &lt;h3 className="text-xl font-semibold mb-3"&gt;Backup & Restore&lt;/h3&gt;
        &lt;p className="text-gray-600 dark:text-gray-400 mb-4"&gt;Backup and restore your Mission Control configuration and data.&lt;/p&gt;

        {/* Create Backup Button */}
        &lt;div className="mb-4"&gt;
           &lt;button
             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
             onClick={handleCreateBackup}
           &gt;
             Create Backup
           &lt;/button&gt;
        &lt;/div&gt;

        {/* Restore from Backup */}
        &lt;div&gt;
           &lt;h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2"&gt;Restore from Backup&lt;/h4&gt;
           &lt;p className="text-gray-600 dark:text-gray-400 text-sm mb-2"&gt;Upload a backup file to restore your configuration. &lt;strong className="text-red-600 dark:text-red-400"&gt;Warning: This will overwrite your current settings and data.&lt;/strong&gt;&lt;/p&gt;
           &lt;input
             type="file"
             className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"
             onChange={handleRestoreBackup}
           /&gt;
        &lt;/div&gt;


      &lt;/section&gt;

    &lt;/div&gt;
  );
}

export default Settings;