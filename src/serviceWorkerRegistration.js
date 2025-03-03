import { getFromDB } from './utils/indexedDB'; // Import getFromDB function

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('App is being served by a service worker in localhost.');
        }).catch(error => {
          console.error('Error during service worker ready in localhost:', error);
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });

    // Add listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      window.deferredPrompt = event;
      // Optionally, show a custom install prompt UI
      console.log('beforeinstallprompt event fired');
    });

    // Set PROXY_URL in the service worker
    navigator.serviceWorker.ready.then(async registration => {
      if (registration.active) {
        console.log('Service worker is active:', registration.active);
        registration.active.postMessage({
          type: 'SET_PROXY_URL',
          proxyUrl: process.env.NODE_ENV === 'production' 
            ? process.env.REACT_APP_PROXY_URL_PROD 
            : process.env.REACT_APP_PROXY_URL
        });

        // Register periodic sync if supported
        if ('periodicSync' in registration) {
          console.log('Periodic sync is supported in this browser.');
          try {
            const settings = await getFromDB('notificationSettings');
            const minInterval = settings.interval * 60 * 1000; // Convert minutes to milliseconds
            if (minInterval > 0 && minInterval <= Number.MAX_SAFE_INTEGER) {
              registration.periodicSync.register('check-product-availability', {
                minInterval: minInterval
              }).then(() => {
                console.log('Periodic sync registered with minInterval:', minInterval);
              }).catch((error) => {
                console.error('Error registering periodic sync:', error);
              });
            } else {
              console.error('Invalid minInterval value:', minInterval);
            }
          } catch (error) {
            console.error('Error getting notification settings from IndexedDB:', error);
          }
        } else {
          console.warn('Periodic sync is not supported in this browser.');
        }
      } else {
        console.warn('Service worker is not active yet.');
      }
    }).catch(error => {
      console.error('Error during service worker ready:', error);
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service worker registered:', registration);
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          console.log('Service worker state changed:', installingWorker.state);
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available.');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Content is cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running offline.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
