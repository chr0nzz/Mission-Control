# Home Assistant Entity Widget 🏠💡

**Purpose**: Displays the state and selected attributes of a specific entity from your [Home Assistant](https://www.home-assistant.io/) instance. Allows you to integrate sensors, switches, lights, and more into your Mission Control dashboard.

---

## 🖼️ Preview

*(Imagine a screenshot of the HA widget. Example 1: A sensor value. Example 2: A light switch status with an icon.)*

**Example 1: Temperature Sensor**
+---------------------------------+| Living Room Temp. 🌡️           |+---------------------------------+| State: 22.5 °C                  || Last Changed: 5 mins ago        |+---------------------------------+
**Example 2: Light Switch**
+---------------------------------+| Office Light 💡                 |+---------------------------------+| State: on                       || Icon: [mdi:lightbulb-on]        |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                 | Type          | Description                                                                                                                                                           | Required | Default Value | Example                                      |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------- | -------------------------------------------- |
| `ha_url`             | string        | The full URL of your Home Assistant instance (e.g., `http://homeassistant.local:8123`).                                                                               | Yes      | N/A           | `"http://192.168.1.30:8123"`                 |
| `long_lived_token`   | string        | A Long-Lived Access Token from Home Assistant for API authentication. Create one in your HA User Profile -> Security section. **Store securely!** | Yes      | N/A           | `"your_ha_long_lived_access_token"`          |
| `entity_id`          | string        | The full ID of the Home Assistant entity to display (e.g., `sensor.living_room_temperature`, `light.office_desk_lamp`).                                                | Yes      | N/A           | `"sensor.outside_humidity"`                  |
| `custom_label`       | string        | (Optional) A custom friendly name for the widget. If omitted, might use the entity's friendly name or entity ID.                                                      | No       | `""`          | `"Patio Temperature"`                        |
| `show_attributes`    | array of strings | (Optional) A list of specific attributes from the entity to display in addition to its state (e.g., `["battery_level", "last_updated"]`). "*" for all attributes. | No       | `[]` (none)   | `["brightness", "rgb_color"]`                |
| `show_last_changed`  | boolean       | Whether to display the "last_changed" timestamp for the entity's state.                                                                                               | No       | `true`        | `false`                                      |
| `use_entity_icon`    | boolean       | Whether to try and display the entity's icon from Home Assistant (e.g., using MDI icons if HA provides them).                                                         | No       | `true`        | `false`                                      |
| `refresh_interval`   | number        | How often the widget should poll the HA API for updates, in seconds. (See note on real-time updates).                                                                 | No       | `30`          | `60`                                         |
| `use_websocket`      | boolean       | (Advanced) Whether to attempt using Home Assistant's WebSocket API for real-time updates instead of polling. Requires more complex frontend/backend logic.            | No       | `false`       | `true`                                       |

**Note on Real-Time Updates (`use_websocket`)**:
* Home Assistant's WebSocket API provides real-time state updates and is generally preferred over polling the REST API for frequently changing entities.
* Implementing WebSocket support in the widget is more complex. If `use_websocket: false` (or not supported), the widget will poll the REST API at the `refresh_interval`.

---

## 🔌 Data Sources

* **Primary**: Home Assistant API.
    * Accessed via the Mission Control backend proxy to protect your `long_lived_token`.
    * **If polling (REST API)**:
        * The backend uses the `/api/states/<entity_id>` endpoint to fetch the current state and attributes of the specified entity.
    * **If using WebSockets (Advanced)**:
        * The frontend or backend would establish a WebSocket connection to `/api/websocket` on your Home Assistant instance, authenticate, and subscribe to state changes for the specific `entity_id`.

---

## 📡 MQTT Topics

* This widget primarily interacts with the Home Assistant API (REST or WebSocket).
* It would only use MQTT if Home Assistant is configured to publish entity state changes to MQTT (e.g., via its MQTT integration) AND this widget is specifically designed to listen to those MQTT topics (making it behave more like a generic MQTT Subscriber widget tailored for HA's schema).

---

## 💡 Troubleshooting Tips

* **"API Unreachable" / "Invalid Token" / "Entity Not Found"**:
    * Verify `ha_url` is correct and your Home Assistant instance is accessible from the Mission Control backend.
    * Ensure your `long_lived_token` is valid and correctly copied. These tokens are very long.
    * Double-check the `entity_id` is exact (case-sensitive) and exists in your Home Assistant instance (Developer Tools -> States).
* **Data Not Updating / Stale Data**:
    * If polling, check the `refresh_interval`. A longer interval means less frequent updates.
    * If `use_websocket: true` is an option and enabled but not working, there might be issues with the WebSocket connection (check browser console, Mission Control backend logs if it handles the WS). Proxies or network configuration can sometimes interfere with WebSockets.
* **Attributes Not Displaying**:
    * If `show_attributes` is configured, ensure the attribute names are correct for the entity. You can see available attributes in HA's Developer Tools -> States for that entity.
* **Icons Not Displaying**:
    * `use_entity_icon: true` relies on Home Assistant providing an icon name (often an MDI icon like `mdi:thermometer`) and the Mission Control frontend having a way to render these (e.g., by including the Material Design Icons font/library).
