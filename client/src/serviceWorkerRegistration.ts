// Service Worker Registration
// This file handles the registration and updates of the service worker

// This function registers a service worker.
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/serviceWorker.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the updated precached content has been fetched,
                  // but the previous service worker will still serve the older
                  // content until all client tabs are closed.
                  console.log('New content is available and will be used when all tabs for this page are closed.');

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
                    if (installingWorker.state === 'installed') {
                      installingWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  });
                } else {
                  // At this point, everything has been precached.
                  // It's the perfect time to display a
                  // "Content is cached for offline use." message.
                  console.log('Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('Error during service worker registration:', error);
        });

      // Handle service worker updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
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