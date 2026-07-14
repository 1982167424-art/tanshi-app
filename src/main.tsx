import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useThemeStore } from './store/useThemeStore';

// Initialize theme before first render
useThemeStore.getState().initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
