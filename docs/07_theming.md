# 🎨🖌️ 07: Theming

Mission Control allows you to customize its appearance to suit your preferences, offering built-in themes and the ability to apply your own custom styles.

## 🌈 Built-in Themes

Mission Control comes with a few standard themes that you can easily switch between:

* **☀️ Light Theme**: A bright, clean interface, typically with dark text on a light background.
* **🌙 Dark Theme**: A darker interface, often with light text on a dark background, which can be easier on the eyes in low-light environments.
* **🌗 Auto Theme**: This smart mode attempts to automatically match your operating system's (or browser's) current light/dark mode preference. If your OS is set to dark mode, Mission Control will use its dark theme, and vice-versa.

### Switching Themes

You can switch themes directly from the Mission Control UI:

1.  Look for a **Theme Switcher** icon (e.g., a sun/moon icon ☀️/🌙) in the main application header (see `App.vue`).
2.  Clicking this icon will typically cycle through the available themes (Light <-> Dark). The "Auto" mode is usually set as the initial default based on `settings.yml` or browser preference, and then manual toggling switches between explicit light/dark.
3.  The change should apply immediately by adding or removing a `dark` class on the `<html>` element and storing your preference in the browser's `localStorage`.

Your preferred theme choice is stored in your browser's `localStorage` (key: `mission_control_theme`) and will be remembered for your next session. The default theme when you first load the application (before any user selection via UI, or if `localStorage` is empty) is configured in `settings.yml` via the `theme:` key.

## 💅 Custom CSS Overrides

For more advanced visual customization, Mission Control allows you to apply your own CSS styles. This is perfect for:

* Tweaking specific colors or fonts.
* Adjusting spacing or layout of elements.
* Creating a completely unique look and feel.

### How it Works

1.  **Create `custom.css`**:
    * In your `app_data/config/` directory (the same place where `settings.yml` and `dashboard.yml` reside), create a file named `custom.css`.
    * If you wish to use a different filename, you might be able to specify it in `settings.yml` via the `custom_css_file` key (check your `settings.yml` documentation; by default, the application usually looks for `custom.css`).

2.  **Write Your CSS**:
    * Add any valid CSS rules to your `custom.css` file.
    * These styles will be loaded by Mission Control's frontend and applied *after* the default theme styles (managed by Tailwind CSS's dark mode variant) and any other core styles. This allows your custom rules to override them.

3.  **Loading `custom.css`**:
    * The Mission Control frontend (`App.vue` or `index.html`) should include logic to dynamically load this `custom.css` file if it exists. This is typically done by checking for the file's presence and then injecting a `<link>` tag into the document's `<head>`.
    * After saving changes to `custom.css`, you may need to do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) of the Mission Control page in your browser for the new styles to take effect, especially if the frontend caches the presence or absence of the file.

### Example `custom.css`

```css
/* /app_data/config/custom.css */

/* --- Example: Change the main background color for the dark theme --- */
/* Tailwind CSS uses a 'dark' class on the <html> element for dark mode. */
html.dark body {
  background-color: #10101a; /* A custom very dark shade */
}

html:not(.dark) body { /* Example for light theme body */
  background-color: #f0f2f5;
}

/* --- Example: Change the primary accent color (e.g., for Indigo in Tailwind) --- */
/* This requires knowing which CSS variables Tailwind might expose, or overriding specific classes. */
/* If Mission Control's core styles define CSS variables for theming (recommended): */
:root {
  /* --theme-primary-hue: 220; /* Example: Blueish hue */
  /* --theme-primary-saturation: 70%; */
  /* --theme-primary-lightness: 50%; */
  /* --color-primary: hsl(var(--theme-primary-hue) var(--theme-primary-saturation) var(--theme-primary-lightness)); */
}

/* Or target specific Tailwind classes (more brittle, use with caution) */
/* This is generally NOT recommended as Tailwind class names can change or be purged. */
/* .bg-indigo-600 {
  background-color: #009688 !important; /* Teal example */
/* }
.text-indigo-400 {
  color: #4DB6AC !important; /* Lighter Teal example */
/* } */


/* --- Example: Customize widget titles --- */
/* You'll need to inspect the actual HTML structure to get the correct selectors for WidgetWrapper */
.widget-wrapper-content .widget-header h3 {
  font-family: 'Roboto Slab', serif; /* Make sure font is available or imported via @font-face in your custom.css or index.html */
  font-size: 1.05em; /* Slightly larger */
  font-weight: 500;
  /* color: var(--theme-primary-color); */ /* If you defined a CSS variable */
}

html.dark .widget-wrapper-content .widget-header {
    background-color: #2d3748; /* Tailwind's gray-800, slightly lighter than default dark header */
}

/* --- Example: Add more padding to all widget content areas --- */
.widget-wrapper-content .widget-content-area {
  padding: 1.15rem; /* Custom padding */
}

/* --- Example: Style the SectionHeaderWidget specifically --- */
/* Assuming SectionHeaderWidget's title has class .widget-title */
.section-header-widget .widget-title {
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 600;
}
html.dark .section-header-widget hr {
    border-color: #4a5568; /* Tailwind's gray-600 for dark theme divider */
}
html:not(.dark) .section-header-widget hr {
    border-color: #cbd5e0; /* Tailwind's gray-300 for light theme divider */
}

/* --- Example: Import and use a custom font --- */
/* @import url('[https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap](https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap)'); */
/* body, #mission-control-app {
  font-family: 'Roboto Slab', serif;
} */
Key CSS Variables for Theming (If Implemented by Core App)Mission Control uses Tailwind CSS. While Tailwind is utility-first, a well-structured application built with it can expose CSS Custom Properties (variables) for key themeable aspects. This makes global theming via custom.css much cleaner and more robust than overriding utility classes.Inspect your browser's developer tools on the Mission Control elements (especially the <html> or <body> tags) to see which CSS variables might be available for overriding. Common variables might include:--mc-bg-primary / --mc-bg-secondary (Background colors)--mc-text-primary / --mc-text-secondary / --mc-text-accent (Text colors)--mc-accent-color (Primary accent color for buttons, links, highlights)--mc-border-color--mc-widget-bg--mc-widget-header-bg--font-sans / --font-serif / --font-mono (Font families)Example of overriding such CSS variables in custom.css:/* In your custom.css */
html { /* Base overrides, or specific to html.light */
  --mc-accent-color: #d97706; /* Amber 600 */
  --mc-widget-bg: #f9fafb;    /* Gray 50 */
}

html.dark {
  --mc-accent-color: #f59e0b; /* Amber 500 */
  --mc-widget-bg: #1f2937;    /* Gray 800 */
  --mc-text-primary: #e5e7eb; /* Gray 200 */
}
Tips for Custom CSS:Browser Developer Tools: Use "Inspect Element" to find the CSS selectors of elements you want to change and to see which styles are currently applied. This is your best friend for custom theming.Specificity: Be mindful of CSS specificity. Your custom rules might need to be more specific or, as a last resort, use !important to override default theme or Tailwind utility classes. Try to avoid !important if possible by using more specific selectors or targeting CSS variables.Test Across Themes: If you're making changes, test them in both light and dark mode (and also in "auto" mode by changing your OS preference) to ensure they look good and don't have unintended consequences.Backup: Always keep a copy of your custom.css before
