import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider.jsx'; // Assuming ThemeProvider is now in components and named theme-provider.jsx
import { StateProvider } from './StateContext.jsx'; // Assuming StateContext provides a context/provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StateProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StateProvider>
    </BrowserRouter>
  </React.StrictMode>,
);