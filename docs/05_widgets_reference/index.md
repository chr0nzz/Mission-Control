# 🧩📚 05: Widgets Reference - Index

Welcome to the Widgets Reference! This section provides detailed information about all the built-in widgets available in Mission Control. Each widget is designed to integrate with a specific service or provide a particular piece of information to your dashboard.

Click on a widget name below to learn about its purpose, see a preview, understand its configuration options, data sources, and any specific troubleshooting tips.

## 📊 System & Monitoring Widgets

* **[Glances System Stats](./glances.md)** 💻
    * Displays comprehensive system metrics (CPU, RAM, Load, Network, Disk I/O) from a Glances instance.
* **[Docker Containers](./docker.md)** 🐳
    * Lists Docker containers and their status, interacting via a secure Docker socket proxy.
* **[Uptime Kuma Status](./uptime_kuma.md)** ✅⏲️
    * Shows an overview of your Uptime Kuma monitor statuses (up, down, paused).
* **[Pi-hole Stats](./pihole.md)** 🛡️🚫
    * Displays key statistics from your Pi-hole instance (queries, blocked, percentage).

## 🎬 Media & Download Widgets

* **[Sonarr Upcoming](./sonarr.md)** 📺🗓️
    * Shows upcoming TV show episodes from your Sonarr instance.
* **[Radarr Downloads](./radarr.md)** 🎬🔽
    * Lists active movie downloads and their progress from your Radarr instance.
* **[qBittorrent Status](./qbittorrent.md)** <0xF0><0x9F><0xA7><0xBD>
    * Displays active torrents, download/upload speeds from your qBittorrent client.
* **[Plex/Tautulli Activity](./plex_tautulli.md)** 🎬📊
    * Shows current streaming activity from your Plex server, often via Tautulli.
* **[Overseerr Requests](./overseerr.md)** 🙏🎞️
    * Displays pending and approved media requests from Overseerr.

## 🏠 Home Automation & Info Widgets

* **[Home Assistant Entity](./home_assistant.md)** 🏠💡
    * Displays the state and attributes of a specific entity from your Home Assistant instance.
* **[Weather](./weather.md)** ☀️☁️🌧️
    * Shows current weather conditions and a brief forecast for a specified location using Open-Meteo.
* **[Date & Time](./datetime.md)** 📅⏰
    * Displays the current date and time, with customizable formatting.
* **[MQTT Subscriber](./mqtt_subscriber.md)** 📨📡
    * Subscribes to a user-defined MQTT topic and displays the latest message payload. Highly flexible for custom data.

---

Can't find a widget for your favorite service? Consider [🧑‍💻 Developing a Custom Widget](./06_custom_widget_development.md)!
