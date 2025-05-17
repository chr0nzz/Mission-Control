# 🖌️🎨 04: Dashboard Customization (On-Page UI Editor)

Mission Control is designed to be highly customizable directly from its user interface! While you can always fine-tune your setup by editing the [`dashboard.yml`](./03_02_dashboard_yaml.md) file, the on-page UI editor provides an intuitive way to manage your widgets and layout without touching any code.

*(Imagine a screenshot/GIF here showing the dashboard with an "Edit Mode" button or similar, and then demonstrating drag-and-drop, widget addition, and configuration modals.)*

## Entering Edit Mode ✨

To start customizing, you'll typically need to enter an "Edit Mode" or "Customize Mode." Look for a button, often with an icon like a pencil ✏️, gear ⚙️, or "Edit Layout," usually located in the dashboard's header or a corner.

Once in Edit Mode, the dashboard will change to reveal controls for managing widgets and sections.

## Customization Actions 🛠️

Here's what you can typically do via the on-page UI:

### 1. Adding New Widgets ➕

* **How**: In Edit Mode, look for an "Add Widget" button (often a `+` icon). This might be per-section or a global button that lets you choose the section.
* **Process**:
    1.  Clicking "Add Widget" will usually open a modal or a drawer displaying a list of all available built-in and registered custom widgets.
    2.  Browse or search for the widget you want to add (e.g., "Sonarr Upcoming," "Glances System Stats").
    3.  Select the widget. You might be immediately prompted to fill in its specific configuration options (like API URL, API key, etc.) in another modal.
    4.  Once configured, the new widget will appear on your dashboard, typically at the end of the chosen section or in a default position.
* *(Screenshot/GIF: Showing the "Add Widget" modal with a list of widgets).*

### 2. Removing Widgets ➖

* **How**: In Edit Mode, each widget should display controls, often an "X" icon, a trash can icon 🗑️, or a "Remove" option in a context menu (e.g., three dots `...` on the widget).
* **Process**: Simply click the remove control for the widget you wish to delete. You might be asked for confirmation.
* *(Screenshot/GIF: Showing a widget with a visible "remove" icon).*

### 3. Reordering Widgets (Drag & Drop) 🔄

* **How**: This is a cornerstone of on-page customization! In Edit Mode, you should be able to click and hold (or tap and hold on touch devices) on a widget and then drag it to a new position.
* **Functionality**:
    * **Within a Section**: Drag widgets up or down within their current section to change their order.
    * **Between Sections/Columns**: Drag a widget from one section or column and drop it into another.
* **Libraries**: This is often powered by libraries like SortableJS, providing a smooth drag-and-drop experience.
* *(Animated GIF: Demonstrating a widget being dragged from one position to another, and between sections).*

### 4. Resizing Widgets ↔️↕️

* **How**: In Edit Mode, widgets that are part of a grid system might display resize handles (e.g., on their corners or edges).
* **Process**: Click and drag these handles to make the widget wider, narrower, taller, or shorter, within the constraints of the grid layout.
* *(Screenshot/GIF: Showing a widget being resized using drag handles).*

### 5. Configuring Existing Widgets ⚙️

* **How**: In Edit Mode (or sometimes even outside of it, depending on design), each widget should have a "Configure," "Settings," or gear icon ⚙️.
* **Process**:
    1.  Click this icon on the widget you want to modify.
    2.  A modal dialog will open, displaying the current configuration options for that specific widget instance (e.g., its API URL, display preferences, refresh interval).
    3.  Make your desired changes in the form fields provided.
    4.  Click "Save" or "Apply." The widget will update with the new settings.
* *(Screenshot/GIF: Showing the configuration modal for a specific widget, like Sonarr, with fields for URL and API key).*

## How Changes are Saved 💾

This is a crucial aspect of Mission Control's design:

* **UI to Backend**: When you make any of the changes described above (add, remove, reorder, resize, configure), the frontend application sends these modifications to the backend API (e.g., to the `POST /api/config` endpoint).
* **Backend to `dashboard.yml`**: The backend server then takes this information and intelligently updates the `dashboard.yml` file on the host system's `app_data/config/` directory.
* **Persistence**: Because the changes are written back to `dashboard.yml`, your customizations are persistent. They will survive browser refreshes, application restarts, and container updates.
* **Source of Truth**: `dashboard.yml` remains the definitive source of truth for your dashboard configuration. The UI is a convenient way to edit it.

This seamless integration of UI-driven customization with YAML file persistence provides the best of both worlds: ease of use for quick changes and the robustness of file-based configuration for power users, backups, and version control.

---

Now that you know how to sculpt your dashboard visually, explore the [🧩 Widgets Reference](./05_widgets_reference/index.md) to see what powerful tools you can add to your Mission Control!
