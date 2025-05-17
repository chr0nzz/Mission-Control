# Glances System Stats Widget 💻

**Purpose**: Displays comprehensive real-time system metrics from a [Glances](https://nicolargo.github.io/glances/) instance. Perfect for keeping an eye on your server's health.

---

## 🖼️ Preview

*(Imagine a screenshot of the Glances widget showing CPU bars, memory usage, load average, and perhaps network stats.)*

+---------------------------------+| Glances: Main Server 💻         |+---------------------------------+| CPU:  [|||||     ] 25% (4 Cores)|| MEM:  [|||||||   ] 60% (9.6/16GB)|| SWAP: [|         ] 5% (0.5/10GB) || LOAD: 0.65, 0.55, 0.50          || NET (eth0): Up 10Mbps / Dn 50Mbps|| DISK (sda): R 5MB/s / W 1MB/s   |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                 | Type          | Description                                                                                                | Required | Default Value | Example                                    |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------------ |
| `url`                | string        | The base URL of your Glances API (e.g., `http://glances_host:61208`). Do NOT include `/api/..` path here. | Yes      | N/A           | `"http://192.168.1.10:61208"`              |
| `metrics_to_display` | array of strings | Which specific metrics to show. See "Available Metrics" below.                                             | No       | `['cpu', 'mem', 'load', 'network', 'diskio']` (example defaults) | `['cpu', 'mem', 'fs']`                     |
| `network_interface`  | string        | Name of the network interface to display stats for (e.g., `eth0`, `wlan0`). Used if 'network' is in `metrics_to_display`. If omitted, Glances might pick one or show all. | No       | Glances default | `"eth0"`                                   |
| `disk_name`          | string        | Name of the disk/mount point to display I/O for (e.g., `sda`, `nvme0n1`). Used if 'diskio' or 'fs' is in `metrics_to_display`. If omitted, Glances might pick one or show all. | No       | Glances default | `"sda1"`                                   |
| `refresh_interval`   | number        | How often the widget should fetch new data from Glances, in seconds.                                       | No       | `5`           | `10`                                       |
| `glances_api_version`| string        | Version of the Glances API to use (e.g., "3", "4"). Usually defaults to a recent working version.            | No       | `"4"` (or latest supported) | `"3"`                                      |

### Available `metrics_to_display` values (Examples):
These typically correspond to Glances API endpoints or data sections:
* `"cpu"`: CPU utilization (total, per-core if supported by widget).
* `"mem"`: Memory usage (RAM).
* `"swap"`: Swap memory usage.
* `"load"`: System load average (1, 5, 15 min).
* `"network"`: Network throughput for `network_interface` (up/down speed).
* `"diskio"`: Disk I/O activity for `disk_name`.
* `"fs"`: Filesystem usage for `disk_name` (used/total space).
* `"sensors"`: Temperature/voltage/fan speeds (requires Glances to be configured for sensors).
* `"containers"`: Summary of Docker containers if Glances is monitoring them.
* `"processcount"`: Total number of processes.
* `"uptime"`: System uptime.

*(The exact list of supported metrics and their display format will depend on the widget's implementation and the Glances API version.)*

---

## 🔌 Data Sources

* **Primary**: Glances API (accessed via the Mission Control backend proxy).
    * The widget makes requests to endpoints like `/api/{glances_api_version}/cpu`, `/api/{glances_api_version}/mem`, etc., based on the `metrics_to_display` option.
    * The `url` option specifies the base address of your Glances instance.

---

## 📡 MQTT Topics

* This widget typically polls the Glances API directly via the backend. It might not use MQTT by default unless explicitly designed to receive Glances data published to MQTT by another process.

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Error Fetching Data"**:
    * Verify the `url` in your widget options is correct and that your Glances instance is running and accessible from the machine hosting Mission Control (specifically, from the Mission Control backend container).
    * Check network connectivity (firewalls, Docker networking).
    * Ensure the Glances web server is enabled (it usually is by default: `glances -w`).
* **Incorrect Metrics / No Data for Specific Metric**:
    * Ensure the metric names in `metrics_to_display` are valid for your Glances version and the widget's implementation.
    * If `network_interface` or `disk_name` are specified, make sure those names exactly match what Glances reports (case-sensitive). You can find these names in the main Glances UI.
* **Authentication**: The standard Glances API doesn't require authentication by default. If your Glances instance is password-protected (e.g., via a reverse proxy), this widget might not support it directly unless it has options for credentials (which it typically doesn't for simplicity, relying on network-level access control).
