export default function ServiceSettings() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Service Settings</h2>
      <section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Service Configuration</h3>
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ServiceSettings() {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    serviceType: 'Sonarr',
    serviceName: '',
    serviceUrl: '',
    apiKey: '',
  });

  const handleAddService = () => {
    setServices([...services, { ...newService, id: uuidv4() }]);
    setNewService({
      serviceType: 'Sonarr',
      serviceName: '',
      serviceUrl: '',
      apiKey: '',
    });
  };
const handleDeleteService = (id) => {
    setServices(services.filter((service) => service.id !== id));
  };

  const handleEditService = (id) => {
    // Edit service logic here
    console.log(`Edit service with id: ${id}`);
  };
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add, edit, and manage connections to your self-hosted services.
        </p>
        <div className="mb-4">
        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Type</label>
        <select
          id="serviceType"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          value={newService.serviceType}
          onChange={(e) => setNewService({ ...newService, serviceType: e.target.value })}
        >
          <option>Sonarr</option>
          <option>Radarr</option>
          <option>Home Assistant</option>
          <option>Plex</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Instance Name</label>
        <input
          type="text"
          id="serviceName"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
          placeholder="e.g., Sonarr Main, Radarr 4K"
          value={newService.serviceName}
          onChange={(e) => setNewService({ ...newService, serviceName: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="serviceUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service URL</label>
        <input
          type="url"
          id="serviceUrl"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
          placeholder="http://localhost:8989"
          value={newService.serviceUrl}
          onChange={(e) => setNewService({ ...newService, serviceUrl: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
        <input
          type="text"
          id="apiKey"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
          value={newService.apiKey}
          onChange={(e) => setNewService({ ...newService, apiKey: e.target.value })}
        />
      </div>

      <div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleAddService}
        >
          Add Service
        </button>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Configured Services</h3>
      <ul>
        {services.map((service) => (
          <li key={service.id} className="flex items-center justify-between py-2">
            <div>
              {service.serviceName} ({service.serviceType}) - {service.serviceUrl}
            </div>
            <div>
              <button
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={() => handleDeleteService(service.id)}
              >
                Delete
              </button>
              <button
                className="ml-2 text-blue-500 hover:text-blue-700"
                onClick={() => handleEditService(service.id)}
              >
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>
      </section>
    </div>
  );
}