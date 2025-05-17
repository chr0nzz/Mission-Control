# Date & Time Widget 📅⏰

**Purpose**: Displays the current date and time, with customizable formatting options. A simple but essential widget for any dashboard.

---

## 🖼️ Preview

*(Imagine a screenshot of the Date & Time widget showing the current date and time formatted nicely.)*

+---------------------------------+| Date & Time 📅⏰                |+---------------------------------+|        June 16, 2024            ||         10:30:45 AM             |+---------------------------------+*Or, with different formatting:*
+---------------------------------+| Date & Time 📅⏰                |+---------------------------------+|        Sunday, 16/06/2024       ||           10:30                 |+---------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name         | Type   | Description                                                                                                                                                                 | Required | Default Value        | Example                               |
| ------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- | ------------------------------------- |
| `dateFormat` | string | Format string for the date display. Uses tokens from a date formatting library (e.g., Moment.js: `YYYY-MM-DD`, `dddd, MMMM Do YYYY`; or `date-fns`: `yyyy-MM-dd`, etc.). | No       | `"MMMM Do, YYYY"`    | `"DD/MM/YYYY"`                        |
| `timeFormat` | string | Format string for the time display. Uses tokens from a date formatting library (e.g., Moment.js: `HH:mm:ss`, `h:mm A`; or `date-fns`: `HH:mm:ss`, etc.).                     | No       | `"h:mm:ss A"`        | `"HH:mm"`                             |
| `timezone`   | string | (Optional) Override the browser's default timezone. Uses IANA timezone names (e.g., "America/New_York", "Europe/Paris"). If omitted, uses the browser's local time.        | No       | Browser's default    | `"UTC"`                               |
| `showDate`   | boolean| Whether to display the date part.                                                                                                                                           | No       | `true`               | `false` (to show time only)           |
| `showTime`   | boolean| Whether to display the time part.                                                                                                                                           | No       | `true`               | `false` (to show date only)           |
| `customLabel`| string | (Optional) A custom label or title for the widget, instead of "Date & Time".                                                                                                | No       | `""` (uses default)  | `"Local Clock"`                       |

**Note on Formatting Tokens**: The specific formatting tokens available will depend on the JavaScript date library used by the frontend (e.g., Moment.js, Day.js, date-fns). Consult the documentation for that library if you need advanced formatting. Common examples:
* `YYYY`: 4-digit year (e.g., 2024)
* `MM`: Month number (01-12)
* `MMMM`: Full month name (e.g., June)
* `DD`: Day of month (01-31)
* `Do`: Day of month with ordinal (e.g., 1st, 2nd)
* `dddd`: Full day name (e.g., Sunday)
* `HH`: Hour in 24-hour format (00-23)
* `hh` or `h`: Hour in 12-hour format (01-12)
* `mm`: Minutes (00-59)
* `ss`: Seconds (00-59)
* `A` or `a`: AM/PM

---

## 🔌 Data Sources

* **Primary**: Frontend system time (JavaScript `Date` object).
    * The widget reads the current time directly from the user's browser/computer.

---

## 📡 MQTT Topics

* This widget does not use MQTT. It relies on the local system clock.

---

## 💡 Troubleshooting Tips

* **Incorrect Time/Date**:
    * The time displayed is based on the clock of the computer viewing the dashboard. If it's incorrect, the system clock itself is likely wrong.
    * If you've set a specific `timezone` option, ensure it's a valid IANA timezone name. An invalid name might cause it to fall back to browser local time or UTC.
* **Formatting Issues**:
    * If the date or time isn't formatted as expected, double-check the `dateFormat` and `timeFormat` strings. Ensure you're using tokens recognized by the underlying date formatting library.
    * Typos in the format strings are common.
* **Widget Not Updating (if time appears frozen)**:
    * This would be highly unusual for a simple clock widget, as they typically update every second using JavaScript timers (`setInterval`). If it's frozen, it might indicate a JavaScript error on the page – check the browser's developer console.
