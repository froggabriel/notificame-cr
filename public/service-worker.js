const CACHE_NAME = 'my-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
  // Add other assets you want to cache
];

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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Register periodic sync
  event.waitUntil(
    self.registration.periodicSync.register('check-product-availability', {
      minInterval: 60 * 1000 // 1 minute
    }).then(() => {
      console.log('Periodic sync registered');
    }).catch((error) => {
      console.error('Error registering periodic sync:', error);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Periodic check for product availability
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-product-availability') {
    console.log('Periodic sync event triggered');
    event.waitUntil(checkProductAvailability());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_PROXY_URL') {
    self.PROXY_URL = event.data.proxyUrl;
    console.log('PROXY_URL set to:', self.PROXY_URL);
  }
});

async function checkProductAvailability() {
  console.log('Checking product availability...');
  try {
    const productIds = await getProductIdsFromLocalStorage();
    const selectedChain = await getSelectedChainFromLocalStorage();
    const stores = await getStores(selectedChain);
    const showOnlyCRStores = await getShowOnlyCRStoresFromLocalStorage();

    const availability = await fetchAllProductsAvailability(
      selectedChain,
      productIds[selectedChain],
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      self.PROXY_URL,
      showOnlyCRStores,
      stores
    );

    if (availability.changes.length > 0) {
      availability.changes.forEach(change => {
        self.registration.showNotification('Product Availability Update', {
          body: `${change.productName} is now ${change.status}.`,
          icon: '/favicon.svg'
        });
      });
    } else {
      self.registration.showNotification('Product Availability Update', {
        body: 'No changes in product availability.',
        icon: '/favicon.svg'
      });
    }
  } catch (error) {
    console.error('Error checking product availability:', error);
  }
}

async function getProductIdsFromLocalStorage() {
  return new Promise((resolve) => {
    const productIds = localStorage.getItem('productIds');
    resolve(productIds ? JSON.parse(productIds) : { chain1: [], chain2: [] });
  });
}

async function getSelectedChainFromLocalStorage() {
  return new Promise((resolve) => {
    const selectedChain = localStorage.getItem('selectedChain');
    resolve(selectedChain || 'chain1');
  });
}

async function getShowOnlyCRStoresFromLocalStorage() {
  return new Promise((resolve) => {
    const showOnlyCRStores = localStorage.getItem('showOnlyCRStores');
    resolve(showOnlyCRStores === 'true');
  });
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

async function fetchAllProductsAvailability(selectedChain, productIds, setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL, showOnlyCRStores, stores) {
  setLoading(true);
  setError(null);
  setAvailability({});
  setIsProductAvailable(false);

  const costaRicaStoreNames = ['Llorente', 'Escazú', 'Alajuela', 'Cartago', 'Zapote', 'Heredia', 'Tres Ríos', 'Liberia', 'Santa Ana']; // Add Santa Ana
  const costaRicaStoreIds = stores
    .filter(store => costaRicaStoreNames.includes(store.name))
    .map(store => store.storeId);

  if (selectedChain === 'chain1') {
    Promise.all(productIds.map(productId => {
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
            if (process.env.NODE_ENV === 'development') {
              console.warn('No hits found for the product.');
            }
            return null;
          }
        }).filter(product => product !== null);

        const sortedProducts = [...productList].sort((a, b) => {
          if (a.availableAnywhere === b.availableAnywhere) return 0;
          return a.availableAnywhere ? -1 : 1;
        });

        setProducts(sortedProducts);
      })
      .catch(error => {
        setLoading(false);
        setError('Error fetching product availability. Please try again.');
        console.error('Error checking availability:', error);
      });
  } else if (selectedChain === 'chain2') {
    Promise.all(productIds.map(productId => {
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
          if (process.env.NODE_ENV === 'development') {
            console.log('product:', product); // Add this line
          }
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

            if (process.env.NODE_ENV === 'development') {
              console.log('availableAnywhere:', availableAnywhere); // Add this line
            }

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
      })
      .catch(error => {
        setLoading(false);
        setError('Error fetching product availability. Please try again.');
        console.error('Error checking availability:', error);
      });
  }
}
