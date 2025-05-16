import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider' // Assuming this path is correct for theme context
import { availableDarkVariants, availableAccentColors } from '@/lib/theme-options' // Assuming this path is correct for theme options

export default function Settings() {
  const { theme, setTheme } = useTheme()

  const [ntfyConfig, setNtfyConfig] = useState({
    serverUrl: '',
    username: '',
    password: '',
  })

  const [widgets, setWidgets] = useState([
    // Example widgets
    { id: 'clock', name: 'Clock', enabled: true },
    { id: 'weather', name: 'Weather', enabled: false },
  ])

  const handleThemeChange = (mode) => {
    setTheme({ ...theme, mode })
  }

  const handleDarkVariantChange = (variant) => {
    setTheme({ ...theme, darkVariant: variant })
  }

  const handleAccentColorChange = (color) => {
    setTheme({ ...theme, accentColor: color })
  }

  const handleWidgetToggle = (id) => {
    const updated = widgets.map(widget =>
      widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
    )
    setWidgets(updated)
    // TODO: Save widget settings to storage
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      {/* Global Settings Section */}
      <section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Global Settings</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure application-wide settings like default theme, NTfy server, etc.
        </p>

        {/* Theme Mode */}
        <div className="mb-4">
          <label htmlFor="theme_mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme Mode
          </label>
          <select
            id="theme_mode"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={theme.mode}
            onChange={(e) => handleThemeChange(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (OS Preference)</option>
          </select>
        </div>

        {/* Dark Variant */}
        {theme.mode === 'dark' && (
          <div className="mb-4">
            <label htmlFor="dark_variant" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark Mode Background
            </label>
            <select
              id="dark_variant"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={theme.darkVariant}
              onChange={(e) => handleDarkVariantChange(e.target.value)}
            >
              {availableDarkVariants.map((variant) => (
                <option key={variant.value} value={variant.value}>
                  {variant.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Accent Colors */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Accent Color</label>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {availableAccentColors.map((color) => (
              <button
                key={color.value}
                className={`h-8 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  theme.accentColor === color.value
                    ? 'ring-blue-500 ring-offset-gray-100 dark:ring-offset-gray-900'
                    : ''
                }`}
                style={{ backgroundColor: color.hex }}
                onClick={() => handleAccentColorChange(color.value)}
                aria-label={`Select ${color.label} accent color`}
              />
            ))}
          </div>
        </div>

        {/* NTfy Server Configuration */}
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            NTfy Server Configuration
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Configure your self-hosted NTfy server details.
          </p>
          <input
            type="text"
            placeholder="Server URL"
            className="block w-full mb-2 px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-600"
            value={ntfyConfig.serverUrl}
            onChange={(e) => setNtfyConfig({ ...ntfyConfig, serverUrl: e.target.value })}
          />
          <input
            type="text"
            placeholder="Username (optional)"
            className="block w-full mb-2 px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-600"
            value={ntfyConfig.username}
            onChange={(e) => setNtfyConfig({ ...ntfyConfig, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password (optional)"
            className="block w-full px-3 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-600"
            value={ntfyConfig.password}
            onChange={(e) => setNtfyConfig({ ...ntfyConfig, password: e.target.value })}
          />
        </div>
      </section>

      {/* Widget Management */}
      <section className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Custom Widgets</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enable or disable custom widgets from the dashboard.
        </p>
        <ul className="space-y-2">
          {widgets.map((widget) => (
            <li key={widget.id} className="flex items-center justify-between p-2 border rounded dark:border-gray-600">
              <span className="text-gray-900 dark:text-white">{widget.name}</span>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  widget.enabled ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                }`}
                onClick={() => handleWidgetToggle(widget.id)}
              >
                {widget.enabled ? 'Disable' : 'Enable'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}