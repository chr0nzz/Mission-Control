// backend/services/ApiProxyService.js

const axios = require('axios');
const ConfigurationService = require('./ConfigurationService'); // Assuming ConfigurationService is in the same directory

class ApiProxyService {
  /**
   * Makes a proxied request to an external service.
   * @param {string} serviceType - The type of service (e.g., 'sonarr', 'homeassistant').
   * @param {string} serviceInstanceId - The user-defined ID for the service instance.
   * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
   * @param {string} endpoint - The API endpoint path relative to the service's base URL.
   * @param {object} [data] - Request body data for POST/PUT requests.
   * @param {object} [params] - Query parameters.
   * @returns {Promise<object>} - The response data from the external service.
   */
  static async makeRequest(serviceType, serviceInstanceId, method, endpoint, data = null, params = null) {
    try {
      // TODO: Retrieve service configuration (base URL, API key, etc.) from ConfigurationService
      // using serviceType and serviceInstanceId.
      // Example: const baseUrl = await ConfigurationService.getSetting(`${serviceInstanceId}_url`);
      // const apiKey = await ConfigurationService.getSetting(`${serviceInstanceId}_apikey`);

      // For now, using placeholder values or assuming config is available elsewhere
      // This part needs to be fully implemented based on how service configs are stored and structured.
      console.warn(`ApiProxyService.makeRequest called for ${serviceType}/${serviceInstanceId} - Implementation needed to fetch config and make actual request.`);

      // Placeholder for making the actual HTTP request using axios
      // This needs to be implemented to use the retrieved baseUrl, apiKey, method, endpoint, data, and params.
      // Example:
      /*
      const url = `${baseUrl}${endpoint}`;
      const headers = {
        // Add authentication headers based on serviceType and apiKey
        // Example for Sonarr: 'X-Api-Key': apiKey
        // Example for Home Assistant: 'Authorization': `Bearer ${apiKey}`
      };

      const response = await axios({
        method: method,
        url: url,
        headers: headers,
        data: data,
        params: params,
        // Add timeout, error handling, etc.
      });
      return response.data;
      */

      // Returning a dummy response for now
      return {
        status: 'success',
        message: `Placeholder response for ${method} ${endpoint} to ${serviceType}/${serviceInstanceId}`,
        requestedData: { data, params }
      };

    } catch (error) {
      console.error(`Error in ApiProxyService for ${serviceType}/${serviceInstanceId} ${method} ${endpoint}:`, error.message);
      // Re-throw the error so the calling route can handle it
      throw new Error(`API proxy request failed: ${error.message}`);
    }
  }

  // TODO: Add other helper functions if needed (e.g., for specific service auth types)
}
/**
     8	   * Makes a proxied request to an external service.
     9	   * @param {string} serviceType - The type of service (e.g., 'sonarr', 'homeassistant').
    10	   * @param {string} serviceInstanceId - The user-defined ID for the service instance.
    11	   * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
    12	   * @param {string} endpoint - The API endpoint path relative to the service's base URL.
    13	   * @param {object} [data] - Request body data for POST/PUT requests.
    14	   * @param {object} [params] - Query parameters.
    15	   * @returns {Promise<object>} - The response data from the external service.
    16	   */
    17	  static async makeRequest(serviceType, serviceInstanceId, method, endpoint, data = null, params = null) {
    18	    try {
    19	      const baseUrlKey = `${serviceType}_${serviceInstanceId}_url`;
    20	      const apiKeyKey = `${serviceType}_${serviceInstanceId}_apikey`;

    21	      const baseUrl = await ConfigurationService.getSetting(baseUrlKey);
    22	      const apiKey = await ConfigurationService.getSetting(apiKeyKey);

    23	      if (!baseUrl) {
    24	        throw new Error(`Base URL not found for ${serviceType} - ${serviceInstanceId}`);
    25	      }

    26	      const url = `${baseUrl}${endpoint}`;
    27	      const headers = {};

    28	      // Add authentication headers based on serviceType and apiKey
    29	      if (apiKey) {
    30	        if (serviceType === 'Sonarr' || serviceType === 'Radarr') {
    31	          headers['X-Api-Key'] = apiKey;
    32	        } else if (serviceType === 'HomeAssistant') {
    33	          headers['Authorization'] = `Bearer ${apiKey}`;
    34	        } else {
    35	          headers['X-Api-Key'] = apiKey; // Generic API Key
    36	        }
    37	      }

    38	      const config = {
    39	        method: method,
    40	        url: url,
    41	        headers: headers,
    42	        data: data,
    43	        params: params,
    44	        timeout: 5000
    45	      };

    46	      const response = await axios(config);
    47	      return response.data;

    48	    } catch (error) {
    49	      console.error(`Error in ApiProxyService for ${serviceType}/${serviceInstanceId} ${method} ${endpoint}:`, error);
    50	      throw new Error(`API proxy request failed: ${error.message}`);
    51	    }
    52	  }

module.exports = ApiProxyService;