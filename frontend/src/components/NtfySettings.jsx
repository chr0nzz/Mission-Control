import { useState } from 'react';

export default function NtfySettings() {
  const [ntfyConfig, setNtfyConfig] = useState({
    serverUrl: '',
    username: '',
    password: '',
  });

  return (
    <div>
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
  );
}