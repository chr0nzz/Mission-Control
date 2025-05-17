mission-control/
├── docker-compose.yml               # Main Docker Compose file for deployment
├── Dockerfile                       # Dockerfile for building the application image
├── .dockerignore                    # Specifies intentionally untracked files that Docker should ignore
├── package.json                     # Project dependencies and scripts (assuming Node.js backend/frontend)
├── src/frontend/tailwind.config.js  # Configuration file for Tailwind CSS
├── README.md                        # Top-level project README (overview, link to docs/, etc.)
├── example-config/                  # Directory containing example YAML configuration files
│   ├── settings.example.yml         # Example general application settings
│   └── dashboard.example.yml        # Example dashboard layout and widget configurations
├── app_data/                        # Root directory for user's persistent data (mounted, .gitignored)
│   ├── config/                      # User's live YAML files (settings.yml, dashboard.yml, custom.css)
│   │   ├── settings.yml             # (User-created from example)
│   │   ├── dashboard.yml            # (User-created from example)
│   │   └── custom.css               # (User-created, optional)
│   ├── data/                        # Persistent data (SQLite DB, etc.)
│   │   └── mission_control.db       # SQLite database file
│   └── custom_widgets/              # Optional: User-provided custom widget components
│       └── README.md                # Placeholder/guide for custom widgets
├── src/                             # Source code for the application
│   ├── backend/                     # Backend (Node.js/Express or Python/Flask/FastAPI)
│   │   ├── api/                     # API route handlers/controllers
│   │   │   ├── configRoutes.js      # Routes for /api/config
│   │   │   ├── widgetDataRoutes.js  # Routes for /api/widgets/data/:widgetId
│   │   │   └── serviceStatusRoutes.js # Routes for /api/services/status (optional)
│   │   ├── services/                # Business logic and service integrations
│   │   │   ├── yamlService.js       # Handles YAML loading, parsing, validation, saving
│   │   │   ├── dbService.js         # Encapsulates SQLite database interaction logic
│   │   │   ├── mqttService.js       # Backend MQTT client logic
│   │   │   ├── widgetProxyService.js# Handles proxied API calls for widgets
│   │   │   ├── fetchers/            # Specific data fetchers for built-in widgets
│   │   │   │   ├── glancesFetcher.js
│   │   │   │   ├── sonarrFetcher.js
│   │   │   │   └── ...              # Other fetchers
│   │   ├── models/                  # Database models/schemas (if ORM used)
│   │   │   └── WidgetLayout.js      # Example model
│   │   ├── config/                  # Backend-specific configurations or defaults
│   │   │   └── index.js             # e.g., default settings, constants
│   │   ├── app.js                   # Main backend application setup (Express app instance)
│   │   └── server.js                # Script to start HTTP server, initialize services
│   └── frontend/                    # Frontend (Vue.js or React)
│       ├── public/                  # Static assets served directly
│       │   ├── index.html           # Main HTML file for SPA
│       │   ├── favicon.ico
│       │   └── icons/               # Bundled icon sets or custom icons
│       │       └── service-logos/   # e.g., for selfh.st/icons
│       └── src/                     # Frontend source code (to be compiled/bundled)
│           ├── assets/              # Static assets processed by build tool
│           │   ├── styles/          # Global styles, Tailwind imports
│           │   │   ├── main.css     # Main CSS entry (imports Tailwind, custom styles)
│           │   │   └── custom.example.css # Example for user custom CSS
│           │   └── images/          # Any images used in the UI
│           ├── components/          # Reusable Vue/React components
│           │   ├── layout/          # Overall dashboard structure components
│           │   │   ├── DashboardGrid.vue
│           │   │   ├── PageSection.vue
│           │   │   ├── AppHeader.vue
│           │   │   └── AppFooter.vue
│           │   ├── widgets/         # Widget-related components
│           │   │   ├── WidgetWrapper.vue  # Generic wrapper for all widgets
│           │   │   ├── WidgetConfigModal.vue # Modal for configuring widget options
│           │   │   ├── builtin/       # Pre-defined, built-in widget components
│           │   │   │   ├── GlancesWidget.vue
│           │   │   │   ├── SonarrWidget.vue
│           │   │   │   ├── RadarrWidget.vue
│           │   │   │   ├── QBittorrentWidget.vue
│           │   │   │   ├── PiholeWidget.vue
│           │   │   │   ├── UptimeKumaWidget.vue
│           │   │   │   ├── WeatherWidget.vue
│           │   │   │   ├── DateTimeWidget.vue
│           │   │   │   ├── MqttSubscriberWidget.vue
│           │   │   │   ├── DockerWidget.vue
│           │   │   │   └── ...          # Other built-in widget.vue files
│           │   │   └── custom_template/ # Template/example for custom widgets
│           │   │       └── MyCustomWidget.vue.template
│           │   └── common/            # Common, reusable UI elements
│           │       ├── AppButton.vue
│           │       ├── AppModal.vue
│           │       ├── AppIcon.vue
│           │       └── LoadingSpinner.vue
│           ├── services/            # Frontend-specific services
│           │   ├── apiClient.js       # Functions for backend API requests
│           │   ├── mqttClient.js      # Frontend MQTT client setup and management
│           │   └── themeService.js    # Logic for theme switching
│           ├── store/               # Global state management (e.g., Pinia/Vuex, Zustand/Redux)
│           │   ├── index.js           # Main store setup
│           │   ├── configStore.js     # Store module for dashboard config
│           │   └── widgetStore.js     # Store module for widget data/state
│           ├── views/               # Top-level page components
│           │   └── DashboardView.vue  # Main (and likely only) view
│           ├── App.vue              # Root Vue/React component
│           ├── main.js              # Frontend application entry point
│           └── router.js            # Frontend router configuration (if needed)
└── docs/                            # All project documentation (Markdown)
    ├── README.md                    # Main entry point for documentation
    ├── 01_getting_started.md
    ├── 02_installation.md
    ├── 03_configuration.md
    │   ├── 03_01_settings_yaml.md
    │   └── 03_02_dashboard_yaml.md
    ├── 04_dashboard_customization.md
    ├── 05_widgets_reference/
    │   ├── index.md                 # List of all built-in widgets
    │   ├── glances.md
    │   ├── sonarr.md
    │   ├── radarr.md
    │   ├── qbittorrent.md
    │   ├── pihole.md
    │   ├── uptime_kuma.md
    │   ├── weather.md
    │   ├── datetime.md
    │   ├── mqtt_subscriber.md
    │   ├── docker.md
    │   ├── plex_tautulli.md        
    │   ├── home_assistant.md        
    │   └── overseerr.md             
    ├── 06_custom_widget_development.md
    ├── 07_theming.md
    ├── 08_mqtt_integration.md
    └── 09_troubleshooting.md
