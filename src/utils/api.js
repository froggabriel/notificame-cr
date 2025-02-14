import axios from 'axios';

const ALGOLIA_API_KEY = process.env.REACT_APP_ALGOLIA_API_KEY;
const ALGOLIA_APP_ID = process.env.REACT_APP_ALGOLIA_APP_ID;

export const fetchStores = async (chainId, setStores, setError, PROXY_URL) => {
    try {
        if (chainId === 'chain1') {
            const response = await axios.get(`${PROXY_URL}/stores?chainId=${chainId}`);
            const storeData = response.data.data;
            const formattedStores = storeData.map(store => ({
                storeId: store.storeid,
                name: store.store
            }));
            setStores(formattedStores);
        } else if (chainId === 'chain2') {
            const response = await axios.post(`${PROXY_URL}/pricesmart-availability`, [
                { skus: ["755713"] },
                { products: "getProductBySKU", metadata: { channelId: "5dc40d0e-e2c3-4c3b-9ed5-89fd11634e56" } }
            ], {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const product = response.data.data.products.results[0];
            if (product && product.masterData && product.masterData.current && product.masterData.current.masterVariant && product.masterData.current.masterVariant.availability && product.masterData.current.masterVariant.availability.channels && product.masterData.current.masterVariant.availability.channels.results) {
                const storeData = product.masterData.current.masterVariant.availability.channels.results;
                const formattedStores = storeData.map(store => ({
                    storeId: store.channel.id,
                    name: store.channel.nameAllLocales[0].value
                }));
                setStores(formattedStores);
            } else {
                setError('Error fetching stores. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error fetching stores:', error);
        setError('Error fetching stores. Please try again.');
    }
};

export const fetchAllProductsAvailability = (selectedChain, productIds, setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL) => {
    setLoading(true);
    setError(null);
    setAvailability({});
    setIsProductAvailable(false);

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
            return axios.post(`${PROXY_URL}/availability`, algoliaRequest, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }))
            .then(responses => {
                setLoading(false);

                const productList = responses.map(response => {
                    const hits = response.data.results[0].hits;
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
            return axios.post(`${PROXY_URL}/pricesmart-availability`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }))
            .then(responses => {
                setLoading(false);

                const productList = responses.map(response => {
                    const product = response.data.data.products.results[0];
                    if (product && product.masterData && product.masterData.current && product.masterData.current.masterVariant && product.masterData.current.masterVariant.availability && product.masterData.current.masterVariant.availability.channels && product.masterData.current.masterVariant.availability.channels.results) {
                        const storeDetail = {};
                        product.masterData.current.masterVariant.availability.channels.results.forEach(store => {
                            storeDetail[store.channel.id] = {
                                hasInvontory: store.isOnStock ? 1 : 0,
                                basePrice: product.masterData.current.masterVariant.price.value.centAmount / 100,
                                uomPrice: product.masterData.current.masterVariant.price.value.centAmount / 100,
                                havedDiscount: false,
                                percentDiscount: 'N/A',
                                hall: 'N/A'
                            };
                        });
                        return {
                            productId: product.id,
                            name: product.masterData.current.name,
                            storeDetail: storeDetail,
                            imageUrl: product.masterData.current.masterVariant.images[0]?.url || product.masterData.current.masterVariant.attributesRaw.find(attr => attr.name === 'localized_images')?.value[0]['es-CR'] || '',
                            availableAnywhere: Object.values(storeDetail).some(detail => detail.hasInvontory === 1)
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
};

export const fetchRecommendedProducts = async (productId, productIds, setRecommendedProducts, setError, setRecommendationStartIndex, PROXY_URL) => {
    try {
        const algoliaRequest = {
            "requests": [{
                "indexName": "Product_CatalogueV2",
                "objectID": productId,
                "queryParameters": { "clickAnalytics": true },
                "model": "related-products",
                "threshold": 0
            }]
        };
        const response = await axios.post(
            `${PROXY_URL}/recommendations`,
            algoliaRequest,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        if (response.data && response.data.results && response.data.results[0].hits) {
            const filteredRecommendations = response.data.results[0].hits.filter(
                (product) => !productIds.includes(product.productID)
            ).map(product => {
                let availableAnywhere = false;
                if (product.storeDetail) {
                    for (const storeId in product.storeDetail) {
                        if (product.storeDetail[storeId].hasInvontory === 1) {
                            availableAnywhere = true;
                            break;
                        }
                    }
                    return { ...product, availableAnywhere };
                }
                return null; // Ensure a value is returned
            }).filter(product => product !== null);

            setRecommendedProducts(filteredRecommendations);
            setRecommendationStartIndex(0);
        } else {
            console.warn("No recommendations found.");
            setRecommendedProducts([]);
        }
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        setError("Error fetching recommended products.");
        setRecommendedProducts([]);
    }
};
