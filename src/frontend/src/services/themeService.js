// src/frontend/src/services/themeService.js

/**
 * themeService.js
 *
 * Manages the application's theme (light, dark, auto).
 */

const THEME_STORAGE_KEY = 'mission_control_theme';
let currentReactiveTheme = null; // To be set by Vue's reactive system if needed

const themeService = {
  /**
   * Initializes the theme based on stored preference or system setting.
   * Should be called once when the application starts.
   * @param {string} defaultSettingsTheme - The theme specified in settings.yml (e.g., 'light', 'dark', 'auto')
   * @param {import('vue').Ref<string>} [reactiveThemeRef] - Optional Vue ref to keep in sync.
   */
  initTheme(defaultSettingsTheme = 'dark', reactiveThemeRef = null) {
    if (reactiveThemeRef) {
      currentReactiveTheme = reactiveThemeRef;
    }
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = storedTheme || defaultSettingsTheme || 'dark';
    this.setTheme(initialTheme);

    // Listen for OS theme changes if current theme is 'auto'
    if (initialTheme === 'auto') {
      this._osThemeChangeListener = (e) => {
        if (this.getCurrentAppliedTheme() === 'auto') { // Only re-apply if still in auto mode
          this._applyAutoTheme(e.matches);
        }
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this._osThemeChangeListener);
    }
  },

  /**
   * Sets the application theme.
   * @param {'light' | 'dark' | 'auto'} themeName - The name of the theme to apply.
   */
  setTheme(themeName) {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
    if (currentReactiveTheme) {
      currentReactiveTheme.value = themeName;
    }

    // Remove previous listener if any
    if (this._osThemeChangeListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this._osThemeChangeListener);
        this._osThemeChangeListener = null;
    }

    if (themeName === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this._applyAutoTheme(prefersDark);
      // Add new listener for 'auto' mode
      this._osThemeChangeListener = (e) => {
        if (this.getCurrentAppliedTheme() === 'auto') {
            this._applyAutoTheme(e.matches);
        }
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this._osThemeChangeListener);
    } else if (themeName === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else { // 'light'
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    console.log(`[ThemeService] Theme set to: ${themeName}`);
    // Dispatch an event or update a reactive variable if other components need to know directly
    // window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: this.getCurrentAppliedTheme() } }));
  },

  _applyAutoTheme(prefersDark) {
    if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    }
    if (currentReactiveTheme && localStorage.getItem(THEME_STORAGE_KEY) === 'auto') {
        // Update reactive ref to reflect actual applied theme if in auto mode
        // This is tricky, as the 'auto' setting itself is what's stored.
        // The UI might want to show 'auto (dark)' or 'auto (light)'
    }
  },

  /**
   * Gets the currently stored theme preference (light, dark, or auto).
   * @returns {'light' | 'dark' | 'auto'}
   */
  getCurrentStoredTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  },

  /**
   * Gets the theme that is actually applied (resolves 'auto').
   * @returns {'light' | 'dark'}
   */
  getCurrentAppliedTheme() {
    const stored = this.getCurrentStoredTheme();
    if (stored === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return stored;
  },

  /**
   * Toggles between light and dark themes. If current is 'auto', it picks the opposite of the current system theme.
   */
  toggleTheme() {
    const currentApplied = this.getCurrentAppliedTheme();
    this.setTheme(currentApplied === 'dark' ? 'light' : 'dark');
  },

  _osThemeChangeListener: null, // To store the media query listener

  cleanup() {
    if (this._osThemeChangeListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this._osThemeChangeListener);
        this._osThemeChangeListener = null;
    }
  }
};

export default themeService;
