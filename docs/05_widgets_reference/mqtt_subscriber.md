# MQTT Subscriber Widget 📨📡

**Purpose**: A highly versatile widget that subscribes to a specified MQTT topic and displays the payload of the latest message received. This allows you to integrate and display data from virtually any custom source that can publish to an MQTT broker.

---

## 🖼️ Preview

*(Imagine a screenshot of the MQTT Subscriber widget showing a custom label and a message payload. Example 1: Simple text. Example 2: JSON data or an extracted field.)*

**Example 1: Simple Text Payload**
+---------------------------------+| Doorbell Status 🔔              |+---------------------------------+|         Pressed                 |+---------------------------------+
**Example 2: JSON Payload with `json_path`**
* MQTT Topic: `sensors/livingroom/environment`
* Payload: `{"temperature": 22.5, "humidity": 45.6, "unit": "C"}`
* Widget Option: `json_path: "temperature"`
+---------------------------------+| Living Room Temp 🔥             |+---------------------------------+|         22.5 °C                 |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name             | Type   | Description                                                                                                                                                              | Required | Default Value | Example                                     |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | ------------------------------------------- |
| `label`          | string | A custom display label or title for this widget instance.                                                                                                                | Yes      | N/A           | `"Office Temperature"`                      |
| `topic`          | string | The full MQTT topic to subscribe to (e.g., `home/livingroom/temperature`, `devices/sensor1/status`).                                                                     | Yes      | N/A           | `"sensors/garden/soil_moisture"`            |
| `json_path`      | string | (Optional) If the MQTT message payload is JSON, use this dot-notation path to extract a specific value (e.g., `data.value`, `temperature`, `attributes[0].name`).         | No       | `""` (shows full payload) | `"payload.sensor_value"`                  |
| `suffix`         | string | (Optional) Text to append after the displayed value (e.g., "°C", "%", " Volts"). Useful when `json_path` extracts a raw number.                                          | No       | `""`          | `" %"`                                      |
| `prefix`         | string | (Optional) Text to prepend before the displayed value.                                                                                                                   | No       | `""`          | `"Value: "`                                 |
| `payload_is_json`| boolean| (Optional) Explicitly tell the widget if the payload is JSON, which might enable pretty-printing if `json_path` is not used. Defaults based on parsing attempt.            | No       | `false` (or auto-detect) | `true`                                      |
| `qos`            | number | (Optional) MQTT Quality of Service level for the subscription (0, 1, or 2).                                                                                              | No       | `0`           | `1`                                         |
| `retain_handling`| number | (Optional) MQTT v5 retain handling option. (0: Send retained messages, 1: Send if subscription new, 2: Do not send). Requires MQTT5 broker & client support.              | No       | `0`           | `1`                                         |

---

## 🔌 Data Sources

* **Primary**: MQTT Broker (as configured in `settings.yml`).
    * The frontend MQTT client (e.g., MQTT.js) subscribes to the `topic` specified in the widget options.
    * The widget displays the payload of incoming messages on that topic.

---

## 📡 MQTT Topics

* **Subscribes to**: The topic defined in the `topic` option for this widget instance.

---

## 💡 Troubleshooting Tips

* **No Data Displayed / "Waiting for Message..."**:
    * Verify your Mission Control application is successfully connected to the MQTT broker (check `settings.yml` and application logs if any).
    * Ensure the `topic` in the widget options is spelled correctly and matches exactly (case-sensitive) the topic being published to.
    * Use an external MQTT client tool (like MQTT Explorer, mosquitto_sub) to subscribe to the same topic and verify that messages are actually being published to it on the broker.
    * Check the `qos` level. If publishers use QoS 1 or 2, ensure the broker and client handle it.
* **Incorrect Data / Malformed Display**:
    * If using `json_path`, ensure the path is correct for the structure of your JSON payload. Test the path with a JSON query tool if unsure.
    * If the payload is JSON but `json_path` is not used, the widget might display the raw JSON string. Set `payload_is_json: true` if you want it pretty-printed (widget implementation dependent).
    * The `prefix` and `suffix` options are useful for adding context or units to the displayed data.
* **Retained Messages**:
    * If you expect to see the last known value immediately upon dashboard load (even if no new message is published), ensure the publisher is sending messages with the "retain" flag set on the MQTT broker.
    * The `retain_handling` option (MQTTv5) can influence how retained messages are processed on new subscriptions.
* **Broker Connection Issues**:
    * Refer to [📡 MQTT Integration](./08_mqtt_integration.md) and [🐛 Troubleshooting](./09_troubleshooting.md) for general MQTT connection problems.
