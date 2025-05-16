import { BrowserRouter as Router, Route, NavLink, Routes } from 'react-router-dom';
import GlobalSettings from './pages/GlobalSettings';
import ServiceSettings from './pages/ServiceSettings';
import WidgetSettings from './pages/WidgetSettings';
import BackupRestoreSettings from './pages/BackupRestoreSettings';

export default function Settings() {
  return (
    <Router>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>

        <nav className="mb-4">
          <ul className="flex space-x-4">
            <li>
              <NavLink to="/global" className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                Global
              </NavLink>
            </li>
            <li>
              <NavLink to="/services" className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                Services
              </NavLink>
            </li>
            <li>
              <NavLink to="/widgets" className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                Widgets
              </NavLink>
            </li>
            <li>
              <NavLink to="/backup" className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                Backup & Restore
              </NavLink>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/global" element={<GlobalSettings />} />
          <Route path="/services" element={<ServiceSettings />} />
          <Route path="/widgets" element={<WidgetSettings />} />
          <Route path="/backup" element={<BackupRestoreSettings />} />
        </Routes>
      </div>
    </Router>
  );
}