import { useTheme } from '@/components/theme-provider.jsx' // Assuming this path is correct for theme context
import { availableDarkVariants, availableAccentColors } from '@/lib/theme-options' // Assuming this path is correct for theme options

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (mode) => {
    setTheme({ ...theme, mode });
  };

  const handleDarkVariantChange = (variant) => {
    setTheme({ ...theme, darkVariant: variant });
  };

  const handleAccentColorChange = (color) => {
    setTheme({ ...theme, accentColor: color });
  };

  return (
    <div>
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
    </div>
  );
}