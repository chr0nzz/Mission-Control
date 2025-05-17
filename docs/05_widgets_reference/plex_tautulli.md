# Plex/Tautulli Activity Widget 🎬📊

**Purpose**: Displays current streaming activity from your [Plex Media Server](https://www.plex.tv/), often by leveraging the richer data provided by a [Tautulli](https://tautulli.com/) (formerly PlexPy) instance. Shows what's being watched, by whom, on what player, and the progress.

---

## 🖼️ Preview

*(Imagine a screenshot of the widget showing a couple of active Plex streams with user avatars, media posters, titles, player info, and progress bars.)*

+--------------------------------------------------------+| Plex Activity 🎬📊                                     |+--------------------------------------------------------+| [User1Avatar] Movie Title (2023) - 1h 15m / 2h 05m     ||   User: User1, Player: Living Room TV (Plex for LG)    ||   [|||||||||||||||...........] 60%                     ||--------------------------------------------------------|| [User2Avatar] TV Show S02E03 - Title - 20m / 45m       ||   User: User2, Player: Chrome Browser                  ||   [|||||||||.................] 45%                     |+--------------------------------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

This widget might have two modes of operation: Tautulli (preferred for detailed data) or direct Plex API (more basic).

**Common Options:**
| Name                 | Type    | Description                                                              | Required | Default Value | Example        |
| -------------------- | ------- | ------------------------------------------------------------------------ | -------- | ------------- | -------------- |
| `mode`               | string  | Operation mode: `"tautulli"` or `"plex"`.                                | No       | `"tautulli"`  | `"plex"`       |
| `refresh_interval`   | number  | How often the widget should fetch new data, in seconds.                  | No       | `15`          | `30`           |
| `max_streams`        | number  | Maximum number of concurrent streams to display.                         | No       | `5`           | `3`            |
| `show_user_avatar`   | boolean | Whether to attempt to display user avatars.                              | No       | `true`        | `false`        |
| `show_media_poster`  | boolean | Whether to attempt to display media posters.                             | No       | `true`        | `false`        |

**If `mode: "tautulli"`:**
| Name                  | Type   | Description                                                              | Required (for Tautulli mode) | Default Value | Example                               |
| --------------------- | ------ | ------------------------------------------------------------------------ | ---------------------------- | ------------- | ------------------------------------- |
| `tautulli_url`        | string | The full URL of your Tautulli instance (e.g., `http://tautulli_host:8181`). | Yes                          | N/A           | `"http://192.168.1.25:8181"`          |
| `tautulli_apiKey`     | string | Your Tautulli API key. Found in Tautulli under Settings -> Web Interface -> API. | Yes                          | N/A           | `"your_tautulli_api_key"`             |

**If `mode: "plex"` (Direct Plex API - more limited):**
| Name               | Type   | Description                                                              | Required (for Plex mode) | Default Value | Example                               |
| ------------------ | ------ | ------------------------------------------------------------------------ | ------------------------ | ------------- | ------------------------------------- |
| `plex_url`         | string | The full URL of your Plex server (e.g., `http://plex_host:32400`).       | Yes                      | N/A           | `"http://192.168.1.26:32400"`         |
| `plex_token`       | string | Your Plex X-Plex-Token. (How to get your Plex token: [Plex Support Article](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)) | Yes                      | N/A           | `"your_plex_x_plex_token"`            |

---

## 🔌 Data Sources

* **If `mode: "tautulli"` (Recommended)**:
    * **Primary**: Tautulli API.
        * Accessed via the Mission Control backend proxy to protect `tautulli_apiKey`.
        * Common Tautulli API command: `get_activity`.
* **If `mode: "plex"`**:
    * **Primary**: Plex Media Server API.
        * Accessed via the Mission Control backend proxy to protect `plex_token`.
        * Common Plex API endpoint: `/status/sessions`.
    * **Note**: Direct Plex API provides less detailed information compared to Tautulli (e.g., historical data, user-specific stats are Tautulli's strengths). This widget would focus on current sessions.

---

## 📡 MQTT Topics

* This widget typically polls the Tautulli or Plex API via the backend.
* Tautulli supports sending notifications (which could be adapted to MQTT via scripting), but the widget would usually poll for simplicity unless designed for a specific MQTT schema for Plex activity.

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Invalid API Key/Token" / "Error Fetching Data"**:
    * **For Tautulli Mode**:
        * Verify `tautulli_url` and `tautulli_apiKey` are correct.
        * Ensure Tautulli is running and accessible from the Mission Control backend.
        * Check Tautulli logs if issues persist.
    * **For Plex Mode**:
        * Verify `plex_url` and `plex_token` are correct. Getting the Plex token can be tricky; follow Plex's official guide carefully.
        * Ensure your Plex server is running and accessible.
        * Plex tokens can expire or be invalidated.
* **No Streams Displayed**:
    * Ensure there is active streaming activity on your Plex server that Tautulli/Plex can see.
    * Check if Tautulli is correctly connected to your Plex server and logging activity.
* **Avatars/Posters Not Showing**:
    * This depends on the API providing valid image URLs and the frontend being able to access them.
    * Ensure Plex/Tautulli can access metadata and artwork.
* **Data Discrepancies**:
    * Tautulli generally provides more accurate and detailed real-time and historical data than direct Plex API polling for sessions. If data seems off, compare with what Tautulli's own interface shows.
