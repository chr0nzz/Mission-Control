# 🧩 Widget Ecosystem

The heart of Mission Control is its modular widget system. Widgets are independent mini-applications that display information and provide controls for your self-hosted services.

### Adding and Managing Widgets

-   🖱️ **Adding Widgets:** Use the "Add Widget" interface (e.g., a button or menu) to browse available system and custom widgets. Select a widget, configure any necessary options (like which service instance to connect to), and add it to your dashboard.
-   ❌ **Removing Widgets:** Each widget instance on your dashboard has an option to remove it.
-   ↔️ **Rearranging & Resizing:** Easily drag and drop widgets to rearrange their positions on the grid. Resize widgets to fit your layout needs. Your layout changes are automatically saved.
-   ✨ **Multiple Instances:** You can add multiple instances of the same widget type, each configured to connect to a different service instance (e.g., two Sonarr widgets for different servers).

### Widget Types

-   📦 **System Widgets:** Widgets that are bundled with Mission Control out-of-the-box, providing core integrations.
-   🛠️ **Custom Widgets:** Widgets created by users to add functionality not included by default. These run in a secure sandboxed environment.

### Icons

Mission Control supports a flexible icon system for widgets:
-   Use icons from popular libraries like Material Design Icons (`mdi-...`) and Simple Icons (`si-...`).
-   Integrate icons from the selfh.st/icons collection (`sh-...`).