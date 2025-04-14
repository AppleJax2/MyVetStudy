import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './routes'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'

// Import service worker registration function
import { registerServiceWorker } from './serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastContainer />
    <AppRouter />
  </React.StrictMode>,
)

// Register service worker for PWA functionality
registerServiceWorker(); 