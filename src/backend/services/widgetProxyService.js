// src/backend/services/widgetProxyService.js

const axios = require('axios'); // For making HTTP requests to external services

// --- Individual Fetcher Functions ---

/**
 * Fetches data for the Glances widget.
 * @param {object} widgetOptions - Options from dashboard.yml for this widget instance.
 * @param {object} clientQuery - Query parameters from the frontend widget's request.
 * @returns {Promise<object>} Data fetched from Glances.
 */
async function fetchGlancesData(widgetOptions, clientQuery) {
  if (!widgetOptions.url) {
    throw new Error('Glances widget URL is not configured.');
  }
  const baseUrl = widgetOptions.url.replace(/\/$/, ""); 
  const apiVersion = widgetOptions.glances_api_version || '4'; 

  // Default metrics if not specified, or if an empty string/array is passed
  let metricsToFetch = widgetOptions.metrics_to_display;
  if (typeof metricsToFetch === 'string' && metricsToFetch.trim() !== '') {
    metricsToFetch = metricsToFetch.split(',').map(m => m.trim()).filter(m => m);
  } else if (!Array.isArray(metricsToFetch) || metricsToFetch.length === 0) {
    metricsToFetch = ['cpu', 'mem', 'load', 'fs', 'uptime']; // Sensible defaults
  }


  let data = {};

  // Allow clientQuery to override or specify a single metric if needed
  if (clientQuery && clientQuery.metric && typeof clientQuery.metric === 'string') {
    const singleMetric = clientQuery.metric.toLowerCase();
    try {
        const response = await axios.get(`${baseUrl}/api/${apiVersion}/${singleMetric}`, { timeout: 5000 });
        data[singleMetric] = response.data;
    } catch (error) {
        console.error(`[GlancesFetcher] Error fetching ${singleMetric} from ${baseUrl}:`, error.message);
        throw new Error(`Failed to fetch ${singleMetric} from Glances: ${error.message}`);
    }
  } else {
    // Fetch all configured metrics
    for (const metric of metricsToFetch) {
      try {
        const response = await axios.get(`${baseUrl}/api/${apiVersion}/${metric}`, { timeout: 5000 });
        data[metric] = response.data;
      } catch (error) {
        console.warn(`[GlancesFetcher] Error fetching metric '${metric}' from ${baseUrl}: ${error.message}. Skipping this metric.`);
        data[metric] = { error: `Failed to fetch ${metric}: ${error.message}` };
      }
    }
  }
  return data;
}

/**
 * Fetches data for the Sonarr widget (e.g., upcoming episodes).
 * @param {object} widgetOptions - e.g., { url, apiKey, days_ahead, include_unmonitored }
 * @param {object} clientQuery - Not typically used by Sonarr calendar, config is from options.
 * @returns {Promise<object>} Data fetched from Sonarr.
 */
async function fetchSonarrData(widgetOptions, clientQuery) {
  if (!widgetOptions.url || !widgetOptions.apiKey) {
    throw new Error('Sonarr widget URL or API Key is not configured.');
  }
  const baseUrl = widgetOptions.url.replace(/\/$/, "");
  const apiKey = widgetOptions.apiKey;

  const startDate = new Date();
  const endDate = new Date();
  const daysAhead = parseInt(widgetOptions.days_ahead, 10) || 7;
  endDate.setDate(startDate.getDate() + daysAhead);

  const params = {
    apikey: apiKey,
    start: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    end: endDate.toISOString().split('T')[0],     // YYYY-MM-DD
    unmonitored: widgetOptions.include_unmonitored === true,
    // includeSeries: true, // Recommended to get series details for display
    // includeEpisodeFile: false, // Usually not needed for upcoming display
  };

  try {
    const response = await axios.get(`${baseUrl}/api/v3/calendar`, { params, timeout: 10000 });
    return response.data; // This is typically an array of episode objects
  } catch (error) {
    console.error(`[SonarrFetcher] Error fetching Sonarr calendar from ${baseUrl}:`, error.message);
    if (error.response) {
      console.error('[SonarrFetcher] Sonarr API Response:', error.response.status, error.response.data);
      throw new Error(`Sonarr API error (${error.response.status}): ${error.response.data?.message || error.message}`);
    }
    throw new Error(`Failed to fetch Sonarr calendar: ${error.message}`);
  }
}


/**
 * Fetches data for the Radarr widget (e.g., download queue).
 * @param {object} widgetOptions - e.g., { url, apiKey }
 * @param {object} clientQuery - Not typically used by Radarr queue, config is from options.
 * @returns {Promise<object>} Data fetched from Radarr (usually { records: [...] }).
 */
async function fetchRadarrData(widgetOptions, clientQuery) {
    if (!widgetOptions.url || !widgetOptions.apiKey) {
        throw new Error('Radarr widget URL or API Key is not configured.');
    }
    const baseUrl = widgetOptions.url.replace(/\/$/, "");
    const apiKey = widgetOptions.apiKey;

    const params = {
        apikey: apiKey,
        includeMovie: true, // Usually good to include movie details in queue items
        // page: 1, // Default
        // pageSize: 20, // Default, can be adjusted if needed
        // sortKey: 'timeleft', // Or 'progress', 'indexer' etc.
        // sortDir: 'asc',
    };

    try {
        const response = await axios.get(`${baseUrl}/api/v3/queue`, { params, timeout: 10000 });
        return response.data; // Radarr's queue endpoint returns an object like { page, pageSize, totalRecords, records: [] }
    } catch (error) {
        console.error(`[RadarrFetcher] Error fetching Radarr queue from ${baseUrl}:`, error.message);
        if (error.response) {
            console.error('[RadarrFetcher] Radarr API Response:', error.response.status, error.response.data);
            throw new Error(`Radarr API error (${error.response.status}): ${error.response.data?.message || error.message}`);
        }
        throw new Error(`Failed to fetch Radarr queue: ${error.message}`);
    }
}


/**
 * Fetches data for the qBittorrent widget.
 * Handles session-based authentication.
 * @param {object} widgetOptions - e.g., { url, username, password, torrent_list_filter }
 * @param {object} clientQuery - e.g., { filter (overrides option), sort, limit }
 * @returns {Promise<object>} Object containing { transferInfo: {}, torrents: [] }.
 */
async function fetchQbittorrentData(widgetOptions, clientQuery) {
    if (!widgetOptions.url) {
        throw new Error('qBittorrent widget URL is not configured.');
    }
    const baseUrl = widgetOptions.url.replace(/\/$/, "");
    const { username, password } = widgetOptions;
    let sidCookie = null; // Store the SID cookie string

    // Use an Axios instance with a cookie jar if available and more robust session handling is needed.
    // For this example, we'll manually handle the cookie.
    const instance = axios.create({
        baseURL: baseUrl,
        timeout: 5000,
        withCredentials: true, // Important for sending cookies, though manual handling is shown here
    });


    if (username && password) {
        try {
            const loginPayload = new URLSearchParams();
            loginPayload.append('username', username);
            loginPayload.append('password', password);

            const loginResponse = await instance.post(`/api/v2/auth/login`, loginPayload.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (loginResponse.data.trim() === 'Ok.') {
                const cookies = loginResponse.headers['set-cookie'];
                if (cookies) {
                    const sid = cookies.find(cookie => cookie.startsWith('SID='));
                    if (sid) {
                        sidCookie = sid.split(';')[0]; // Extract just "SID=value"
                    }
                }
                if (!sidCookie) console.warn('[QbittorrentFetcher] Login successful but SID cookie not found/extracted.');
            } else {
                 throw new Error(`qBittorrent login failed: ${loginResponse.data}`);
            }
        } catch (loginError) {
            console.error(`[QbittorrentFetcher] qBittorrent login error to ${baseUrl}:`, loginError.message);
            throw new Error(`qBittorrent login failed: ${loginError.message}`);
        }
    }

    try {
        const requestConfig = sidCookie ? { headers: { 'Cookie': sidCookie } } : {};

        const transferInfoPromise = instance.get(`/api/v2/transfer/info`, requestConfig);
        
        const torrentsParams = {
            filter: clientQuery.filter || widgetOptions.torrent_list_filter || 'all',
            // Add other params like sort, limit, offset if needed from clientQuery or widgetOptions
            // limit: widgetOptions.show_torrent_list_count || clientQuery.limit || 10, // Example
            // sort: 'progress', // Example
        };
        const torrentsInfoPromise = instance.get(`/api/v2/torrents/info`, { ...requestConfig, params: torrentsParams });

        const [transferInfoRes, torrentsInfoRes] = await Promise.all([transferInfoPromise, torrentsInfoPromise]);

        // Optional: Logout if SID was obtained
        if (sidCookie) {
            try {
                await instance.post(`/api/v2/auth/logout`, {}, requestConfig);
            } catch (logoutError) {
                console.warn('[QbittorrentFetcher] Failed to logout from qBittorrent (SID might remain active until expiry):', logoutError.message);
            }
        }

        return {
            transferInfo: transferInfoRes.data,
            torrents: torrentsInfoRes.data, // This is an array of torrent objects
        };
    } catch (error) {
        console.error(`[QbittorrentFetcher] Error fetching qBittorrent data from ${baseUrl}:`, error.message);
        if (error.response) {
             console.error('[QbittorrentFetcher] qBittorrent API Response:', error.response.status, error.response.data);
             throw new Error(`qBittorrent API error (${error.response.status}): ${error.response.data?.message || error.message}`);
        }
        throw new Error(`Failed to fetch qBittorrent data: ${error.message}`);
    }
}


/**
 * Fetches data for the OpenMeteo Weather widget.
 * @param {object} widgetOptions - e.g., { latitude, longitude, units, timezone, currentFields, dailyFields, forecast_days }
 * @param {object} clientQuery - Not typically used here.
 * @returns {Promise<object>} Weather data from Open-Meteo.
 */
async function fetchOpenMeteoData(widgetOptions, clientQuery) {
    if (widgetOptions.latitude === undefined || widgetOptions.longitude === undefined) {
        throw new Error('Weather widget latitude or longitude is not configured.');
    }

    const params = {
        latitude: widgetOptions.latitude,
        longitude: widgetOptions.longitude,
        current: widgetOptions.currentFields || 'temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,windspeed_10m,precipitation',
        daily: widgetOptions.dailyFields || 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
        timezone: widgetOptions.timezone || 'auto',
    };
    if (widgetOptions.units === 'imperial') {
        params.temperature_unit = 'fahrenheit';
        params.windspeed_unit = 'mph';
        params.precipitation_unit = 'inch';
    } else { // metric is default for OpenMeteo if not specified, but good to be explicit
        params.temperature_unit = 'celsius';
        params.windspeed_unit = 'kmh';
        params.precipitation_unit = 'mm';
    }
    if (widgetOptions.show_forecast_days) { // Note: option name is show_forecast_days
        params.forecast_days = parseInt(widgetOptions.show_forecast_days, 10);
    }


    try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', { params, timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('[OpenMeteoFetcher] Error fetching weather data:', error.message);
        if (error.response) {
            console.error('[OpenMeteoFetcher] API Response:', error.response.status, error.response.data);
            throw new Error(`Open-Meteo API error (${error.response.status}): ${error.message}`);
        }
        throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
}

/**
 * Fetches data for the Pi-hole widget.
 * @param {object} widgetOptions - e.g., { url, apiKey, show_top_domain, show_gravity_status }
 * @param {object} clientQuery - Not typically used for standard Pi-hole stats.
 * @returns {Promise<object>} Object containing { summary, topItems, gravity }.
 */
async function fetchPiholeData(widgetOptions, clientQuery) {
    if (!widgetOptions.url || !widgetOptions.apiKey) {
        throw new Error('Pi-hole widget URL or API Key is not configured.');
    }
    const baseUrl = widgetOptions.url.replace(/\/$/, ""); // Ensure no trailing slash
    const apiKey = widgetOptions.apiKey;
    let data = {};

    try {
        // Fetch summary data (always needed)
        const summaryResponse = await axios.get(`${baseUrl}/api.php?summaryRaw&auth=${apiKey}`, { timeout: 5000 });
        data.summary = summaryResponse.data;

        // Fetch top items if configured
        if (widgetOptions.show_top_domain) {
            // Fetch more items to allow for potential filtering/selection later if needed
            const topItemsResponse = await axios.get(`${baseUrl}/api.php?topItems=10&auth=${apiKey}`, { timeout: 5000 });
            data.topItems = topItemsResponse.data; // e.g., { top_queries: { "domain": count, ... }, top_ads: { ... } }
        }
        
        // Fetch Gravity status if configured
        if (widgetOptions.show_gravity_status) {
            const gravityResponse = await axios.get(`${baseUrl}/api.php?gravity&auth=${apiKey}`, { timeout: 5000 });
            data.gravity = gravityResponse.data; // e.g., { file_exists: true, gravity_last_updated: { absolute, relative: {days,hours,minutes} } }
        }
        
        return data;
    } catch (error) {
        console.error(`[PiholeFetcher] Error fetching Pi-hole data from ${baseUrl}:`, error.message);
        if (error.response) {
            console.error('[PiholeFetcher] Pi-hole API Response:', error.response.status, error.response.data);
            throw new Error(`Pi-hole API error (${error.response.status}): ${error.message}`);
        }
        throw new Error(`Failed to fetch Pi-hole data: ${error.message}`);
    }
}

/**
 * Fetches data for the Uptime Kuma widget.
 * @param {object} widgetOptions - e.g., { url, apiKey (for all monitors), statusPageSlug (for public page) }
 * @param {object} clientQuery - Not typically used.
 * @returns {Promise<object>} Data from Uptime Kuma.
 */
async function fetchUptimeKumaData(widgetOptions, clientQuery) {
    if (!widgetOptions.url) {
        throw new Error('Uptime Kuma widget URL is not configured.');
    }
    const baseUrl = widgetOptions.url.replace(/\/$/, "");
    
    // Uptime Kuma's primary real-time data is via Socket.IO, handled by frontend.
    // This backend proxy is for polling a REST endpoint if available/needed.
    if (widgetOptions.apiKey) { // Fetch all monitors (requires API key in Uptime Kuma settings)
        try {
            // This is a common pattern for APIs that list resources; actual endpoint may vary.
            // Uptime Kuma's REST API might be limited or not officially documented for all data.
            // Check Uptime Kuma documentation for the correct endpoint for "all monitors" if it exists.
            // A hypothetical endpoint:
            const response = await axios.get(`${baseUrl}/api/monitors`, { 
                headers: { 'Authorization': `Bearer ${widgetOptions.apiKey}` }, // Example auth if needed
                timeout: 10000 
            });
            return { monitors: response.data }; // Assuming response.data is an array of monitor objects
        } catch (error) {
            console.error(`[UptimeKumaFetcher] Error fetching Uptime Kuma monitors list from ${baseUrl}:`, error.message);
            if (error.response) { throw new Error(`Uptime Kuma API error (${error.response.status}): ${error.message}`);}
            throw new Error(`Failed to fetch Uptime Kuma monitors list: ${error.message}`);
        }
    } else if (widgetOptions.statusPageSlug) { // Fetch data from a public status page
        try {
            const response = await axios.get(`${baseUrl}/api/status-page/${widgetOptions.statusPageSlug}`, { timeout: 10000 });
            // The response structure for status pages usually contains publicGroupList, which has monitorList.
            // We need to extract and normalize this for the widget.
            if (response.data && response.data.publicGroupList && response.data.publicGroupList.length > 0) {
                let allMonitorsFromStatusPage = [];
                response.data.publicGroupList.forEach(group => {
                    if (group.monitorList && group.monitorList.length > 0) {
                        allMonitorsFromStatusPage = allMonitorsFromStatusPage.concat(
                            group.monitorList.map(m => ({
                                id: m.id, // Or a unique identifier
                                name: m.name,
                                status: m.status, // Uptime Kuma status codes (0: down, 1: up, etc.)
                                // Add other relevant fields if available and needed by frontend
                            }))
                        );
                    }
                });
                return { monitors: allMonitorsFromStatusPage };
            }
            return { monitors: [] }; // No monitors on status page or unexpected structure
        } catch (error) {
            console.error(`[UptimeKumaFetcher] Error fetching Uptime Kuma status page '${widgetOptions.statusPageSlug}':`, error.message);
            throw new Error(`Failed to fetch Uptime Kuma status page: ${error.message}`);
        }
    }
    return { warning: "Uptime Kuma: Configure API Key for all monitors or a Status Page Slug to fetch data via backend." };
}

/**
 * Fetches data for the Docker widget (via a secure Docker socket proxy).
 * @param {object} widgetOptions - e.g., { proxy_url, show_all_containers }
 * @param {object} clientQuery - e.g., { containerId, action: 'start'/'stop'/'restart' }
 * @returns {Promise<object>} Data from Docker Engine API via proxy, or action status.
 */
async function fetchDockerData(widgetOptions, clientQuery) {
    if (!widgetOptions.proxy_url) {
        throw new Error('Docker widget proxy_url is not configured.');
    }
    const proxyBaseUrl = widgetOptions.proxy_url.replace(/\/$/, "");

    let requestUrl;
    const params = {};
    let method = 'get'; // Default to GET for listing
    let requestBody = {};

    if (clientQuery.action && clientQuery.containerId) {
        const { action, containerId } = clientQuery;
        if (!['start', 'stop', 'restart'].includes(action)) {
            throw new Error(`Invalid Docker action specified: ${action}`);
        }
        requestUrl = `${proxyBaseUrl}/containers/${containerId}/${action}`;
        method = 'post'; // Actions are POST requests
    } else { // Default action: list containers
        requestUrl = `${proxyBaseUrl}/containers/json`;
        if (widgetOptions.show_all_containers) {
            params.all = true;
        }
        // Add other filters if needed, e.g., status=running
    }

    try {
        const response = await axios({
            method: method,
            url: requestUrl,
            params: method === 'get' ? params : undefined, // Only for GET
            data: method === 'post' ? requestBody : undefined, // Only for POST/PUT
            timeout: 10000
        });
        // For actions, Docker API often returns 204 No Content on success.
        if (method === 'post' && response.status === 204) {
            return { status: 'success', message: `Container action '${clientQuery.action}' successful.` };
        }
        return response.data; // For list or other GETs
    } catch (error) {
        const actionInfo = clientQuery.action ? `action '${clientQuery.action}' on container ${clientQuery.containerId}` : 'container list';
        console.error(`[DockerFetcher] Error performing Docker ${actionInfo} via ${proxyBaseUrl}:`, error.message);
        if (error.response) {
            console.error('[DockerFetcher] Proxy API Response:', error.response.status, error.response.data);
            throw new Error(`Docker API error for ${actionInfo} via proxy (${error.response.status}): ${error.response.data?.message || error.message}`);
        }
        throw new Error(`Failed to perform Docker ${actionInfo} via proxy: ${error.message}`);
    }
}

/**
 * Fetches data for the Home Assistant Entity widget.
 * @param {object} widgetOptions - e.g., { ha_url, long_lived_token, entity_id }
 * @param {object} clientQuery - Not typically used for simple state fetching.
 * @returns {Promise<object>} State object of the HA entity.
 */
async function fetchHomeAssistantData(widgetOptions, clientQuery) {
    if (!widgetOptions.ha_url || !widgetOptions.long_lived_token || !widgetOptions.entity_id) {
        throw new Error('Home Assistant widget URL, Long-Lived Token, or Entity ID is not configured.');
    }
    const baseUrl = widgetOptions.ha_url.replace(/\/$/, "");
    const token = widgetOptions.long_lived_token;
    const entityId = widgetOptions.entity_id;

    try {
        const response = await axios.get(`${baseUrl}/api/states/${entityId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });
        return response.data; // Contains state, attributes, last_changed, etc.
    } catch (error) {
        console.error(`[HomeAssistantFetcher] Error fetching HA entity ${entityId} from ${baseUrl}:`, error.message);
        if (error.response) {
            console.error('[HomeAssistantFetcher] HA API Response:', error.response.status, error.response.data);
            throw new Error(`Home Assistant API error (${error.response.status}): ${error.response.data?.message || error.message}`);
        }
        throw new Error(`Failed to fetch Home Assistant entity ${entityId}: ${error.message}`);
    }
}

/**
 * Fetches data for the Overseerr Requests widget.
 * @param {object} widgetOptions - e.g., { url, apiKey, recent_list_count, recent_list_filter, show_counts (array) }
 * @param {object} clientQuery - Not typically used, config from options.
 * @returns {Promise<object>} Object containing { counts: {}, requests: [] }.
 */
async function fetchOverseerrData(widgetOptions, clientQuery) {
    if (!widgetOptions.url || !widgetOptions.apiKey) {
        throw new Error('Overseerr widget URL or API Key is not configured.');
    }
    const baseUrl = widgetOptions.url.replace(/\/$/, "");
    const apiKey = widgetOptions.apiKey;
    let data = { counts: {}, requests: [] };
    const headers = { 'X-Api-Key': apiKey };

    try {
        // Fetch request counts
        const countResponse = await axios.get(`${baseUrl}/api/v1/request/count`, { headers, timeout: 10000 });
        data.counts = countResponse.data; // e.g., { pending: 5, approved: 10, available: ... }

        // Fetch recent requests list if configured
        if (widgetOptions.show_recent_list !== false) { // Default to true if not specified
            const take = parseInt(widgetOptions.recent_list_count, 10) || 5;
            // Overseerr API filter values: 1 (Pending), 2 (Approved), 3 (Processing), 4 (Partially Available), 5 (Available)
            // The 'filter' param in API might expect these numbers or specific strings.
            // Assuming widgetOptions.recent_list_filter is a string like 'pending', 'approved', 'available', 'all'.
            // This needs mapping if API expects numeric status. For now, assume API handles string filters.
            const filterValue = widgetOptions.recent_list_filter || 'all';
            
            const listParams = {
                take: take,
                skip: 0,
                sort: 'added', // Sort by recently added
                filter: filterValue, // Pass filter string directly
            };
            const listResponse = await axios.get(`${baseUrl}/api/v1/request`, { headers, params: listParams, timeout: 10000 });
            data.requests = listResponse.data.results || []; // Ensure it's an array
        }
        return data;
    } catch (error) {
        console.error(`[OverseerrFetcher] Error fetching Overseerr data from ${baseUrl}:`, error.message);
        if (error.response) {
            console.error('[OverseerrFetcher] Overseerr API Response:', error.response.status, error.response.data);
            throw new Error(`Overseerr API error (${error.response.status}): ${error.response.data?.message || error.message}`);
        }
        throw new Error(`Failed to fetch Overseerr data: ${error.message}`);
    }
}

/**
 * Fetches data for the Plex/Tautulli Activity widget.
 * @param {object} widgetOptions - e.g., { mode: 'tautulli'/'plex', tautulli_url, tautulli_apiKey, plex_url, plex_token }
 * @param {object} clientQuery - Not typically used for activity fetching.
 * @returns {Promise<object>} Plex/Tautulli activity data.
 */
async function fetchPlexTautulliData(widgetOptions, clientQuery) {
    const mode = widgetOptions.mode || 'tautulli'; // Default to Tautulli

    if (mode === 'tautulli') {
        if (!widgetOptions.tautulli_url || !widgetOptions.tautulli_apiKey) {
            throw new Error('Tautulli widget URL or API Key is not configured for Tautulli mode.');
        }
        const baseUrl = widgetOptions.tautulli_url.replace(/\/$/, "");
        const apiKey = widgetOptions.tautulli_apiKey;
        try {
            const response = await axios.get(`${baseUrl}/api/v2`, {
                params: { apikey: apiKey, cmd: 'get_activity' },
                timeout: 10000
            });
            // Tautulli API response structure: { response: { result: 'success', data: { sessions: [], stream_count: ... } } }
            if (response.data && response.data.response && response.data.response.result === 'success') {
                return response.data.response.data; // This object contains sessions, stream_count, etc.
            } else {
                throw new Error(`Tautulli API error: ${response.data?.response?.message || 'Unknown error from Tautulli'}`);
            }
        } catch (error) {
            console.error(`[PlexTautulliFetcher] Error fetching Tautulli activity from ${baseUrl}:`, error.message);
            if (error.response) { // Axios error with response
                console.error('[PlexTautulliFetcher] Tautulli API HTTP Response:', error.response.status, error.response.data);
            }
            // Re-throw a more generic error or the specific one if available
            throw new Error(`Failed to fetch Tautulli activity: ${error.message}`);
        }
    } else if (mode === 'plex') {
        if (!widgetOptions.plex_url || !widgetOptions.plex_token) {
            throw new Error('Plex widget URL or Token is not configured for Plex mode.');
        }
        const baseUrl = widgetOptions.plex_url.replace(/\/$/, "");
        const token = widgetOptions.plex_token;
        try {
            const response = await axios.get(`${baseUrl}/status/sessions`, {
                headers: { 'X-Plex-Token': token, 'Accept': 'application/json' },
                timeout: 10000
            });
            // The response structure for Plex direct is MediaContainer with Session objects (or Video, Track, Photo)
            // We adapt this to a structure somewhat similar to Tautulli's `sessions` array for consistency.
            const plexSessions = response.data.MediaContainer?.Metadata || [];
            return {
                stream_count: response.data.MediaContainer?.size || 0,
                sessions: plexSessions.map(s => ({
                    session_key: s.sessionKey || s.key,
                    thumb: s.thumb || s.parentThumb,
                    art: s.art || s.grandparentArt,
                    title: s.title, // For movies or episodes
                    full_title: s.grandparentTitle ? `${s.grandparentTitle} - S${String(s.parentIndex).padStart(2, '0')}E${String(s.index).padStart(2, '0')} ${s.title}` : s.title,
                    user: s.User?.title,
                    player: s.Player?.title,
                    product: s.Player?.product,
                    state: s.Player?.state,
                    duration: parseInt(s.duration, 10), // ms
                    view_offset: parseInt(s.viewOffset, 10), // ms
                    media_type: s.type, // 'movie', 'episode', 'track'
                    // Add other relevant fields, mapping from Plex session structure
                }))
            };
        } catch (error) {
            console.error(`[PlexTautulliFetcher] Error fetching Plex sessions from ${baseUrl}:`, error.message);
            if (error.response) {
                console.error('[PlexTautulliFetcher] Plex API HTTP Response:', error.response.status, error.response.data);
            }
            throw new Error(`Failed to fetch Plex sessions: ${error.message}`);
        }
    } else {
        throw new Error(`Invalid mode specified for Plex/Tautulli widget: ${mode}`);
    }
}


const widgetProxyService = {
  /**
   * Main method to fetch data for any given widget.
   * It determines the widget type and calls the appropriate fetcher function.
   * @param {object} widgetConfig - The full configuration object for the widget.
   * (Contains `id` (which is `i` from grid), `type` (which is `widgetType`), `options` (which is `widgetOptions`)).
   * @param {object} clientQuery - Query parameters from the frontend widget's request.
   * @returns {Promise<any>} Data fetched from the target service.
   */
  async fetchDataForWidget(widgetConfig, clientQuery) {
    if (!widgetConfig || !widgetConfig.type || !widgetConfig.options) {
      throw new Error('Invalid widget configuration provided to proxy service (missing type or options).');
    }

    const widgetType = widgetConfig.type;
    const widgetOptions = widgetConfig.options; // These are the widget-specific options from dashboard.yml

    // console.log(`[WidgetProxyService] Fetching data for widget type: ${widgetType}, ID: ${widgetConfig.id}, Options:`, widgetOptions);

    switch (widgetType) {
      case 'GlancesWidget':
        return fetchGlancesData(widgetOptions, clientQuery);
      case 'SonarrWidget':
        return fetchSonarrData(widgetOptions, clientQuery);
      case 'RadarrWidget':
        return fetchRadarrData(widgetOptions, clientQuery);
      case 'QbittorrentWidget':
        return fetchQbittorrentData(widgetOptions, clientQuery);
      case 'WeatherWidget':
        return fetchOpenMeteoData(widgetOptions, clientQuery);
      case 'PiholeWidget':
        return fetchPiholeData(widgetOptions, clientQuery);
      case 'UptimeKumaWidget':
        return fetchUptimeKumaData(widgetOptions, clientQuery);
      case 'DockerWidget':
        return fetchDockerData(widgetOptions, clientQuery);
      case 'HomeAssistantWidget':
         return fetchHomeAssistantData(widgetOptions, clientQuery);
      case 'OverseerrWidget':
         return fetchOverseerrData(widgetOptions, clientQuery);
      case 'PlexTautulliWidget':
         return fetchPlexTautulliData(widgetOptions, clientQuery);
      
      case 'SectionHeaderWidget': // This widget is purely presentational, no data to fetch from backend.
        return Promise.resolve({ message: "Section Header - No data fetched from backend." });
      
      // MqttSubscriberWidget and DateTimeWidget are typically frontend-only for their data source.
      // If they were to call this endpoint for some reason (e.g. a configuration check), handle them.
      case 'MqttSubscriberWidget':
      case 'DateTimeWidget':
        return Promise.resolve({ message: `${widgetType} data is managed by the frontend.` });

      default:
        console.warn(`[WidgetProxyService] No data fetcher implemented for widget type: ${widgetType}`);
        throw new Error(`No data fetcher available for widget type: ${widgetType}`);
    }
  }
};

module.exports = widgetProxyService;
