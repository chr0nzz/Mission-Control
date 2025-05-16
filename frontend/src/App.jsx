import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import Settings from './Settings.jsx';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  );
}

export default App;