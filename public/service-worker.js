const CACHE_NAME = 'my-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
  // Add other assets you want to cache
];

// IndexedDB utility functions
const DB_NAME = 'myAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'appStore';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function getFromDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function saveToDB(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).catch((error) => {
      console.error('Failed to cache assets during install:', error);
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.log('Fetch event for ', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Deleting cache: ${cacheName}`); // Add logging
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Taking control of the page');
      return self.clients.claim(); // Take control of the page
    }).then(async () => {
      console.log('Service worker activated and page taken control');
      // Fetch and apply notification settings
      const settings = await getFromDB('notificationSettings');
      if (settings) {
        self.notificationSettings = settings;
        console.log('Notification settings loaded:', self.notificationSettings);
        updatePeriodicSync();
      } else {
        console.error('Notification settings not found');
      }
    }).catch((error) => {
      console.error('Error during service worker activation:', error);
    })
  );

  // Register periodic sync if supported
  if ('periodicSync' in self.registration) {
    console.log('Periodic sync is supported'); // Add logging
    getFromDB('notificationSettings').then((settings) => {
      if (settings && settings.interval) {
        const minInterval = settings.interval * 60 * 1000; // Convert minutes to milliseconds
        if (minInterval > 0 && minInterval <= Number.MAX_SAFE_INTEGER) {
          event.waitUntil(
            self.registration.periodicSync.register('check-product-availability', {
              minInterval: minInterval
            }).then(() => {
              console.log('Periodic sync registered with minInterval:', minInterval);
            }).catch((error) => {
              console.error('Error registering periodic sync:', error);
            })
          );
        } else {
          console.error('Invalid minInterval value:', minInterval);
        }
      } else {
        console.error('Notification settings not found or invalid');
      }
    }).catch((error) => {
      console.error('Error getting notification settings from IndexedDB:', error);
    });
  } else {
    console.warn('Periodic sync is not supported');
  }

  // Conditionally register periodic check using setInterval based on notification settings
  getFromDB('notificationSettings').then((settings) => {
    if (settings && settings.notificationsEnabled) {
      const interval = settings.interval * 60 * 1000; // Convert minutes to milliseconds
      console.log('interval ', interval);
      setInterval(() => {
        console.log('Periodic check for product availability');
        checkProductAvailability();
      }, interval); // Check based on the interval from settings
    }
  }).catch((error) => {
    console.error('Error getting notification settings from IndexedDB:', error);
  });
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-product-availability') {
    console.log('Periodic sync event triggered');
    event.waitUntil(checkProductAvailability());
  }
});

self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data); // Add logging
  if (event.data && event.data.type === 'SET_PROXY_URL') {
    self.PROXY_URL = event.data.proxyUrl;
    console.log('PROXY_URL set to:', self.PROXY_URL);
  } else if (event.data && event.data.type === 'SET_NOTIFICATION_SETTINGS') {
    self.notificationSettings = event.data.settings;
    console.log('Notification settings updated:', self.notificationSettings);
    updatePeriodicSync();
  } else if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    console.log('Test notification triggered'); // Add logging
    self.registration.showNotification('Test Notification', {
      body: 'This is a test notification.',
      icon: '/favicon.svg'
    }).then(() => {
      console.log('Test notification displayed'); // Add logging
    }).catch((error) => {
      console.error('Error displaying test notification:', error); // Add logging
    });
  }
});

async function checkProductAvailability() {
  console.log('Checking product availability...');
  try {
    const productIds = await getFromDB('productIds');
    const showOnlyCRStores = await getFromDB('showOnlyCRStores');
    const previousAvailability = await getFromDB('previousAvailability') || {};

    console.log('Fetched data from IndexedDB:', { productIds, showOnlyCRStores, previousAvailability });

    const chains = ['chain1', 'chain2'];
    const chainNames = {
      chain1: 'Auto Mercado',
      chain2: 'PriceSmart'
    };
    const availabilityPromises = chains.map(async (chain) => {
      const stores = await getStores(chain);
      return fetchAllProductsAvailability(
        chain,
        productIds[chain],
        () => {},
        () => {},
        () => {},
        self.PROXY_URL,
        showOnlyCRStores,
        stores
      );
    });

    const allAvailability = await Promise.all(availabilityPromises);

    const changes = [];
    allAvailability.forEach((availability, index) => {
      const chain = chains[index];
      availability.forEach(product => {
        const previousProduct = previousAvailability[product.productId];
        if (!previousProduct || previousProduct.availableAnywhere !== product.availableAnywhere) {
          changes.push({ ...product, chain });
        }
      });
    });

    console.log("changes ", changes);

    if (changes.length > 0) {
      changes.forEach(change => {
        self.registration.showNotification('Product Availability Update', {
          body: `${change.name} is now ${change.availableAnywhere ? 'available' : 'unavailable'} in ${chainNames[change.chain]}.`,
          icon: change.imageUrl || '/favicon.svg', // Use product image URL or fallback to favicon
          data: {
            url: '/' // Set the data URL to the site URL
          }
        }).then(() => {
          console.log('Product availability notification displayed:', change.name, change.availableAnywhere); // Add logging
        }).catch((error) => {
          console.error('Error displaying product availability notification:', error); // Add logging
        });
      });
    }

    // Save the current availability to IndexedDB for future comparisons
    const newAvailability = {};
    allAvailability.forEach(availability => {
      availability.forEach(product => {
        newAvailability[product.productId] = product;
      });
    });
    await saveToDB('previousAvailability', newAvailability);

  } catch (error) {
    console.error('Error checking product availability:', error);
  }
}

async function getStores(selectedChain) {
  return new Promise((resolve, reject) => {
    fetchStores(selectedChain, resolve, reject, self.PROXY_URL);
  });
}

async function fetchStores(chainId, resolve, reject, PROXY_URL) {
  try {
    if (chainId === 'chain1') {
      const response = await fetch(`${PROXY_URL}/am/stores?chainId=${chainId}`);
      const data = await response.json();
      const storeData = data.data;
      const formattedStores = storeData.map(store => ({
        storeId: store.storeid,
        name: store.store
      }));
      resolve(formattedStores);
    } else if (chainId === 'chain2') {
      const response = await fetch(`${PROXY_URL}/ps/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          { skus: ["755713"] },
          { products: "getProductBySKU", metadata: { channelId: "5dc40d0e-e2c3-4c3b-9ed5-89fd11634e56" } }
        ])
      });
      const data = await response.json();
      const product = data.data.products.results[0];
      if (product && product.masterData && product.masterData.current && product.masterData.current.masterVariant && product.masterData.current.masterVariant.availability && product.masterData.current.masterVariant.availability.channels && product.masterData.current.masterVariant.availability.channels.results) {
        const storeData = product.masterData.current.masterVariant.availability.channels.results;
        const formattedStores = storeData.map(store => ({
          storeId: store.channel.id,
          name: store.channel.nameAllLocales[0].value
        }));
        resolve(formattedStores);
      } else {
        reject('Error fetching stores. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error fetching stores:', error);
    reject('Error fetching stores. Please try again.');
  }
}

async function fetchAllProductsAvailability(selectedChain, productIds, setProducts, setLoading, setError, PROXY_URL, showOnlyCRStores, stores) {
  setLoading(true);
  setError(null);

  const costaRicaStoreNames = ['Llorente', 'Escazú', 'Alajuela', 'Cartago', 'Zapote', 'Heredia', 'Tres Ríos', 'Liberia', 'Santa Ana']; // Add Santa Ana
  const costaRicaStoreIds = stores
    .filter(store => costaRicaStoreNames.includes(store.name))
    .map(store => store.storeId);

  if (selectedChain === 'chain1') {
    return Promise.all(productIds.map(productId => {
      const algoliaRequest = {
        requests: [
          {
            indexName: "Product_CatalogueV2",
            params: `facetFilters=%5B%22productID%3A${productId}%22%5D&facets=%5B%22marca%22%2C%22addedSugarFree%22%2C%22fiberSource%22%2C%22lactoseFree%22%2C%22lfGlutemFree%22%2C%22lfOrganic%22%2C%22lfVegan%22%2C%22lowFat%22%2C%22lowSodium%22%2C%22preservativeFree%22%2C%22sweetenersFree%22%2C%22parentProductid%22%2C%22parentProductid2%22%2C%22parentProductid_URL%22%2C%22catecom%22%5D`,
            clickAnalytics: true
          }
        ]
      };
      return fetch(`${PROXY_URL}/am/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(algoliaRequest)
      }).then(response => response.json());
    }))
      .then(responses => {
        setLoading(false);

        const productList = responses.map(response => {
          const hits = response.results[0].hits;
          if (hits.length > 0) {
            const product = hits[0];
            let availableAnywhere = false;
            for (const storeId in product.storeDetail) {
              if (product.storeDetail[storeId].hasInvontory === 1) {
                availableAnywhere = true;
                break;
              }
            }
            return {
              ...product,
              productId: product.productID,
              name: product.ecomDescription,
              storeDetail: product.storeDetail,
              imageUrl: product.imageUrl,
              availableAnywhere: availableAnywhere
            };
          } else {
            console.warn('No hits found for the product.');
            return null;
          }
        }).filter(product => product !== null);

        const sortedProducts = [...productList].sort((a, b) => {
          if (a.availableAnywhere === b.availableAnywhere) return 0;
          return a.availableAnywhere ? -1 : 1;
        });

        setProducts(sortedProducts);
        return sortedProducts;
      })
      .catch(error => {
        setLoading(false);
        setError('Error fetching product availability. Please try again.');
        console.error('Error checking availability:', error);
        return [];
      });
  } else if (selectedChain === 'chain2') {
    return Promise.all(productIds.map(productId => {
      const requestData = [
        { skus: [productId] },
        { products: "getProductBySKU", metadata: { channelId: "5dc40d0e-e2c3-4c3b-9ed5-89fd11634e56" } }
      ];
      return fetch(`${PROXY_URL}/ps/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }).then(response => response.json());
    }))
      .then(responses => {
        setLoading(false);

        const productList = responses.map(response => {
          const product = response.data.products.results[0];
          console.log('product:', product); // Add this line
          if (product && product.masterData && product.masterData.current && product.masterData.current.masterVariant && product.masterData.current.masterVariant.availability && product.masterData.current.masterVariant.availability.channels && product.masterData.current.masterVariant.availability.channels.results) {
            const storeDetail = {};
            product.masterData.current.masterVariant.availability.channels.results.forEach(store => {
              storeDetail[store.channel.id] = {
                hasInvontory: store.availability.isOnStock ? 1 : 0,
                basePrice: product.masterData.current.masterVariant.price.value.centAmount / 100,
                uomPrice: product.masterData.current.masterVariant.price.value.centAmount / 100,
                havedDiscount: false,
                percentDiscount: 'N/A',
                hall: 'N/A',
                quantity: store.availability.availableQuantity // Add availableQuantity
              };
            });

            const availableAnywhere = showOnlyCRStores
              ? costaRicaStoreIds.some(storeId => storeDetail[storeId] && storeDetail[storeId].hasInvontory === 1)
              : Object.values(storeDetail).some(detail => detail.hasInvontory === 1);

            console.log('availableAnywhere:', availableAnywhere); // Add this line

            return {
              productId: product.masterData.current.masterVariant.sku,
              name: product.masterData.current.name,
              storeDetail: storeDetail,
              imageUrl: product.masterData.current.masterVariant.images[0]?.url || product.masterData.current.masterVariant.attributesRaw.find(attr => attr.name === 'localized_images')?.value[0]['es-CR'] || '',
              availableAnywhere: availableAnywhere,
              basePrice: product.masterData.current.masterVariant.price.value.centAmount / 100
            };
          } else {
            console.warn('No product found.');
            return null;
          }
        }).filter(product => product !== null);

        setProducts(productList);
        return productList;
      })
      .catch(error => {
        setLoading(false);
        setError('Error fetching product availability. Please try again.');
        console.error('Error checking availability:', error);
        return [];
      });
  }
}

async function updatePeriodicSync() {
  if ('periodicSync' in self.registration) {
    try {
      const tags = await self.registration.periodicSync.getTags();
      if (tags.includes('check-product-availability')) {
        await self.registration.periodicSync.unregister('check-product-availability');
      }
      const settings = await getFromDB('notificationSettings');
      if (settings && settings.interval) {
        const minInterval = settings.interval * 60 * 1000; // Convert minutes to milliseconds
        if (minInterval > 0 && minInterval <= Number.MAX_SAFE_INTEGER) {
          await self.registration.periodicSync.register('check-product-availability', {
            minInterval: minInterval
          });
          console.log('Periodic sync updated');
        } else {
          console.error('Invalid minInterval value:', minInterval);
        }
      } else {
        console.error('Notification settings not found or invalid');
      }
    } catch (error) {
      console.error('Error updating periodic sync:', error);
    }
  } else {
    console.warn('Periodic sync is not supported');
  }
}
