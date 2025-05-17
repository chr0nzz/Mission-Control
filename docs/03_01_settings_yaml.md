# 📄 03.01: `settings.yml` - Application Settings

The `settings.yml` file, located in your `/app_data/config/` directory, controls the general operational parameters of your Mission Control application. These are settings that affect the entire dashboard environment rather than specific widgets or layout defined in `dashboard.yml`.

Below is a breakdown of the typical options you might find in `settings.yml`, along with explanations and examples. Always refer to your `example-config/settings.example.yml` for the most up-to-date structure for your version.

---

## Example `settings.yml` Structure

```yaml
# /app_data/config/settings.yml

# 🌐 Web Server Configuration
port: 3000                            # Port on which the Mission Control web server will listen INSIDE the container.
                                      # This is the second part of the port mapping in docker-compose.yml (e.g., "HOST_PORT:3000").
                                      # If you change this, you must adjust the container port in your docker-compose.yml.

# 🎨 Theme Configuration
theme: "dark"                         # Default theme for the dashboard when first loaded.
                                      # Options:
                                      # - "light": Light theme ☀️
                                      # - "dark": Dark theme 🌙
                                      # - "auto": Automatically selects light/dark based on your OS/browser preference 🌗
                                      # User selection via UI might override this for their session/localStorage.

# 📡 MQTT Broker Configuration
# Used for real-time updates for widgets that support MQTT (e.g., MqttSubscriberWidget).
mqtt:
  broker_url: "ws://localhost:9001"   # REQUIRED if using MQTT: Full URL of your MQTT broker.
                                      # For frontend clients (in browser), this usually needs to be a WebSocket URL (ws:// or wss://).
                                      # Examples:
                                      # - "ws://mosquitto:9001" (if 'mosquitto' is service name in Docker Compose & listens on 9001 for WebSockets)
                                      # - "ws://192.168.1.100:9001" (WebSocket broker on your LAN)
                                      # - "wss://secure.broker.com:9002" (Secure WebSockets)
                                      # If backend also needs to connect (e.g. to publish), it might use mqtt:// or mqtts:// if it can resolve/access that.
                                      # The frontend will primarily use this URL for WebSocket connections.
  username: ""                        # Optional: Username for MQTT broker authentication. Leave blank or remove if none.
  password: ""                        # Optional: Password for MQTT broker authentication. Leave blank or remove if none.
  
  client_id_prefix: "missioncontrol"  # Optional: Prefix for MQTT client IDs. 
                                      # Frontend might generate: missioncontrol_front_xyz123
                                      # Backend (if it connects) might generate: missioncontrol_backend_abc987
  
  enable: true                        # Optional: Explicitly enable (true) or disable (false) MQTT integration. 
                                      # If broker_url is set and this is not present, it's typically assumed to be enabled.

  # --- Advanced TLS/SSL Options for MQTT (primarily for backend client if it uses mqtts://) ---
  # For frontend WSS (Secure WebSockets), the browser handles TLS using its trust store.
  # These options are more for a Node.js backend client connecting via mqtts:// if it needs custom certs.
  # tls_enabled: false                # Set to true if backend client uses mqtts:// and needs custom CA/client certs.
  # ca_file: "mqtt_ca.crt"            # Path (in /app/config) to CA certificate file.
  # cert_file: "mqtt_client.crt"      # Path (in /app/config) to client certificate file.
  # key_file: "mqtt_client.key"       # Path (in /app/config) to client private key file.
  # reject_unauthorized: true         # For backend client: set to false ONLY for testing with self-signed certs.

  # --- MQTT.js specific options (passed through to the client if structured under 'options') ---
  # These apply to the MQTT.js client used by frontend and/or backend.
  # options:                          # Optional: Pass any other MQTT.js specific connection options.
    # keepalive: 60                   # Keepalive interval in seconds (default 60).
    # reconnectPeriod: 5000           # Milliseconds between two reconnect attempts (default 1000 for MQTT.js v4, 5000 for v5).
    # connectTimeout: 10000           # Milliseconds to wait for CONNACK (default 30000 for MQTT.js v4, 10000 for v5).
    # clean: true                     # Clean session flag (default true). Set to false to receive QoS 1/2 messages published while offline.
    # protocolVersion: 5              # Or 4 or 3. Default is 4 for MQTT.js v4, 5 for MQTT.js v5.

# (Optional) Application Title
# This can be displayed in the browser tab or page header if not overridden by dashboard.yml's pageInfo.title.
# app_title: "My Homelab HQ"

# (Optional) Logging Configuration for the Backend
logging:
  level: "info"                     # Logging level for the backend application.
                                      # Options: "error", "warn", "info", "debug", "trace"
                                      # "debug" or "trace" can be helpful for troubleshooting backend issues.

# (Optional) Custom CSS File for Theming
# The application will look for this file in the /app/config directory (mounted from host's ./app_data/config/).
# custom_css_file: "custom.css"       # Defaults to "custom.css" if this key is omitted and the file exists.
                                      # Set to "" (empty string) or false to disable loading custom.css.

# (Optional) Grid Layout Defaults for vue-grid-layout
# If present, DashboardView.vue can use these instead of its hardcoded defaults.
# This allows users to fine-tune the grid behavior globally.
# grid_layout_defaults:
#   cols: # Number of columns for each breakpoint
#     lg: 12
#     md: 10
#     sm: 6
#     xs: 4
#     xxs: 2
#   breakpoints: # Breakpoint widths in pixels (keys must match cols keys)
#     lg: 1200
#     md: 996
#     sm: 768
#     xs: 480
#     xxs: 0
#   row_height: 30 # Default height of a single grid row in pixels
#   margin: [10, 10] # Default margin [horizontal, vertical] in pixels between grid items
🔧 Configuration Keys ExplainedportPurpose: The network port the Mission Control web server listens on inside the Docker container.Data Type: Number (integer)Default: 3000⚠️ Important: This is the internal port. The port you access in your browser is the host port mapped in docker-compose.yml (e.g., in ports: - "3000:3000", the first 3000 is host, second is container). If you change this port value here, you must also change the container part of the port mapping in docker-compose.yml.themePurpose: Sets the default visual theme when the dashboard is first loaded. User selection in the UI might override this using browser localStorage.Data Type: StringOptions: "light", "dark", "auto"Default: "dark"mqttThis section configures the connection to an MQTT broker for real-time features.broker_url (string, required if using MQTT)Purpose: The full URL of your MQTT broker. For frontend connectivity (in browser-based widgets like MQTT Subscriber): this URL must be a WebSocket URL (e.g., ws://your-broker-ip:9001 or wss://your-broker-domain:9002). Browsers cannot make raw TCP connections to the standard MQTT port (1883).Note: Ensure your MQTT broker (e.g., Mosquitto) is configured to listen for WebSocket connections on the specified port.For the backend MQTT client (if it also connects, e.g., to publish data): The backend can use standard MQTT URLs (e.g., mqtt://mosquitto:1883 or mqtts://secure.broker.com:8883) if it can resolve and access the broker on that port (e.g., if they are on the same Docker network). If the backend also needs to use WebSockets, it would use the same ws:// or wss:// URL. The mqttClientService.js (frontend) and mqttService.js (backend) will use this URL.username (string, optional)Purpose: Username for MQTT broker authentication.password (string, optional)Purpose: Password for MQTT broker authentication.client_id_prefix (string, optional)Purpose: A prefix used by the application when generating MQTT client IDs. Helps in identifying Mission Control clients connected to the broker. The frontend and backend clients will typically append unique suffixes to this prefix.Default: "missioncontrol"enable (boolean, optional)Purpose: Explicitly enable (true) or disable (false) MQTT integration. If broker_url is set and this key is absent, MQTT is generally assumed to be enabled.tls_enabled, ca_file, cert_file, key_file, reject_unauthorized (optional)Purpose: Advanced TLS/SSL settings, primarily relevant for the backend's MQTT client if it's connecting to an mqtts:// broker that uses a private CA or requires client certificate authentication. The file paths are relative to /app/config/ inside the container (i.e., they should be placed in your host's ./app_data/config/ directory).For frontend connections using wss:// (Secure WebSockets), TLS is handled by the browser, which must trust the certificate presented by the WebSocket server (your MQTT broker). You typically don't provide CA files or client certs directly to the browser-side JavaScript MQTT client for WSS.options (object, optional)Purpose: Allows passing through specific connection options to the underlying MQTT.js client library (e.g., keepalive, reconnectPeriod, connectTimeout, clean session flag, and protocolVersion). Refer to MQTT.js documentation for available options. This object will be used by both the frontend and backend MQTT clients.app_title (optional)Purpose: A global title for the application. Can be displayed in the browser tab or page header. May be overridden by pageInfo.title in dashboard.yml.Data Type: Stringlogging (optional)level (string, optional)Purpose: Sets the minimum logging level for the backend application (e.g., "error", "warn", "info", "debug", "trace").Default: "info"custom_css_file (optional)Purpose: Specifies the name of a custom CSS file (e.g., custom.css) located in /app/config/ (which is your host's ./app_data/config/) to load for custom theming.Data Type: String or Boolean (false to disable)Default: "custom.css" (the application will attempt to load it if the file exists and this key is not set to false or an empty string).grid_layout_defaults (optional)Purpose: Allows global user configuration of vue-grid-layout parameters. If this section is present, DashboardView.vue can read these values instead of using its hardcoded defaults for the grid system.cols (object): Defines the number of columns for each breakpoint. Keys (e.g., lg, md) must match the keys used in breakpoints.Example: lg: 12, md: 10, sm: 6, xs: 4, xxs: 2breakpoints (object): Defines the pixel widths for each breakpoint. Keys must match cols keys.Example: lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0row_height (number): Default height of a single grid row in pixels.Example: 30margin (array): Default margin [horizontal, vertical] in pixels between grid items.Example: [10, 10]Remember to restart the Mission Control Docker container if it doesn't automatically pick up changes made to settings.yml, especially for settings like port or fundamental
