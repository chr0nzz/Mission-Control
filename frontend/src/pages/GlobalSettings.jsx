import ThemeSettings from '../components/ThemeSettings';
import NtfySettings from '../components/NtfySettings';

export default function GlobalSettings() {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Global Settings</h2>
      <section className="mb-8 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Global Settings</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure application-wide settings like default theme, NTfy server, etc.
        </p>
        <ThemeSettings />
        <NtfySettings />
      </section>
    </div>
  );
}