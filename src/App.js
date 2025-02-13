import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Box,
    TextField,
    Button,
    Card,
    CardMedia,
    CardContent,
    Divider,
    IconButton,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import ThemeProviderWrapper, { ThemeContext } from "./ThemeContext";
import { JsonButton, ButtonContainer } from './components/StyledComponents';
import ProductDialog from './components/ProductDialog';
import ProductList from './components/ProductList';
import StoreList from './components/StoreList';
import RecommendedProducts from './components/RecommendedProducts';
import StoreDetailsDialog from './components/StoreDetailsDialog';

function App() {
    const { themeMode, toggleTheme } = useContext(ThemeContext);
    const [stores, setStores] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [productName, setProductName] = useState('');
    const [productImage, setProductImage] = useState('');
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [newProductId, setNewProductId] = useState('');
    const [isProductAvailable, setIsProductAvailable] = useState(false);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [recommendationStartIndex, setRecommendationStartIndex] = useState(0);
    const [selectedProductJson, setSelectedProductJson] = useState(null);
    const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
    const [isStoreDetailsDialogOpen, setIsStoreDetailsDialogOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const PROXY_URL = 'http://localhost:3001';
    const RECOMMENDATIONS_PER_PAGE = 3;

    const [productIds, setProductIds] = useState([
        "6a237f75-d599-ec11-b400-000d3a347b43",
        "1c4d9e75-d599-ec11-b400-000d3a347ca0",
        "e51c8d70-d599-ec11-b400-000d3a3479fe",
        "52f2878d-20c5-4ae6-8963-53f895b9d7d6"
    ]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get(`${PROXY_URL}/stores`);
                const storeData = response.data.data;
                const formattedStores = storeData.map(store => ({
                    storeId: store.storeid,
                    name: store.store
                }));
                setStores(formattedStores);
            } catch (error) {
                console.error('Error fetching stores:', error);
                setError('Error fetching stores. Please try again.');
            }
        };

        fetchStores();

    }, []);

    useEffect(() => {
        if (stores.length > 0 && productIds.length > 0) {
            fetchAllProductsAvailability(productIds);
        }
    }, [stores, productIds]);

    useEffect(() => {
        if (selectedProduct) {
            fetchRecommendedProducts(selectedProduct);
        }
    }, [selectedProduct, productIds]);

    const fetchAllProductsAvailability = (productIds) => {
        setLoading(true);
        setError(null);
        setAvailability({});
        setIsProductAvailable(false);

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
    };

    const setAvailabilityForProduct = (productId, storeDetail, availableAnywhere) => {
        const storeAvailability = {};
        let productAvailableAnywhereVar = false;

        stores.forEach(store => {
            const storeId = store.storeId;
            const detail = storeDetail ? storeDetail[storeId] : null;

            if (detail) {
                storeAvailability[storeId] = {
                    hasInventory: detail.hasInvontory,
                    basePrice: detail.basePrice,
                    uomPrice: detail.uomPrice,
                    havedDiscount: detail.havedDiscount,
                    percentDiscount: detail.percentDiscount,
                    hall: detail.hall
                };
                if (detail.hasInvontory === 1) {
                    productAvailableAnywhereVar = true;
                }
            } else {
                storeAvailability[storeId] = {
                    hasInventory: false,
                    basePrice: 'N/A',
                    uomPrice: 'N/A',
                    havedDiscount: false,
                    percentDiscount: 'N/A',
                    hall: 'N/A'
                };
                console.warn(`Store detail not found for store ID: ${storeId}`);
            }
            setAvailability(storeAvailability);
            if (detail && detail.hasInvontory === 1) {
                productAvailableAnywhereVar = true;
            }
        });

        setIsProductAvailable(productAvailableAnywhereVar);
    };

    const handleProductChange = (event) => {
        const newProductId = event.target.value;
        setSelectedProduct(newProductId);
    };

    useEffect(() => {
        if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0].productId);
        }
    }, [products]);    

    useEffect(() => {
        if (selectedProduct) {
            const selected = products.find(product => product.productId === selectedProduct);
            if (selected) {
                setProductName(selected.name);
                setProductImage(selected.imageUrl);
                setAvailabilityForProduct(selected.productId, selected.storeDetail, selected.availableAnywhere);
                setIsProductAvailable(selected.availableAnywhere);
                setSelectedProductJson(selected);
            } else {
                setSelectedProductJson(null);
            }
        }
    }, [selectedProduct, products]);

    const parseProductIdFromUrl = (url) => {
        const regex = /id\/([a-f0-9-]+)$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const handleAddProduct = () => {
        let productIdToAdd = newProductId;

        // Check if the input is a URL
        if (newProductId.startsWith('https://')) {
            const parsedId = parseProductIdFromUrl(newProductId);
            if (parsedId) {
                productIdToAdd = parsedId;
            } else {
                setError('Invalid URL format.');
                return;
            }
        }

        if (productIdToAdd && !productIds.includes(productIdToAdd)) {
            setProductIds(prevProductIds => {
                const updatedProductIds = [...prevProductIds, productIdToAdd];
                setSelectedProduct(productIdToAdd);
                fetchAllProductsAvailability(updatedProductIds);
                return updatedProductIds;
            });
        }
        setNewProductId('');
    };

    const sortStoresByAvailability = () => {
        const availableStores = [];
        const unavailableStores = [];

        stores.forEach(store => {
            if (availability[store.storeId] && availability[store.storeId].hasInventory === 1) {
                availableStores.push(store);
            } else {
                unavailableStores.push(store);
            }
        });

        return [...availableStores, ...unavailableStores];
    };

    const fetchRecommendedProducts = async (productId) => {
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
                });

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

    const addRecommendedProduct = (productId) => {
        setProductIds(prevProductIds => {
            const updatedProductIds = [...prevProductIds, productId];
            return updatedProductIds;
        });
        setSelectedProduct(productId);
    };

    const handleNextRecommendations = () => {
        setRecommendationStartIndex(prev => Math.min(prev + RECOMMENDATIONS_PER_PAGE, recommendedProducts.length - RECOMMENDATIONS_PER_PAGE));
    };

    const handlePrevRecommendations = () => {
        setRecommendationStartIndex(prev => Math.max(prev - RECOMMENDATIONS_PER_PAGE, 0));
    };

    const handleOpenJsonDialog = () => {
        setIsJsonDialogOpen(true);
    };

    const handleCloseJsonDialog = () => {
        setIsJsonDialogOpen(false);
    };

    const handleOpenStoreDetailsDialog = () => {
        setIsStoreDetailsDialogOpen(true);
    };

    const handleCloseStoreDetailsDialog = () => {
        setIsStoreDetailsDialogOpen(false);
    };

    const handleCopyJson = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(selectedProductJson, null, 2));
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            setError('Failed to copy JSON to clipboard.');
        }
    };

    const goToProductSite = () => {
        if (selectedProduct) {
            const productURL = `https://automercado.cr/p/bebida-gaseosa-zero-sabor-cereza-dr.pepper-lata-355-ml/id/${selectedProduct}`;
            window.open(productURL, '_blank'); // Opens in a new tab
        }
    };

    const sortedStores = sortStoresByAvailability();

    const displayedRecommendations = recommendedProducts.slice(recommendationStartIndex, recommendationStartIndex + RECOMMENDATIONS_PER_PAGE);

    const storeDetails = stores.map(store => ({
        ...store,
        ...availability[store.storeId]
    }));

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Auto Mercado Availability
                    </Typography>
                    <IconButton onClick={toggleTheme} color="inherit">
                        {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Box>
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                    <TextField
                        label="Add Product ID or URL"
                        variant="outlined"
                        size="small"
                        value={newProductId}
                        onChange={(e) => setNewProductId(e.target.value)}
                        sx={{ mr: 1, flexGrow: 1 }}
                    />
                    <Button variant="outlined" onClick={handleAddProduct}>
                        Add Product
                    </Button>
                </Box>

                <ProductList
                    products={products}
                    selectedProduct={selectedProduct}
                    handleProductChange={handleProductChange}
                />

                {loading ? (
                    <CircularProgress />
                ) : (
                    <Card sx={{ width: '100%', position: 'relative' }}>
                        <CardMedia
                            component="img"
                            height="200"
                            image={productImage}
                            alt={productName}
                            sx={{ objectFit: 'contain', p: 2 }}
                        />
                        <ButtonContainer>
                            <JsonButton
                                variant="contained"
                                size="small"
                                onClick={goToProductSite}
                                startIcon={<OpenInNewIcon />}
                            >
                                Go to Site
                            </JsonButton>
                            <JsonButton
                                variant="contained"
                                size="small"
                                onClick={handleOpenStoreDetailsDialog}
                                startIcon={<CodeIcon />}
                            >
                                Store Details
                            </JsonButton>
                            <JsonButton
                                variant="contained"
                                size="small"
                                onClick={handleOpenJsonDialog}
                                startIcon={<CodeIcon />}
                            >
                                JSON
                            </JsonButton>
                        </ButtonContainer>
                        <CardContent>
                            <Typography variant="h6" component="div">
                                {productName}
                            </Typography>
                            {!isProductAvailable && products.length > 0 ? (
                                <Alert severity="warning">This product is not available in any stores.</Alert>
                            ) : null}

                            <StoreList
                                stores={sortedStores}
                                availability={availability}
                            />
                        </CardContent>
                    </Card>
                )}
                <Divider sx={{ my: 3, width: '100%' }} />
                <RecommendedProducts
                    displayedRecommendations={displayedRecommendations}
                    handlePrevRecommendations={handlePrevRecommendations}
                    handleNextRecommendations={handleNextRecommendations}
                    addRecommendedProduct={addRecommendedProduct}
                    recommendationStartIndex={recommendationStartIndex}
                    recommendedProducts={recommendedProducts}
                />
            </Box>
            <ProductDialog
                isJsonDialogOpen={isJsonDialogOpen}
                handleCloseJsonDialog={handleCloseJsonDialog}
                selectedProductJson={selectedProductJson}
                handleCopyJson={handleCopyJson}
                copySuccess={copySuccess}
            />
            <StoreDetailsDialog
                isOpen={isStoreDetailsDialogOpen}
                onClose={handleCloseStoreDetailsDialog}
                storeDetails={storeDetails}
            />
        </Container>
    );
}

export default function WrappedApp() {
    return (
        <ThemeProviderWrapper>
            <App />
        </ThemeProviderWrapper>
    );
}
