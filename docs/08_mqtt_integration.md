# 📡🔄 08: MQTT Integration

Mission Control leverages MQTT (Message Queuing Telemetry Transport) to enable real-time data updates for certain widgets and potentially for inter-widget communication. MQTT is a lightweight publish/subscribe messaging protocol, ideal for IoT and real-time data scenarios.

## 🤔 How MQTT is Used in Mission Control

1.  **Real-Time Widget Updates (Frontend Client)**:
    * Widgets like the [📨 MQTT Subscriber Widget](./05_widgets_reference/mqtt_subscriber.md) allow you to subscribe directly to MQTT topics from the frontend.
    * When a new message is published to a subscribed topic on the MQTT broker, the frontend MQTT client (using MQTT.js over WebSockets) receives it instantly (or near-instantly) and the widget updates its display.
    * This is highly efficient for data that changes frequently and unpredictably, as it avoids constant polling from the frontend to the backend.

2.  **Backend Data Publishing & Processing (Backend Client - Potential)**:
    * The Mission Control backend also has an MQTT client (`mqttService.js`). This can be used to:
        * **Publish data**: The backend could poll external services (e.g., a non-MQTT sensor API) and then publish processed data or status changes to specific MQTT topics. Frontend widgets could then subscribe to these backend-published topics.
        * **Subscribe to control topics**: The backend could subscribe to topics to receive commands or triggers from other systems via MQTT.

3.  **Inter-Widget Communication (Advanced/Potential)**:
    * While not a primary design focus for simple widgets, MQTT could theoretically facilitate communication between different widgets on the dashboard if they publish and subscribe to agreed-upon topics.

## ⚙️ Configuring the MQTT Connection

To use MQTT features, Mission Control needs to connect to an MQTT broker. This configuration is done in your `/app_data/config/settings.yml` file:

```yaml
# /app_data/config/settings.yml

mqtt:
  broker_url: "ws://localhost:9001"   # REQUIRED if using MQTT: Full URL of your MQTT broker.
                                      # For frontend clients (in browser), this usually needs to be a WebSocket URL (ws:// or wss://).
  username: ""                        # Optional: Username for MQTT broker authentication.
  password: ""                        # Optional: Password for MQTT broker authentication.
  client_id_prefix: "missioncontrol"  # Optional: Prefix for MQTT client IDs.
  enable: true                        # Optional: Explicitly enable/disable MQTT.
  
  # --- Advanced TLS/SSL Options (Primarily for backend client if it uses mqtts://, or for WSS if broker needs client certs via proxy) ---
  # tls_enabled: false                # Set to true if backend client uses mqtts:// and needs custom CA/client certs, or if WSS needs special handling.
  # ca_file: "mqtt_ca.crt"            # Path (in /app/config) to CA certificate file.
  # cert_file: "mqtt_client.crt"      # Path (in /app/config) to client certificate file.
  # key_file: "mqtt_client.key"       # Path (in /app/config) to client private key file.
  # reject_unauthorized: true         # For backend client: set to false ONLY for testing with self-signed certs.

  # --- MQTT.js specific options (passed through to the client) ---
  # These apply to the MQTT.js client used by frontend and/or backend.
  # options:                          # Optional: Pass any other MQTT.js specific connection options.
    # keepalive: 60                   # Keepalive interval in seconds (default 60).
    # reconnectPeriod: 5000           # Milliseconds between two reconnect attempts.
    # connectTimeout: 10000           # Milliseconds to wait for CONNACK.
    # clean: true                     # Clean session flag (default true).
    # protocolVersion: 5              # Or 4 or 3.


broker_url: This is the most important setting.
For the frontend (browser-based widgets like MQTT Subscriber): This URL must be a WebSocket URL (e.g., ws://your-broker-ip:9001 or wss://your-broker-domain:9002). Browsers cannot make raw TCP connections to the standard MQTT port (1883). Ensure your MQTT broker (e.g., Mosquitto) is configured to listen for WebSocket connections on the specified port.
For the backend MQTT client (mqttService.js): The backend can use standard MQTT URLs (e.g., mqtt://mosquitto:1883 or mqtts://secure.broker.com:8883) if it can resolve and access the broker on that port (e.g., if they are on the same Docker network). If the backend also needs to use WebSockets (less common for backend-to-broker), it would use the same ws:// or wss:// URL. Both the frontend mqttClientService.js and backend mqttService.js will use this broker_url.
username & password: Provide these if your MQTT broker requires authentication.
client_id_prefix: A prefix used when the application generates client IDs. The frontend and backend clients will typically append unique suffixes to this prefix.
enable: Set to false to completely disable MQTT integration if not needed. Defaults to true if broker_url is present.
TLS/SSL Options (tls_enabled, ca_file, etc.):
These are primarily relevant for the backend's MQTT client if it's connecting to an mqtts:// broker that uses a private CA or requires client certificate authentication. The file paths are relative to /app/config/ inside the container (i.e., they should be placed in your host's ./app_data/config/ directory).
For frontend connections using wss:// (Secure WebSockets), TLS is handled by the browser, which must trust the certificate presented by the WebSocket server (your MQTT broker). You typically don't provide CA files or client certs directly to the browser-side JavaScript MQTT client for WSS connections. The reject_unauthorized option is also more relevant for Node.js clients.
options (MQTT.js specific):
This nested object allows you to pass through any connection options supported by the MQTT.js library, which is used by both the frontend and backend clients. Examples include keepalive, reconnectPeriod, connectTimeout, clean session flag, and protocolVersion.
Important: After changing MQTT settings in settings.yml, a restart of the Mission Control application is usually required for both backend and frontend clients to pick up the new configuration and attempt to (re)connect. The backend might attempt to reinitialize its MQTT client if file watching detects changes to settings.yml and the MQTT settings differ.
🏷️ MQTT Topic Structure
A well-defined and consistent MQTT topic structure is essential. Mission Control might use or recommend conventions like:
For backend publishing data to specific widget instances (if implemented):
mission-control/widget/<widget_id>/data
mission-control/widget/<widget_id>/status
For general service status updates published by the backend (if implemented):
mission-control/service/<service_name>/status
For the generic MQTT Subscriber Widget:
This widget allows you to subscribe to any MQTT topic on your broker. You configure the exact topic directly in the widget's options in dashboard.yml.
Examples: home/sensors/livingroom/temperature, zigbee2mqtt/light/office_desk/state, tele/sonoff_plug/STATE
✨ Using the MQTT Subscriber Widget
The 📨 MQTT Subscriber Widget is your primary tool for displaying custom data from your MQTT broker on the Mission Control dashboard.
Add the Widget: Add an "MQTT Subscriber" widget to your dashboard via the UI editor.
Configure its Options:
customLabel: A friendly name for your widget (e.g., "Office Temperature," "Doorbell Status").
topic: The exact MQTT topic you want to subscribe to (e.g., sensors/office/temperature, home/security/front_door).
json_path (Optional): If the messages on the topic are JSON payloads, you can use dot-notation to extract a specific value (e.g., payload.value, temperature, attributes[0].name). If omitted, the entire payload (or its string representation) is shown.
prefix / suffix (Optional): Text to add before or after the displayed value (e.g., prefix: "Value: ", suffix: " °C").
qos: The Quality of Service level for the subscription (0, 1, or 2).
payload_is_json / pretty_print_json: Hints for displaying full JSON payloads.
Publish Data: Ensure your devices or systems are publishing messages to the configured topic on your MQTT broker.
The widget will then connect (using the global MQTT settings from settings.yml via the frontend mqttClientService) and display the latest message received on that topic.
Broker Options
Mission Control is designed to work with an MQTT broker of your choice.
External Broker (Recommended):
If you already run an MQTT broker (e.g., Mosquitto, EMQX, HiveMQ) for your smart home or other services, configure Mission Control to connect to it via settings.yml. This is the most common and flexible setup.
Ensure your broker is configured to allow WebSocket connections (ws:// or wss://) on a specific port if you want frontend widgets to subscribe directly.
Included Broker (Via Docker Compose):
The example docker-compose.yml provided with Mission Control may include a commented-out service definition for Mosquitto. You can uncomment this to run a Mosquitto broker alongside Mission Control if you don't have one. Remember to configure its mosquitto.conf for WebSocket listeners if needed (e.g., by adding listener 9001 and protocol websockets to its config).
🐛 Troubleshooting MQTT
Connection Issues (Frontend or Backend):
Double-check broker_url, username, and password in settings.yml.
For Frontend: Ensure broker_url is a WebSocket URL (ws:// or wss://) and the port is correct for WebSocket connections on your broker. Check the browser's developer console for WebSocket connection errors.
For Backend: Ensure the broker_url is accessible from the Docker container. Check backend logs for connection errors.
Verify broker logs for connection attempts, authentication errors, or client ID clashes.
Firewall rules might be blocking access to the MQTT ports.
If using wss:// or mqtts:// with custom certificates (mainly for backend), ensure certificate paths and configurations are correct. For wss:// in the browser, the broker's certificate must be trusted by the browser.
Messages Not Appearing in MQTT Subscriber Widget:
Verify the widget is subscribing to the exact same topic (case-sensitive) that messages are being published to. Use an external MQTT client tool (like MQTT Explorer, mosquitto_sub/pub) to inspect topics and messages on your broker.
Check QoS levels and retain flags on both the publisher and the subscriber widget.
If using json_path in the widget, ensure the path is correct for your JSON payload structure.
Application Logs:
Check the Mission Control backend logs (docker logs mission-control) for any MQTT-related errors from the mqttService.js.
Check your browser's
