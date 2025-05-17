# Uptime Kuma Status Widget ✅⏲️

**Purpose**: Provides an overview of your monitor statuses from an [Uptime Kuma](https://github.com/louislam/uptime-kuma) instance, showing how many services are UP, DOWN, or PAUSED.

---

## 🖼️ Preview

*(Imagine a screenshot of the Uptime Kuma widget showing counts of UP, DOWN, and PAUSED monitors. Optionally, a list of currently DOWN monitors.)*

+---------------------------------+| Uptime Kuma Status ✅⏲️         |+---------------------------------+| Monitors:                       ||   UP:     15 🟢                 ||   DOWN:    1 🔴                 ||   PAUSED:  2 ⏸️                 ||---------------------------------|| Currently Down:                 ||   - My Web Server (since 10:30) |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                        | Type    | Description                                                                                                                                                              | Required | Default Value | Example                               |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | ------------------------------------- |
| `url`                       | string  | The full URL of your Uptime Kuma instance (e.g., `http://uptimekuma_host:3001`).                                                                                         | Yes      | N/A           | `"http://192.168.1.24:3001"`          |
| `apiKey`                    | string  | (Optional) Your Uptime Kuma API key if the API requires it for read access or if using specific API features. For basic status, it might not be needed if status page is public. | No       | `""`          | `"your_kuma_api_key"`               |
| `show_down_monitors_list`   | boolean | Whether to display a list of currently DOWN monitors.                                                                                                                    | No       | `true`        | `false`                               |
| `show_paused_monitors_list` | boolean | Whether to display a list of currently PAUSED monitors.                                                                                                                  | No       | `false`       | `true`                                |
| `max_list_items`            | number  | Maximum number of DOWN or PAUSED monitors to list if enabled.                                                                                                            | No       | `5`           | `3`                                   |
| `refresh_interval`          | number  | How often the widget should fetch new data, in seconds.                                                                                                                  | No       | `60`          | `120`                                 |
| `use_socketio`              | boolean | Whether the widget should attempt to connect via Socket.IO for real-time updates (if supported by widget and Kuma API allows). Otherwise, it will poll via REST API.     | No       | `false` (or depends on impl.) | `true`                                |

**Note on Uptime Kuma API & `apiKey`**:
* Uptime Kuma has a REST API and a Socket.IO API.
* For basic public status pages, an API key might not be needed.
* If the widget needs to fetch a list of all monitors or detailed status (not just a public summary), an API key might be required. You can create API keys in Uptime Kuma under Settings -> API Keys.
* The `use_socketio` option depends on the widget's implementation. Socket.IO provides real-time updates, while REST API polling is periodic.

---

## 🔌 Data Sources

* **Primary**: Uptime Kuma API.
    * **Socket.IO**: If `use_socketio: true` and the widget supports it, it will connect to Uptime Kuma's Socket.IO endpoint (usually at the same base `url`) for real-time status updates. This is often preferred.
    * **REST API**: If Socket.IO is not used/supported, the widget will poll REST API endpoints.
        * Example endpoints: `/api/status-page/slug` (for public status pages), or `/api/monitors` (requires API key, to get all monitors). The specific endpoints depend on what data the widget needs.
    * Access might be direct from the frontend (if Socket.IO and CORS allows) or via the Mission Control backend proxy (especially for REST API calls with an `apiKey`).

---

## 📡 MQTT Topics

* This widget is more likely to use Uptime Kuma's native Socket.IO for real-time updates or poll its REST API. It would only use MQTT if you have a separate process publishing Uptime Kuma statuses to MQTT and the widget is configured to listen to those specific topics (making it more like a generic MQTT Subscriber widget in that case).

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Connection Error" / "Error Fetching Data"**:
    * Verify the `url` in your widget options is correct and your Uptime Kuma instance is running and accessible.
    * If using `apiKey`, ensure it's correct and has the necessary permissions in Uptime Kuma.
    * **Socket.IO Issues**: If `use_socketio: true`, ensure your network/proxy setup allows WebSocket connections to the Uptime Kuma instance. Check browser console for WebSocket connection errors.
    * **CORS Issues**: If the frontend tries to connect directly (especially REST API without proxy), Cross-Origin Resource Sharing (CORS) might be an issue if Uptime Kuma isn't configured to allow requests from the Mission Control dashboard's origin. Using the backend proxy for REST calls usually avoids this.
* **No Monitors Displayed / Incorrect Statuses**:
    * Ensure Uptime Kuma has monitors configured.
    * If using a public status page slug in the URL, make sure that status page is enabled and includes the monitors you expect to see.
    * If the data seems stale, check the `refresh_interval` (for polling) or investigate Socket.IO connection stability.
