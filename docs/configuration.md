# ⚙️ Configuration

Configuration is primarily done through the Mission Control Settings Application, accessible via the dashboard UI. The Settings App provides a user-friendly interface for managing all aspects of your Mission Control instance and its integrations.

### 🌍 Global Settings

Configure application-wide preferences here:
-   🎨 **Theming:** Set the default theme, choose from multiple dark mode options (manual toggle, auto based on OS preference, different dark gray backgrounds), and select your preferred accent color from a wide palette.
-   🔔 **NTfy Server:** Configure the URL and any necessary authentication credentials for your self-hosted NTfy server to enable system notifications.
-   💾 **Backup & Restore:** Access options to easily create backups of your Mission Control data (dashboard layouts, widget configurations, service credentials) and restore from a previous backup.

### 🔌 Service Configuration

Manage connections to your various self-hosted applications and services:
-   Add, edit, and delete configurations for each service type (e.g., Sonarr, Radarr, Home Assistant, Plex, etc.).
-   For each service, you can configure one or more **instances** (e.g., "Sonarr Main", "Sonarr 4K"), each with its own unique URL and API key/credentials.
-   Test connections to ensure Mission Control can communicate with your services.
-   **🔒 Security Note:** All API keys and sensitive credentials entered here are encrypted and stored securely on the backend. They are never exposed directly to the frontend.

### 📦 Custom Widget Management

Extend Mission Control's functionality by adding your own custom widgets:
-   ➕ **Add New Widgets:** Easily install custom widgets by uploading a ZIP file containing the widget code or by providing a Git repository URL.
-   📋 **View Installed Widgets:** See a list of all currently installed custom widgets, including their name, version, and description from their manifest file.
-   🗑️ **Delete Widgets:** Remove custom widgets you no longer need.
-   🛡️ **Permissions (Future):** Manage specific permissions requested by custom widgets (e.g., permission to send notifications or access certain APIs) for enhanced security.