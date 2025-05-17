# Pi-hole Stats Widget 🛡️🚫

**Purpose**: Displays key statistics from your [Pi-hole](https://pi-hole.net/) instance, such as total queries, blocked queries, and block percentage.

---

## 🖼️ Preview

*(Imagine a screenshot of the Pi-hole widget showing DNS query counts, blocked count, and percentage.)*

+---------------------------------+| Pi-hole Stats 🛡️🚫             |+---------------------------------+| DNS Queries Today: 15,678       || Queries Blocked:    3,120 (20%) || Gravity Last Updated:           ||   Sun, Jun 16, 2024, 03:00 AM   || Top Blocked Domain:             ||   ads.example.com (150 hits)    |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                | Type    | Description                                                                                                                               | Required | Default Value   | Example                               |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- | ------------------------------------- |
| `url`               | string  | The URL of your Pi-hole admin interface (e.g., `http://pihole_host/admin`).                                                               | Yes      | N/A             | `"http://192.168.1.23/admin"`         |
| `apiKey`            | string  | Your Pi-hole API token (WEBPASSWORD hash). Found in Pi-hole under Settings -> API / Web interface -> Show API token. **Store securely!** | Yes      | N/A             | `"your_pihole_api_token_hash"`        |
| `show_top_domain`   | boolean | Whether to display the top blocked domain.                                                                                                | No       | `true`          | `false`                               |
| `show_gravity_status`| boolean | Whether to display the last time Gravity (adlists) was updated.                                                                          | No       | `true`          | `false`                               |
| `refresh_interval`  | number  | How often the widget should fetch new data, in seconds.                                                                                   | No       | `60`            | `300` (5 minutes)                     |

**Note on `apiKey`**:
* For Pi-hole v5 and older, this is typically the hashed `WEBPASSWORD` found in `/etc/pihole/setupVars.conf` or shown in the Web UI (Settings -> API -> Show API Token).
* For Pi-hole v6+, the API authentication mechanism might have changed (e.g., session-based or more granular tokens). The widget implementation will need to support the relevant auth method. This documentation assumes the common API token method. **Always consult your Pi-hole version's API documentation.**

---

## 🔌 Data Sources

* **Primary**: Pi-hole API.
    * Accessed via the Mission Control backend proxy to protect your `apiKey`.
    * Common endpoints used:
        * `/admin/api.php?summaryRaw&auth=YOUR_API_TOKEN` (for summary statistics)
        * `/admin/api.php?topItems&auth=YOUR_API_TOKEN` (for top blocked domains)
        * `/admin/api.php?gravity&auth=YOUR_API_TOKEN` (for Gravity status)
    * For Pi-hole v6+, endpoints might be different (e.g., under `/api/v1/...` or similar, check `/api/docs` on your Pi-hole). The widget must be adapted for the correct API version.

---

## 📡 MQTT Topics

* This widget typically polls the Pi-hole API via the backend. Pi-hole itself does not usually publish its stats to MQTT directly.

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Invalid API Key" / "Error Fetching Data"**:
    * Verify the `url` in your widget options is correct (usually ends in `/admin`).
    * Ensure your Pi-hole instance is running and accessible from the Mission Control backend.
    * Double-check your `apiKey`. It's a long hash string. Make sure it's copied exactly.
    * The API key (token) is essentially your Pi-hole's web interface password hashed. If you changed your web password, the API token also changes.
* **No Data Displayed**:
    * Ensure Pi-hole is actively processing DNS queries.
    * If `show_top_domain` is true but no domain shows, it might mean no domains have been blocked recently or the API didn't return one.
* **Pi-hole v6+ Issues**:
    * The Pi-hole API underwent changes with v6. If the widget was designed for v5, it might not work with v6 without updates to use the new API endpoints and authentication. Check the widget's compatibility notes or the project's documentation for Pi-hole v6 support.
