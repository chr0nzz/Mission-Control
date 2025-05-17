# ⚙️ 03: Configuration Overview

Mission Control's power and flexibility come from its simple yet effective YAML-based configuration system. This approach allows for human-readable settings, easy backups, version control (if you wish to use Git for your `app_data/config` directory), and both UI-driven and manual adjustments.

All your live configuration files reside in the `/app_data/config/` directory (which you mounted as a volume during [🛠️ Installation](./02_installation.md)).

## 📜 Main Configuration Files

There are two primary YAML files that you'll interact with:

1.  **`settings.yml`**:
    * **Purpose**: Contains general application settings. This includes how Mission Control itself behaves, such as its network port, theme preferences, and connection details for shared services like an MQTT broker.
    * **Details**: See [📄 `settings.yml` Deep Dive](./03_01_settings_yaml.md)

2.  **`dashboard.yml`**:
    * **Purpose**: Defines the heart of your dashboard – its layout and the widgets it displays. This is where you'll specify which widgets to show, how they are arranged in sections and columns, and their individual options (like API endpoints for services they connect to).
    * **Details**: See [📊 `dashboard.yml` Deep Dive](./03_02_dashboard_yaml.md)

## ✍️ Editing Configuration Files

You have two main ways to modify your Mission Control configuration:

1.  **On-Page UI Customization (Recommended for Layout & Widget Options)**:
    * Mission Control provides an intuitive user interface for adding, removing, reordering, resizing, and configuring widgets directly on the dashboard.
    * When you make changes through the UI, these modifications are sent to the backend, which then updates your `dashboard.yml` file automatically.
    * This is the preferred method for most day-to-day dashboard adjustments.
    * Learn more: [🖌️ Dashboard Customization](./04_dashboard_customization.md)

2.  **Manual YAML Editing (For `settings.yml` and Advanced `dashboard.yml` Tweaks)**:
    * You can directly edit the `settings.yml` and `dashboard.yml` files using any text editor.
    * This is necessary for changing settings in `settings.yml` (like the MQTT broker URL or application port).
    * It can also be used for advanced `dashboard.yml` modifications or if you prefer to manage your entire configuration as code.
    * **⚠️ Important**: If you manually edit `dashboard.yml` while the application is running, the application might need to be reloaded or restarted for changes to take full effect, or it might dynamically reload (if this feature is implemented). Always make a backup before significant manual edits if you're unsure!

## ✨ Dynamic Reloading (If Supported)

Ideally, Mission Control's backend will watch for changes in the YAML configuration files. If changes are detected (especially in `dashboard.yml`), it may attempt to dynamically reload the configuration without requiring a full application restart. This enhances the user experience, particularly when making manual edits. Check the specific features of your Mission Control version for details on dynamic reloading capabilities.

## 📂 Example Configurations

The `example-config/` directory in the project provides `settings.example.yml` and `dashboard.example.yml`. These are your starting templates and are invaluable for understanding the structure and available options. When you first set up Mission Control, you copied these to your `app_data/config/` directory as `settings.yml` and `dashboard.yml`.

Always refer back to the examples if you're unsure about syntax or how to structure a particular piece of configuration.

---

Ready to dive deeper?

* Learn about application-wide settings: [📄 `settings.yml` Deep Dive](./03_01_settings_yaml.md)
* Master your dashboard layout and widgets: [📊 `dashboard.yml` Deep Dive](./03_02_dashboard_yaml.md)
