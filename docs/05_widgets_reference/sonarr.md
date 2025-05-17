# Sonarr Upcoming Widget 📺🗓️

**Purpose**: Displays a list of upcoming TV show episodes from your [Sonarr](https://sonarr.tv/) instance, helping you keep track of what's airing soon.

---

## 🖼️ Preview

*(Imagine a screenshot of the Sonarr widget showing a list of TV shows with episode numbers, titles, and air dates.)*

+--------------------------------------+| Sonarr: Upcoming TV 📺🗓️             |+--------------------------------------+|  giugno 20, 2024                     ||   The Boys S04E05                    ||     "Beware of the Jabberwock, My Son"|| giugno 21, 2024                     ||   House of the Dragon S02E02         ||     "Episode Title Here"             ||   My Hero Academia S07E08            ||     "Two Flashfires"                 |+--------------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                  | Type    | Description                                                                                                | Required | Default Value | Example                               |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------- |
| `url`                 | string  | The full URL of your Sonarr instance (e.g., `http://sonarr_host:8989`).                                    | Yes      | N/A           | `"http://192.168.1.20:8989"`          |
| `apiKey`              | string  | Your Sonarr API key. Found in Sonarr under Settings -> General -> Security.                                | Yes      | N/A           | `"your_sonarr_api_key_here"`          |
| `days_ahead`          | number  | How many days into the future to fetch upcoming episodes for.                                              | No       | `7`           | `14`                                  |
| `show_series_poster`  | boolean | Whether to attempt to display the series poster/banner alongside the episode information.                    | No       | `false`       | `true`                                |
| `date_format`         | string  | How to format the date (e.g., using Moment.js or similar library tokens).                                  | No       | `"MMMM D, YYYY"` | `"DD/MM/YYYY"`                        |
| `max_items`           | number  | Maximum number of upcoming episodes to display.                                                            | No       | `10`          | `5`                                   |
| `include_unmonitored` | boolean | Whether to include series/episodes that are not monitored in Sonarr.                                       | No       | `false`       | `true`                                |

---

## 🔌 Data Sources

* **Primary**: Sonarr API (v3) - specifically the `/api/v3/calendar` endpoint.
    * Accessed via the Mission Control backend proxy to protect your `apiKey`.
    * The widget requests data for a date range based on the current date and the `days_ahead` option.

---

## 📡 MQTT Topics

* This widget typically polls the Sonarr API via the backend at a regular interval (defined internally by the widget or globally). It generally does not rely on MQTT for updates from Sonarr unless Sonarr itself (or a companion tool) publishes calendar changes to MQTT and the widget is designed to listen.

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Invalid API Key" / "Error Fetching Data"**:
    * Verify the `url` in your widget options is correct and your Sonarr instance is running and accessible from the Mission Control backend.
    * Double-check your `apiKey`. Ensure it's copied correctly from Sonarr (Settings -> General -> API Key).
    * Check for typos in the URL or API key.
    * If Sonarr is behind a reverse proxy, ensure the proxy is configured correctly and that the URL used by the widget is the public-facing URL if Mission Control can't reach the local one.
* **No Episodes Displayed**:
    * Ensure you have upcoming episodes within the `days_ahead` range in Sonarr.
    * Check if the series are monitored in Sonarr (unless `include_unmonitored` is `true`).
* **Posters Not Showing (`show_series_poster: true`)**:
    * This functionality depends on Sonarr providing valid image URLs and the frontend being able to access them.
    * Network issues or ad-blockers (less likely for local content) could interfere.
    * The specific implementation of poster display might vary.
