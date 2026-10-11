import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './assets/styles/index.css'

/**
 * Entry point — only mounts <App />.
 * Configuration lives in vite.config.js (~/src alias, dev server port).
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)