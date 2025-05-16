import React from 'react';
import DashboardGrid from './DashboardGrid.jsx'; // Assuming DashboardGrid component exists

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Mission Control Dashboard</h1>
      {/* The DashboardGrid component will handle widget layout */}
      <DashboardGrid />
    </div>
  );
}

export default Dashboard;

// This component will represent the main dashboard view.
// It will likely fetch the user's saved layout and widget configurations
// and pass them to the DashboardGrid component.