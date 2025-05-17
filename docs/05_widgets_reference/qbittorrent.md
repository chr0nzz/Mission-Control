<0x9F><0xA7><0xBD>"># qBittorrent Status Widget <0xF0><0x9F><0xA7><0xBD>

**Purpose**: Displays status information from your [qBittorrent](https://www.qbittorrent.org/) client, such as active torrent count and global transfer speeds.

---

## 🖼️ Preview

*(Imagine a screenshot of the qBittorrent widget showing total download/upload speeds and a count of active torrents. Optionally, a short list of active torrents.)*

+--------------------------------------+| qBittorrent Status ⏬                |+--------------------------------------+| Active Torrents: 5                   || Global DL Speed: 12.5 MB/s           || Global UL Speed: 2.1 MB/s            ||--------------------------------------|| Top Torrents:                        || - MyLinuxISO.distro (76%, 5MB/s)     || - AnotherFile.zip (33%, 2.5MB/s)     |+--------------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                        | Type    | Description                                                                                               | Required | Default Value | Example                               |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------- |
| `url`                       | string  | The URL of your qBittorrent WebUI (e.g., `http://qbittorrent_host:8080`).                                 | Yes      | N/A           | `"http://192.168.1.22:8080"`          |
| `username`                  | string  | Username for qBittorrent WebUI login. Leave blank if authentication is disabled (not recommended).        | No       | `""`          | `"myuser"`                            |
| `password`                  | string  | Password for qBittorrent WebUI login. Handled securely by the backend proxy.                              | No       | `""`          | `"mypassword123"`                     |
| `show_torrent_list_count`   | number  | Number of top active torrents to display in a compact list. Set to `0` to hide the list.                  | No       | `3`           | `5`                                   |
| `torrent_list_filter`       | string  | Filter for the torrent list (e.g., "downloading", "seeding", "active", "all"). Widget specific interpretation. | No       | `"downloading"` | `"active"`                            |
| `refresh_interval`          | number  | How often the widget should fetch new data, in seconds.                                                   | No       | `5`           | `10`                                  |

---

## 🔌 Data Sources

* **Primary**: qBittorrent WebUI API (v2).
    * Accessed via the Mission Control backend proxy. The backend handles authentication using the provided `username` and `password`.
    * Common endpoints used:
        * `/api/v2/auth/login` (for authentication by the backend)
        * `/api/v2/transfer/info` (for global download/upload speeds, active torrent counts)
        * `/api/v2/torrents/info` (for the list of torrents, with filters for status, sorting for top torrents)

---

## 📡 MQTT Topics

* This widget typically polls the qBittorrent API via the backend. It's not common for qBittorrent to publish status updates to MQTT directly.

---

## 💡 Troubleshooting Tips

* **"Login Failed" / "API Unreachable" / "Error Fetching Data"**:
    * Verify the `url` for your qBittorrent WebUI is correct.
    * Ensure the `username` and `password` are correct. Remember that qBittorrent WebUI authentication is separate from your system login.
    * Check that the qBittorrent WebUI is enabled and accessible from the Mission Control backend.
    * Look for qBittorrent settings like "Enable CSRF Protection" or "Enable Host Header Validation" which might interfere if the proxy isn't handling them correctly (though usually the backend proxy should manage this).
* **No Torrents Displayed / Incorrect Speeds**:
    * Ensure qBittorrent has active torrents matching the `torrent_list_filter`.
    * The data is fetched directly from the API; if it seems incorrect, first verify the information in the qBittorrent WebUI itself.
* **Security**:
    * It's highly recommended to use a strong password for your qBittorrent WebUI.
    * Ensure qBittorrent is not exposed directly to the internet unless secured properly (e.g., via VPN or a secure reverse proxy). The widget relies on the backend to handle credentials.
