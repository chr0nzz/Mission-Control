# Radarr Downloads Widget 🎬🔽

**Purpose**: Displays a list of currently active movie downloads (and optionally recently completed ones) from your [Radarr](https://radarr.video/) instance.

---

## 🖼️ Preview

*(Imagine a screenshot of the Radarr widget showing a list of movies being downloaded with progress bars, speeds, and ETAs.)*

+-----------------------------------------+| Radarr: Current Downloads 🎬🔽          |+-----------------------------------------+| Dune: Part Two (2024)                   ||   [|||||||||||||     ] 75% (1.2/1.6 GB)  ||   Speed: 5.2 MB/s, ETA: 3m 15s          ||-----------------------------------------|| Godzilla x Kong: The New Empire (2024)  ||   [||||              ] 30% (0.5/1.5 GB)  ||   Speed: 2.1 MB/s, ETA: 12m 40s         |+-----------------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                          | Type    | Description                                                                                                   | Required | Default Value | Example                             |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- | -------- | ------------- | ----------------------------------- |
| `url`                         | string  | The full URL of your Radarr instance (e.g., `http://radarr_host:7878`).                                       | Yes      | N/A           | `"http://192.168.1.21:7878"`        |
| `apiKey`                      | string  | Your Radarr API key. Found in Radarr under Settings -> General -> Security.                                   | Yes      | N/A           | `"your_radarr_api_key_here"`        |
| `show_completed_for_minutes`  | number  | How long (in minutes) to keep displaying recently completed downloads in the list. Set to `0` to hide completed. | No       | `10`          | `5`                                 |
| `max_items`                   | number  | Maximum number of download items to display.                                                                  | No       | `10`          | `3`                                 |
| `include_grabbed`             | boolean | Whether to include items that have been "grabbed" but not yet started downloading (status might be different).  | No       | `true`        | `false`                             |
| `include_importing`           | boolean | Whether to include items that are currently in the "importing" phase after download.                         | No       | `true`        | `false`                             |

---

## 🔌 Data Sources

* **Primary**: Radarr API (v3) - specifically the `/api/v3/queue` endpoint.
    * Accessed via the Mission Control backend proxy to protect your `apiKey`.
    * This endpoint provides details about the download queue, including active, completed, and grabbed items.

---

## 📡 MQTT Topics

* This widget typically polls the Radarr API via the backend. It's unlikely to use MQTT for updates from Radarr unless a specific integration is set up to publish Radarr queue changes to an MQTT topic.

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Invalid API Key" / "Error Fetching Data"**:
    * Verify the `url` in your widget options is correct and your Radarr instance is running and accessible from the Mission Control backend.
    * Double-check your `apiKey`. Ensure it's copied correctly from Radarr (Settings -> General -> API Key).
    * Check for typos in the URL or API key.
    * If Radarr is behind a reverse proxy, ensure it's configured correctly.
* **No Downloads Displayed**:
    * Ensure you have active downloads in Radarr's queue.
    * If you've configured `show_completed_for_minutes` to `0`, completed items won't show.
    * Check the `include_grabbed` and `include_importing` options if you expect to see items in those states.
* **Incorrect Progress/ETA**:
    * The data comes directly from Radarr. If it seems incorrect, check the Radarr UI first.
    * The `refresh_interval` of the widget (if configurable, or a global default) will determine how frequently this data is updated on the dashboard.
