export default function WidgetSettings() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Widget Settings</h2>
      <section className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Custom Widgets</h3>
import { useState } from 'react';

export default function WidgetSettings() {
  const [installedWidgets, setInstalledWidgets] = useState([]);
  const [widgetSource, setWidgetSource] = useState('ZIP File');
  const [widgetFile, setWidgetFile] = useState(null);
  const [widgetRepo, setWidgetRepo] = useState('');

  const handleAddWidget = () => {
    // Add widget logic here
  };

  const handleDeleteWidget = (widgetId) => {
    // Delete widget logic here
  };
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enable or disable custom widgets from the dashboard.
        </p>
        <div className="mb-4">
        <label htmlFor="widgetSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Widget Source</label>
        <select
          id="widgetSource"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          value={widgetSource}
          onChange={(e) => setWidgetSource(e.target.value)}
        >
          <option>ZIP File</option>
          <option>Git Repository</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="widgetFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Widget ZIP File</label>
        <input
          type="file"
          id="widgetFile"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
          onChange={(e) => setWidgetFile(e.target.files[0])}
          disabled={widgetSource !== 'ZIP File'}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="widgetRepo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Git Repository URL</label>
        <input
          type="url"
          id="widgetRepo"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
          placeholder="https://github.com/user/widget-repo"
          value={widgetRepo}
          onChange={(e) => setWidgetRepo(e.target.value)}
          disabled={widgetSource !== 'Git Repository'}
        />
      </div>

      <div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleAddWidget}
        >
          Add Widget
        </button>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Installed Widgets</h3>
      <ul>
        {installedWidgets.map((widget) => (
          <li key={widget.id}>
            {widget.name}
            <button
              className="ml-2 text-red-500 hover:text-red-700"
              onClick={() => handleDeleteWidget(widget.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      </section>
    </div>
  );
}