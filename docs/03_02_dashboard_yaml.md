# 📊 03.02: `dashboard.yml` - Layout & Widgets (Responsive Grid)

The `dashboard.yml` file, located in your `/app_data/config/` directory, is where you define the visual structure and content of your Mission Control dashboard. With the integration of a responsive grid layout system (like `vue-grid-layout`), this file now stores the layout information for different screen sizes (breakpoints).

It dictates which widgets are displayed, their positions (`x`, `y`), dimensions (`w`idth, `h`eight), and their specific configurations (`options`) for each defined breakpoint.

While many changes can be made via the [🖌️ On-Page Customization](./04_dashboard_customization.md) UI (which then updates this file), understanding its structure is key for manual edits or more complex setups.

---

## Example `dashboard.yml` Structure (Responsive Grid)

```yaml
# dashboard.yml

#  Page Information (Optional)
pageInfo:
  title: "🚀 My Responsive Mission Control"
  # icon: "/icons/favicon.png" # Optional

# Responsive Layouts for Widgets
# The 'layouts' key holds an object where each property is a breakpoint (e.g., lg, md, sm).
# Each breakpoint has an array of widget item configurations.
layouts:
  lg: # Layout for large screens (e.g., >= 1200px) - 12 columns by default
    - i: "datetime_widget_main" # Unique ID for the widget instance, also used as 'i' for grid item
      x: 0 # Horizontal position (grid column index, 0-based)
      y: 0 # Vertical position (grid row index, 0-based)
      w: 4 # Width in grid column units
      h: 2 # Height in grid row units
      minW: 2 # Optional: Minimum width in grid units
      minH: 2 # Optional: Minimum height in grid units
      widgetType: "DateTimeWidget" # Corresponds to a registered widget type
      widgetOptions: # Widget-specific configuration
        customLabel: "Current Time & Date"
        dateFormat: '{"weekday":"long", "year":"numeric", "month":"long", "day":"numeric"}' # JSON string for Intl options
        timeFormat: '{"hour":"2-digit", "minute":"2-digit", "second":"2-digit"}'

    - i: "glances_server_1"
      x: 4; y: 0; w: 8; h: 5 # Semicolons for brevity in examples, YAML doesn't need them on same line
      minW: 3; minH: 3
      widgetType: "GlancesWidget"
      widgetOptions:
        customLabel: "Main Server Stats"
        url: "http://your_glances_host:61208"
        metrics_to_display: "cpu,mem,load,fs,network" # Comma-separated string
        refresh_interval: 5

    - i: "section_header_media"
      x: 0; y: 2; w: 12; h: 1
      minH: 1; maxH: 2
      widgetType: "SectionHeaderWidget"
      widgetOptions:
        customLabel: "🎬 Media Hub"
        textAlign: "center"
        textSize: "2xl"
        showDivider: true
        
    - i: "sonarr_upcoming_lg"
      x: 0; y: 3; w: 6; h: 6
      minW: 3; minH: 4
      widgetType: "SonarrWidget"
      widgetOptions:
        customLabel: "Sonarr TV Shows"
        url: "http://your_sonarr_host:8989"
        apiKey: "YOUR_SONARR_API_KEY"
        days_ahead: 7
        show_series_poster: true

    # ... other widgets for 'lg' breakpoint

  md: # Layout for medium screens (e.g., >= 996px) - 10 columns by default
    - {i: "datetime_widget_main", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2, widgetType: "DateTimeWidget", widgetOptions: {customLabel: "Time & Date"}}
    - {i: "glances_server_1", x: 3, y: 0, w: 7, h: 5, minW: 3, minH: 3, widgetType: "GlancesWidget", widgetOptions: {customLabel: "Main Server", url: "http://your_glances_host:61208"}}
    - {i: "section_header_media", x: 0, y: 2, w: 10, h: 1, minH: 1, maxH: 2, widgetType: "SectionHeaderWidget", widgetOptions: {customLabel: "🎬 Media Hub", textAlign: "center", textSize: "xl"}}
    - {i: "sonarr_upcoming_lg", x: 0, y: 3, w: 5, h: 6, minW: 3, minH: 4, widgetType: "SonarrWidget", widgetOptions: {customLabel: "Sonarr", url: "http://your_sonarr_host:8989", apiKey: "YOUR_SONARR_API_KEY"}}
    # ... other widgets for 'md' breakpoint

  sm: # Layout for small screens (e.g., >= 768px) - 6 columns by default
    - {i: "datetime_widget_main", x: 0, y: 0, w: 6, h: 2, widgetType: "DateTimeWidget", widgetOptions: {customLabel: "Time & Date"}}
    - {i: "glances_server_1", x: 0, y: 2, w: 6, h: 4, widgetType: "GlancesWidget", widgetOptions: {url: "http://your_glances_host:61208"}}
    - {i: "section_header_media", x: 0, y: 6, w: 6, h: 1, widgetType: "SectionHeaderWidget", widgetOptions: {customLabel: "Media"}}
    - {i: "sonarr_upcoming_lg", x: 0, y: 7, w: 6, h: 5, widgetType: "SonarrWidget", widgetOptions: {url: "http://your_sonarr_host:8989", apiKey: "YOUR_SONARR_API_KEY"}}
    # ... other widgets for 'sm' breakpoint

  # xs: # Layout for extra-small screens (e.g., >= 480px) - 4 columns
  #   - {i: "datetime_widget_main", x: 0, y: 0, w: 4, h: 2, widgetType: "DateTimeWidget", widgetOptions: {}}
  #   # ... Stack all other widgets full width (w: 4) one below the other

  # xxs: # Layout for very extra-small screens (e.g., < 480px) - 2 columns
  #   - {i: "datetime_widget_main", x: 0, y: 0, w: 2, h: 2, widgetType: "DateTimeWidget", widgetOptions: {}}
  #   # ... Stack all other widgets full width (w: 2) one below the other
🧱 Core Structural ElementspageInfo (Optional)Contains metadata about the dashboard page itself.title (string): Sets the title that appears in the browser tab or window.icon (string, optional): Path to a custom favicon.layouts (Required)This is the main object holding all layout configurations for different screen sizes.Keys: Each key is a breakpoint name (e.g., lg, md, sm, xs, xxs). These names should match the breakpoints defined in the frontend's DashboardView.vue (specifically, the keys of gridBreakpoints and gridColsByBreakpoint).Values: Each value is an array of widget item objects.Widget Item Object (within each breakpoint array)Each object in a breakpoint's layout array defines a single widget instance and its properties for that specific screen size.i (string, required, must be unique across the entire dashboard for a given widget instance)The unique identifier for this widget instance. This ID must be consistent across all breakpoint layouts for the same widget. vue-grid-layout uses this as its item key.Example: "glances_main_server_cpu_usage"x (number, required)The horizontal position of the widget on the grid, starting from column 0.y (number, required)The vertical position of the widget on the grid, starting from row 0.w (number, required)The width of the widget in grid column units.h (number, required)The height of the widget in grid row units (where each row unit's pixel height is defined by rowHeight in vue-grid-layout configuration).minW, minH (number, optional)Minimum width/height in grid units. The widget cannot be resized smaller than this.maxW, maxH (number, optional)Maximum width/height in grid units. The widget cannot be resized larger than this.widgetType (string, required)The type of widget to display (e.g., "GlancesWidget", "SonarrWidget", "SectionHeaderWidget"). This must match a registered widget type in the application.Refer to the 🧩 Widgets Reference for available types.widgetOptions (object, optional but usually needed)A nested object containing key-value pairs specific to the widgetType. These configure the behavior and data source for the widget.Important: Widget options (like API URLs, keys, display preferences) are typically defined once per widget instance (i). While you can technically have different widgetOptions for the same widget i across different breakpoints, it's generally simpler and more common to keep widgetType and widgetOptions consistent for a given i, and only vary the x, y, w, h layout properties per breakpoint. If options need to change (e.g., show less detail on smaller screens), that logic is often best handled inside the widget component based on its current rendered size or by having distinct widget instances for different views.Other vue-grid-layout properties (optional):static (boolean): If true, the item cannot be dragged or resized.isDraggable (boolean): Overrides the grid's global isDraggable for this item.isResizable (boolean): Overrides the grid's global isResizable for this item.💡 Tips for Responsive dashboard.ymlConsistency of i: The i (widget ID) for a specific widget instance must be the same across all breakpoint layouts (lg, md, sm, etc.). This is how vue-grid-layout tracks the same widget across different screen sizes.Define for Key Breakpoints: You don't necessarily need to define a layout for every possible breakpoint if vue-grid-layout can infer smaller layouts from larger ones (though explicit definition gives more control). Typically, define for lg (desktop), md (tablet), and sm (mobile). The application will attempt to generate missing breakpoint layouts based on the 'lg' layout or an empty array if none exist.Start with Largest Breakpoint (lg): Design your ideal desktop layout first. Then, adjust x, y, w, h for smaller breakpoints, often making widgets narrower and taller to fit.minW/minH are Important: Set sensible minimum dimensions for your widgets to ensure they remain usable when resized.Test Responsiveness: After making changes, always test your dashboard by resizing your browser window to see how the layout adapts across the defined breakpoints.On-Page Customization: The UI editor in Mission Control (see 🖌️ Dashboard Customization) will allow you to visually adjust the layout for the currently active breakpoint. These changes will then be saved back to the corresponding breakpoint array in dashboard.yml.By structuring your dashboard.yml with
