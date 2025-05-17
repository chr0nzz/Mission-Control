# Overseerr Requests Widget 🙏🎞️

**Purpose**: Displays an overview of media requests from your [Overseerr](https://overseerr.dev/) (or [Jellyseerr](https://github.com/FallenBagel/jellyseerr)) instance, such as the number of pending and approved requests, and a list of recent requests.

---

## 🖼️ Preview

*(Imagine a screenshot of the Overseerr widget showing counts of pending/approved requests and a list of a few recent movie/show requests with their status.)*

+-----------------------------------------+| Overseerr: Media Requests 🙏🎞️          |+-----------------------------------------+| Pending Approval: 3                     || Recently Approved: 5                    || Available: 20                           ||-----------------------------------------|| Recent Requests:                        || - Movie X (2024) - Pending Approval     || - TV Show Y S01 - Approved              || - Movie Z (2023) - Available            |+-----------------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                 | Type    | Description                                                                                                                            | Required | Default Value | Example                               |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------- |
| `url`                | string  | The full URL of your Overseerr/Jellyseerr instance (e.g., `http://overseerr_host:5055`).                                               | Yes      | N/A           | `"http://192.168.1.27:5055"`          |
| `apiKey`             | string  | Your Overseerr API key. Found in Overseerr under Settings -> General -> API Key.                                                         | Yes      | N/A           | `"your_overseerr_api_key"`            |
| `show_counts`        | array of strings | Which request counts to display (e.g., `["pending", "approved", "available", "processing", "failed"]`). Widget specific.      | No       | `["pending", "approved", "available"]` | `["pending", "failed"]`            |
| `show_recent_list`   | boolean | Whether to display a list of recent requests.                                                                                          | No       | `true`        | `false`                               |
| `recent_list_count`  | number  | How many recent requests to display in the list if `show_recent_list` is true.                                                           | No       | `5`           | `3`                                   |
| `recent_list_filter` | string  | Filter for the recent requests list (e.g., "all", "pending", "approved"). Widget specific interpretation.                               | No       | `"all"`       | `"pending"`                           |
| `refresh_interval`   | number  | How often the widget should fetch new data, in seconds.                                                                                | No       | `300` (5 mins)| `600` (10 mins)                     |

---

## 🔌 Data Sources

* **Primary**: Overseerr API (v1).
    * Accessed via the Mission Control backend proxy to protect your `apiKey`.
    * Common API endpoints used:
        * `/api/v1/request?take=...&skip=...&filter=...&sort=...` (to get lists of requests with various filters)
        * `/api/v1/request/count` (to get counts of requests by status)

---

## 📡 MQTT Topics

* This widget typically polls the Overseerr API via the backend. Overseerr can send notifications for events, which could potentially be routed to MQTT by an intermediary tool, but the widget would usually rely on direct API polling.

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Invalid API Key" / "Error Fetching Data"**:
    * Verify the `url` in your widget options is correct and your Overseerr instance is running and accessible from the Mission Control backend.
    * Double-check your `apiKey`. Ensure it's copied correctly from Overseerr's settings.
    * If Overseerr is behind a reverse proxy, ensure the proxy is configured correctly.
* **No Requests Displayed / Incorrect Counts**:
    * Ensure there are requests in your Overseerr instance that match the filters or statuses the widget is configured to display.
    * Check the `show_counts` and `recent_list_filter` options to make sure they align with the data you expect to see.
* **Jellyseerr Compatibility**:
    * Jellyseerr is a fork of Overseerr and largely maintains API compatibility. This widget should generally work with Jellyseerr as well, but minor differences in API responses could occasionally lead to issues if the widget is strictly tailored to Overseerr's exact schema.
