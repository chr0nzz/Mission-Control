import React from 'react';

// This component will be responsible for dynamically loading
// and rendering the correct widget component based on its type.
// It will handle both system and custom widgets.

function WidgetLoader({ widget }) {
  // Placeholder logic: In a real implementation, this would
  // dynamically import or load the widget component based on widget.type
  // and pass the widget.config as props.

  // For now, just display a placeholder based on the widget type
  if (!widget || !widget.type) {
    return <div>Error: Invalid widget configuration</div>;
  }

  // Example: Render different placeholders based on type
  switch (widget.type) {
    case 'settings':
      // Settings widget is a full page, not typically loaded here, but as an example
      return <div>Settings Widget Placeholder (Should not be in grid)</div>;
    case 'docker':
      return <div>Docker Widget Placeholder</div>;
    case 'weather':
      return <div>Weather Widget Placeholder</div>;
    // Add cases for other system widgets
    case 'custom':
      // For custom widgets, this would involve loading the iframe
      return <div>Custom Widget Placeholder (Type: {widget.type})</div>;
    default:
      return <div>Unknown Widget Type: {widget.type}</div>;
  }
}

export default WidgetLoader;

// This component is crucial for the micro-frontend widget architecture.
// It acts as the bridge between the shell and the individual widget implementations.
// It will need to handle loading logic, error boundaries, and passing down
// necessary props/context (like the SDK for API calls, MQTT client, theme info).