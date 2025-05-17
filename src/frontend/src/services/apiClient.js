// src/frontend/src/services/apiClient.js

/**
 * apiClient.js
 *
 * A service for making API requests to the Mission Control backend.
 */

const BASE_API_URL = '/api'; // All backend routes are prefixed with /api

/**
 * Performs a GET request.
 * @param {string} endpoint - The API endpoint (e.g., '/config', '/widgets/data/mywidget').
 * @param {object} params - Query parameters to append to the URL.
 * @returns {Promise<any>} The JSON response from the server.
 * @throws {Error} If the request fails or the response is not ok.
 */
async function get(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      console.error(`API Error (${response.status}) on GET ${url}:`, errorData);
      throw new Error(`API Error (${response.status}): ${errorData.message || 'Failed to fetch data'}`);
    }
    return response.json();
  } catch (error) {
    console.error(`[apiClient] GET ${url} request failed:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

/**
 * Performs a POST request.
 * @param {string} endpoint - The API endpoint.
 * @param {object} body - The request body (will be JSON.stringified).
 * @returns {Promise<any>} The JSON response from the server.
 * @throws {Error} If the request fails or the response is not ok.
 */
async function post(endpoint, body) {
  const url = `${BASE_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other common headers like CSRF tokens if needed in the future
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      console.error(`API Error (${response.status}) on POST ${url}:`, errorData);
      throw new Error(`API Error (${response.status}): ${errorData.message || 'Failed to post data'}`);
    }
    return response.json();
  } catch (error) {
    console.error(`[apiClient] POST ${url} request failed:`, error);
    throw error;
  }
}

/**
 * Specific helper for fetching data for a widget via the backend proxy.
 * @param {string} widgetId - The ID of the widget.
 * @param {object} params - Query parameters to pass to the widget data endpoint.
 * @returns {Promise<any>} The data for the widget.
 */
async function getWidgetData(widgetId, params = {}) {
  if (!widgetId) {
    return Promise.reject(new Error('Widget ID is required for getWidgetData.'));
  }
  return get(`/widgets/data/${widgetId}`, params);
}

export const apiClient = {
  get,
  post,
  getWidgetData,
};

// Default export for easy import
export default apiClient;
