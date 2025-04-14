import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './routes'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { AuthProvider } from './context/AuthContext'

// Import service worker registration function
import { registerServiceWorker } from './serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastContainer />
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>,
)

// Register service worker for PWA functionality
// registerServiceWorker(); 