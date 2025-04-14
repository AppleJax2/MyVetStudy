// Service Worker Registration
// This file handles the registration and updates of the service worker
import { registerSW } from 'virtual:pwa-register'

// This function registers a service worker.
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Use the registerSW function from vite-plugin-pwa
    const updateSW = registerSW({
      onNeedRefresh() {
        // You can show a notification to the user
        const updateNotification = document.createElement('div');
        updateNotification.classList.add('update-notification');
        updateNotification.innerHTML = `
          <div class="update-notification-content">
            <p>A new version is available!</p>
            <button id="update-app-btn">Update Now</button>
          </div>
        `;
        document.body.appendChild(updateNotification);

        // Add event listener to the update button
        document.getElementById('update-app-btn')?.addEventListener('click', () => {
          updateSW(true);
        });
      },
      onOfflineReady() {
        console.log('App is ready for offline use');
      },
      onRegistered(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration?.scope);
      },
      onRegisterError(error) {
        console.error('Error during service worker registration:', error);
      }
    });
  }
};

// This function unregisters any service workers
export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}; 