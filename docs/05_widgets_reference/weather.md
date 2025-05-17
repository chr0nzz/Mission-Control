# Weather Widget ☀️☁️🌧️

**Purpose**: Displays current weather conditions and a brief forecast for a user-configured location using the [Open-Meteo API](https://open-meteo.com/).

---

## 🖼️ Preview

*(Imagine a screenshot of the Weather widget showing current temperature, weather icon, "feels like" temp, humidity, wind, and a short forecast.)*

+---------------------------------+| Weather: New York ☀️            |+---------------------------------+| Currently: 22°C, Sunny          || Feels Like: 24°C                || Humidity: 60%                   || Wind: 5 km/h WNW                ||---------------------------------|| Forecast:                       || Tomorrow: 🌤️ 25°C / 18°C        || Day After: 🌧️ 20°C / 15°C       |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                  | Type    | Description                                                                                                                              | Required | Default Value | Example                               |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------- |
| `latitude`            | number  | Latitude of the location for weather data (e.g., `40.7128`).                                                                             | Yes      | N/A           | `40.7128`                             |
| `longitude`           | number  | Longitude of the location for weather data (e.g., `-74.0060`).                                                                           | Yes      | N/A           | `-74.0060`                            |
| `location_name`       | string  | (Optional) A friendly name for the location to display in the widget title (e.g., "New York", "Home"). If omitted, might show coords.    | No       | `""`          | `"My City"`                           |
| `units`               | string  | Units for temperature and speed. Options: `"metric"` (Celsius, km/h) or `"imperial"` (Fahrenheit, mph).                                  | No       | `"metric"`    | `"imperial"`                          |
| `show_forecast_days`  | number  | Number of future days to display a brief forecast for (e.g., `0` for none, `1`, `2`, `3`). Max usually 3-5 depending on implementation. | No       | `1`           | `3`                                   |
| `refresh_interval`    | number  | How often the widget should fetch new data, in seconds. Weather data doesn't change too rapidly.                                         | No       | `900` (15 mins) | `1800` (30 mins)                    |
| `timezone`            | string  | Timezone for forecast interpretation (e.g., "America/New_York"). Open-Meteo can auto-detect based on lat/lon if set to `"auto"`.        | No       | `"auto"`      | `"Europe/London"`                     |

---

## 🔌 Data Sources

* **Primary**: [Open-Meteo Free Weather API](https://open-meteo.com/en/docs).
    * Accessed via the Mission Control backend proxy. This is good practice for consistency, potential caching by the backend, and to avoid exposing many direct client requests to Open-Meteo from various users if the dashboard were public (though it's local here).
    * The API is free and does not require an API key for its basic forecast products.
    * Example API call structure (parameters vary based on widget needs):
        `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`

---

## 📡 MQTT Topics

* This widget fetches data from the Open-Meteo API. It would not typically use MQTT unless you have a separate system publishing weather data from Open-Meteo (or another source) to an MQTT topic, and this widget was adapted to listen (making it more like an MQTT Subscriber).

---

## 💡 Troubleshooting Tips

* **"Error Fetching Weather Data" / No Data Displayed**:
    * Verify `latitude` and `longitude` are correct. You can get these from Google Maps or similar tools.
    * Ensure the Mission Control backend container has internet access to reach `api.open-meteo.com`.
    * Check if Open-Meteo service is operational (rarely an issue, but possible).
* **Incorrect Weather Information**:
    * Double-check the `latitude` and `longitude` for accuracy. A slight misconfiguration can point to a different microclimate or region.
    * The `units` setting (`metric` or `imperial`) determines how temperature and speed are displayed.
    * The `timezone` setting can affect daily forecast accuracy if not set correctly or if `"auto"` detection fails for some edge cases.
* **API Rate Limits**:
    * Open-Meteo is generous for non-commercial use, but extremely frequent updates (very low `refresh_interval`) from many widgets could theoretically hit limits. The default refresh intervals are usually conservative.
