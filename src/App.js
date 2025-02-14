import React, { useState, useEffect, useContext } from 'react';
// Removed unused import
// import axios from 'axios';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CodeIcon from '@mui/icons-material/Code';
// Removed unused import
// DeleteIcon,

import ThemeProviderWrapper, { ThemeContext } from "./ThemeContext";
import { JsonButton, ButtonContainer } from './components/StyledComponents';
import ProductDialog from './components/ProductDialog';
import ProductList from './components/ProductList';
import StoreList from './components/StoreList';
import RecommendedProducts from './components/RecommendedProducts';
import StoreDetailsDialog from './components/StoreDetailsDialog';
import { fetchStores, fetchAllProductsAvailability, fetchRecommendedProducts } from './utils/api';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

function App() {
    const { themeMode, toggleTheme } = useContext(ThemeContext);
    const [storeChains, setStoreChains] = useState([
        { id: 'chain1', name: 'Auto Mercado' },
        { id: 'chain2', name: 'PriceSmart' }
    ]);
    const [selectedChain, setSelectedChain] = useState('chain1');
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

    const [productIds, setProductIds] = useState({
        chain1: [
            "6a237f75-d599-ec11-b400-000d3a347b43",
            "1c4d9e75-d599-ec11-b400-000d3a347ca0",
            "e51c8d70-d599-ec11-b400-000d3a3479fe",
            "52f2878d-20c5-4ae6-8963-53f895b9d7d6"
        ],
        chain2: [
            "755713"
        ]
    });

    useEffect(() => {
        if (selectedChain) {
            fetchStores(selectedChain, setStores, setError, PROXY_URL);
        }
    }, [selectedChain]);

    useEffect(() => {
        if (stores.length > 0 && productIds[selectedChain].length > 0) {
            fetchAllProductsAvailability(selectedChain, productIds[selectedChain], setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL);
        }
    }, [stores, productIds, selectedChain]);

    useEffect(() => {
        if (selectedProduct) {
            fetchRecommendedProducts(selectedProduct, productIds[selectedChain], setRecommendedProducts, setError, setRecommendationStartIndex, PROXY_URL);
        }
    }, [selectedProduct, productIds, selectedChain]);

    useEffect(() => {
        serviceWorkerRegistration.register();
    }, []);

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

    const handleChainChange = (event) => {
        const newChainId = event.target.value;
        setSelectedChain(newChainId);
        setStores([]);
        setProducts([]);
        setSelectedProduct('');
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
    }, [selectedProduct, products, setAvailabilityForProduct]);

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

        if (productIdToAdd && !productIds[selectedChain].includes(productIdToAdd)) {
            setProductIds(prevProductIds => {
                const updatedProductIds = { ...prevProductIds, [selectedChain]: [...prevProductIds[selectedChain], productIdToAdd] };
                setSelectedProduct(productIdToAdd);
                fetchAllProductsAvailability(selectedChain, updatedProductIds[selectedChain], setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL);
                return updatedProductIds;
            });
        }
        setNewProductId('');
    };

    const handleRemoveProduct = (productId) => {
        setProductIds(prevProductIds => {
            const updatedProductIds = { ...prevProductIds, [selectedChain]: prevProductIds[selectedChain].filter(id => id !== productId) };
            setProducts(products.filter(product => product.productId !== productId));
            if (selectedProduct === productId) {
                setSelectedProduct('');
            }
            return updatedProductIds;
        });
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

    const addRecommendedProduct = (productId) => {
        setProductIds(prevProductIds => {
            const updatedProductIds = { ...prevProductIds, [selectedChain]: [...prevProductIds[selectedChain], productId] };
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
            const productURL = selectedChain === 'chain1'
                ? `https://automercado.cr/p/bebida-gaseosa-zero-sabor-cereza-dr.pepper-lata-355-ml/id/${selectedProduct}`
                : `https://www.pricesmart.com/es-CR/producto/members-selection-comida-para-perro-raza-pequena-sabor-avena-y-pollo-9-07-kg-20-lb/${selectedProduct}`;
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
                        {selectedChain === 'chain1' ? 'Auto Mercado Availability' : 'PriceSmart Availability'}
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

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="chain-select-label">Select a Store Chain</InputLabel>
                    <Select
                        labelId="chain-select-label"
                        id="chain-select"
                        value={selectedChain || ''}
                        label="Select a Store Chain"
                        onChange={handleChainChange}
                    >
                        {storeChains.map(chain => (
                            <MenuItem key={chain.id} value={chain.id}>
                                {chain.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                    <TextField
                        label="Add Product ID or URL"
                        variant="outlined"
                        size="small"
                        value={newProductId}
                        onChange={(e) => setNewProductId(e.target.value)}
                        onPaste={(e) => setNewProductId(e.clipboardData.getData('Text'))}
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
                    handleRemoveProduct={handleRemoveProduct}
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
