# 🚀 Welcome to Mission Control Dashboard! 🧑‍💻

Mission Control is your personal, self-hostable dashboard designed to give you a bird's-eye view and quick insights into your homelab services and digital environment. Think of it as your central command center, bringing together all the vital information you need in one sleek, modern, and highly customizable interface.

## ✨ Purpose & Philosophy

In the world of self-hosting and homelabbing, managing multiple services can become complex. Mission Control aims to simplify this by:

* **Consolidating Information**: Display data from various services (like system monitors, media servers, download clients, and more) in one place.
* **Providing Quick Insights**: Get at-a-glance status updates and key metrics without needing to log into each service individually.
* **Empowering Customization**: Tailor the dashboard to your exact needs with a flexible widget system and on-page editing.
* **Prioritizing User Control**: Configurations are managed via simple YAML files, giving you full ownership and easy backup/version control.
* **Ensuring Local Focus**: Designed for local network use, keeping your data private and secure within your own environment.

## 🌟 Key Features

* **🧩 Versatile Widget System**: A wide array of built-in widgets for popular self-hosted services, plus the ability to create your own!
* **🖌️ On-Page Customization**: Intuitively add, remove, reorder, and resize widgets using a drag-and-drop interface. Configure widget options directly on the page.
* **📄 YAML Configuration**: `settings.yml` for app-wide settings and `dashboard.yml` for layout and widget definitions. Human-readable and easy to manage.
* **🗄️ SQLite Persistence**: Widget layouts and certain cached data are stored locally in an SQLite database.
* **📡 MQTT Real-Time Updates**: Widgets can receive live data updates via MQTT, keeping your dashboard fresh without constant polling.
* **🐳 Dockerized Deployment**: Easy setup and management with Docker and Docker Compose.
* **🔐 No User Authentication (Local Use)**: Simplified access for your personal homelab.
* **🎨 Theming**: Light, dark, and auto modes, plus support for custom CSS.

## 🖼️ Sneak Peek!

*(Imagine a beautiful screenshot of a well-configured Mission Control dashboard here, showcasing various widgets like Glances, Sonarr, weather, etc.)*

+---------------------------------------------------------------------------------+
| 🚀 Mission Control                                                              |
+---------------------------------------------------------------------------------+
| System Monitoring 💻                      | Media Hub 🎬                       |
| +---------------------------------------+ | +----------------------------------+ |
| | Glances CPU: 25%  RAM: 4GB/16GB     | | | Sonarr: Upcoming Shows           | |
| | Load: 0.5, 0.8, 1.2                 | | | - Show A S01E05 (Tonight)        | |
| | Network: eth0 Up:10Mbps Down:50Mbps | | | - Show B S02E01 (Tomorrow)       | |
| +---------------------------------------+ | +----------------------------------+ |
| | Docker Containers: 5 Running        | | | Radarr: Downloading              | |
| | - container_a (Up)                  | | | - Movie X (75%, 2MB/s)           | |
| | - container_b (Up)                  | | +----------------------------------+ |
| +---------------------------------------+ | Weather: ☀️ 22°C (Feels 24°C)    |
|                                         |   Humidity: 60% Wind: 5km/h      |
+---------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------+| 🚀 Mission Control                                                              |+---------------------------------------------------------------------------------+| System Monitoring 💻                      | Media Hub 🎬                       || +---------------------------------------+ | +----------------------------------+ || | Glances CPU: 25%  RAM: 4GB/16GB     | | | Sonarr: Upcoming Shows           | || | Load: 0.5, 0.8, 1.2                 | | | - Show A S01E05 (Tonight)        | || | Network: eth0 Up:10Mbps Down:50Mbps | | | - Show B S02E01 (Tomorrow)       | || +---------------------------------------+ | +----------------------------------+ || | Docker Containers: 5 Running        | | | Radarr: Downloading              | || | - container_a (Up)                  | | | - Movie X (75%, 2MB/s)           | || | - container_b (Up)                  | | +----------------------------------+ || +---------------------------------------+ | Weather: ☀️ 22°C (Feels 24°C)    ||                                         |   Humidity: 60% Wind: 5km/h      |+---------------------------------------------------------------------------------+
## 📚 Documentation Table of Contents

1.  [✨ Getting Started](./01_getting_started.md) - Introduction, philosophy, and prerequisites.
2.  [🛠️ Installation](./02_installation.md) - How to set up Mission Control using Docker.
3.  [⚙️ Configuration](./03_configuration.md) - Understanding the YAML configuration files.
    * [📄 `settings.yml`](./03_configuration/03_01_settings_yaml.md) - Application-wide settings.
    * [📊 `dashboard.yml`](./03_configuration/03_02_dashboard_yaml.md) - Dashboard layout and widgets.
4.  [🖌️ Dashboard Customization](./04_dashboard_customization.md) - Using the on-page UI editor.
5.  [🧩 Widgets Reference](./05_widgets_reference/index.md) - Detailed guides for all built-in widgets.
6.  [🧑‍💻 Custom Widget Development](./06_custom_widget_development.md) - Learn how to create your own widgets.
7.  [🎨 Theming](./07_theming.md) - Customizing the look and feel.
8.  [📡 MQTT Integration](./08_mqtt_integration.md) - Using MQTT for real-time updates.
9.  [🐛 Troubleshooting](./09_troubleshooting.md) - Common issues and solutions.

Let's get your Mission Control operational! Head over to [✨ Getting Started](./01_getting_started.md) to begin.
