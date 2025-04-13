import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './routes'
import './index.css'

// Import service worker registration function
import { registerServiceWorker } from './serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)

// Register service worker for PWA functionality
registerServiceWorker(); 