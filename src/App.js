import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
// Removed unused import
// import axios from 'axios';
import {
    Container,
    CircularProgress,
    Alert,
    Box,
    TextField,
    Card,
    CardMedia,
    CardContent,
    Divider,
    IconButton,
    Collapse,
    Autocomplete // Added Autocomplete import
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StoreIcon from '@mui/icons-material/Store'; // Changed icon import
import CodeIcon from '@mui/icons-material/Code';
import MenuIcon from '@mui/icons-material/Menu';
// Removed unused imports
// import Button from '@mui/material/Button';
// import Menu from '@mui/material/Menu';
// import MenuItem as MuiMenuItem from '@mui/material/MenuItem';
// import Brightness4Icon from '@mui/icons-material/Brightness4';
// import Brightness7Icon from '@mui/icons-material/Brightness7';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search'; // Add SearchIcon import
import CloseIcon from '@mui/icons-material/Close'; // Add CloseIcon import

import ThemeProviderWrapper, { ThemeContext } from "./ThemeContext";
import { JsonButton, ButtonContainer, ElegantButton } from './components/StyledComponents';
import ProductDialog from './components/ProductDialog';
import ProductList from './components/ProductList';
import StoreList from './components/StoreList';
import RecommendedProducts from './components/RecommendedProducts';
import StoreDetailsDialog from './components/StoreDetailsDialog';
import { fetchStores, fetchAllProductsAvailability, fetchRecommendedProducts, fetchChain2SearchResults } from './utils/api';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ChainSelector from './components/ChainSelector';
import AppMenu from './components/AppMenu';

function App() {
    const { themeMode, toggleTheme } = useContext(ThemeContext);
    const [storeChains] = useState([
        { id: 'chain1', name: 'Auto Mercado', image: 'https://automercado.cr/content/images/ico/cropped-Icono-Auto-Mercado-1-1-192x192.png' },
        { id: 'chain2', name: 'PriceSmart', image: 'https://pricesmart.bloomreach.io/delivery/resources/content/gallery/pricesmart/header/logomobile.svg' }
    ]);
    const [selectedChain, setSelectedChain] = useState(localStorage.getItem('selectedChain') || 'chain1');
    const [stores, setStores] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState(JSON.parse(localStorage.getItem('selectedProducts')) || { chain1: '', chain2: '' });
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showOnlyCRStores, setShowOnlyCRStores] = useState(true);
    const [searchResults, setSearchResults] = useState([]); // Added state for search results
    const [searchInputValue, setSearchInputValue] = useState(''); // Added state for search input value
    const [isSearchOpen, setIsSearchOpen] = useState(false); // Add state for search bar visibility
    const searchInputRef = useRef(null); // Add reference for search input

    const PROXY_URL = process.env.NODE_ENV === 'production' 
        ? process.env.REACT_APP_PROXY_URL_PROD 
        : process.env.REACT_APP_PROXY_URL;
    const RECOMMENDATIONS_PER_PAGE = 3;

    const LOCAL_STORAGE_KEY = 'productIds';

    // Function to load state from local storage
    const loadStateFromLocalStorage = () => {
        try {
            const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            return serializedState ? JSON.parse(serializedState) : null;
        } catch (error) {
            console.error('Error loading state from local storage:', error);
            return null;
        }
    };

    const savedState = loadStateFromLocalStorage();

    const [productIds, setProductIds] = useState(savedState || {
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

    // Function to save state to local storage
    const saveStateToLocalStorage = (state) => {
        try {
            const serializedState = JSON.stringify(state);
            localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
        } catch (error) {
            console.error('Error saving state to local storage:', error);
        }
    };

    // Save state to local storage whenever productIds changes
    useEffect(() => {
        saveStateToLocalStorage(productIds);
    }, [productIds]);

    // Save selected chain and products to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('selectedChain', selectedChain);
    }, [selectedChain]);

    useEffect(() => {
        localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    }, [selectedProducts]);

    useEffect(() => {
        if (selectedChain) {
            fetchStores(selectedChain, setStores, setError, PROXY_URL);
        }
    }, [selectedChain, PROXY_URL]);

    useEffect(() => {
        if (stores.length > 0 && productIds[selectedChain].length > 0) {
            fetchAllProductsAvailability(selectedChain, productIds[selectedChain], setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL, showOnlyCRStores, stores);
        }
    }, [stores, productIds, selectedChain, PROXY_URL, showOnlyCRStores]);

    useEffect(() => {
        if (selectedProducts[selectedChain]) {
            fetchRecommendedProducts(selectedProducts[selectedChain], productIds[selectedChain], setRecommendedProducts, setError, setRecommendationStartIndex, PROXY_URL);
        }
    }, [selectedProducts, productIds, selectedChain, PROXY_URL]);

    useEffect(() => {
        serviceWorkerRegistration.register();
    }, []);

    const requestNotificationPermission = async () => {
        if ('Notification' in window && navigator.serviceWorker) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            } else {
                console.log('Notification permission denied.');
            }
        }
    };

    const sendNotification = (title, options) => {
        if ('Notification' in window && navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
        }
    };

    useEffect(() => {
        requestNotificationPermission();
    }, []);

    const checkProductAvailability = useCallback(() => {
        if (selectedProducts[selectedChain]) {
            fetchAllProductsAvailability(selectedChain, [selectedProducts[selectedChain]], setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL, showOnlyCRStores, stores)
                .then(() => {
                    if (isProductAvailable) {
                        sendNotification('Product Available', {
                            body: `The product ${productName} is now available.`,
                            icon: productImage
                        });
                    }
                })
                .catch(error => {
                    console.error('Error checking product availability:', error);
                });
        }
    }, [selectedProducts, selectedChain, isProductAvailable, productName, productImage, PROXY_URL, showOnlyCRStores, stores]);

    useEffect(() => {
        const intervalId = setInterval(checkProductAvailability, 6000000); // Check every 6000 seconds
        return () => clearInterval(intervalId);
    }, [checkProductAvailability]);

    const setAvailabilityForProduct = useCallback((productId, storeDetail, availableAnywhere) => {
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
                    hall: detail.hall,
                    quantity: detail.quantity // Add quantity
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
                    hall: 'N/A',
                    quantity: 'N/A' // Add quantity
                };
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`Store detail not found for store ID: ${storeId}`);
                }
            }
            setAvailability(storeAvailability);
            if (detail && detail.hasInvontory === 1) {
                productAvailableAnywhereVar = true;
            }
        });

        setIsProductAvailable(productAvailableAnywhereVar);

        if (productAvailableAnywhereVar) {
            sendNotification('Product Available', {
                body: `The product ${productName} is now available.`,
                icon: productImage
            });
        }
    }, [stores, productName, productImage]);

    const handleProductChange = (event) => {
        const newProductId = event.target.value;
        setSelectedProducts(prevSelectedProducts => ({
            ...prevSelectedProducts,
            [selectedChain]: newProductId
        }));
    };

    const handleChainChange = (event) => {
        const newChainId = event.target.value;
        setSelectedChain(newChainId);
        setStores([]);
        setProducts([]);
        setSelectedProducts(prevSelectedProducts => ({
            ...prevSelectedProducts,
            [newChainId]: ''
        }));
    };

    useEffect(() => {
        if (products.length > 0 && !selectedProducts[selectedChain]) {
            setSelectedProducts(prevSelectedProducts => ({
                ...prevSelectedProducts,
                [selectedChain]: products[0].productId
            }));
        }
    }, [products, selectedProducts, selectedChain]);

    useEffect(() => {
        if (selectedProducts[selectedChain]) {
            const selected = products.find(product => product.productId === selectedProducts[selectedChain]);
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
    }, [selectedProducts, selectedChain, products, setAvailabilityForProduct]);

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
                setSelectedProducts(prevSelectedProducts => ({
                    ...prevSelectedProducts,
                    [selectedChain]: productIdToAdd
                }));
                fetchAllProductsAvailability(selectedChain, updatedProductIds[selectedChain], setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL, showOnlyCRStores, stores);
                return updatedProductIds;
            });
        }
        setNewProductId('');
    };

    const handleRemoveProduct = (productId) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Removing product:', productId);
        }
        setProductIds(prevProductIds => {
            const updatedProductIds = { ...prevProductIds, [selectedChain]: prevProductIds[selectedChain].filter(id => id !== productId) };
            if (process.env.NODE_ENV === 'development') {
                console.log('Updated productIds:', updatedProductIds);
            }
            setProducts(products.filter(product => product.productId !== productId));
            if (selectedProducts[selectedChain] === productId) {
                setSelectedProducts(prevSelectedProducts => ({
                    ...prevSelectedProducts,
                    [selectedChain]: ''
                }));
            }
            return updatedProductIds;
        });
    };

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('productIds updated:', productIds);
        }
    }, [productIds]);

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
        setSelectedProducts(prevSelectedProducts => ({
            ...prevSelectedProducts,
            [selectedChain]: productId
        }));
    };

    const handleNextRecommendations = () => {
        setRecommendationStartIndex(prev => Math.min(prev + RECOMMENDATIONS_PER_PAGE, recommendedProducts.length - RECOMMENDATIONS_PER_PAGE));
    };

    const handlePrevRecommendations = () => {
        setRecommendationStartIndex(prev => Math.max(prev - RECOMMENDATIONS_PER_PAGE, 0));
    };

    const handleOpenJsonDialog = () => {
        if (selectedChain === 'chain2') {
            const selected = products.find(product => product.productId === selectedProducts[selectedChain]);
            setSelectedProductJson(selected);
        } else {
            setSelectedProductJson(selectedProductJson);
        }
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
        if (selectedProducts[selectedChain]) {
            const productURL = selectedChain === 'chain1'
                ? `https://automercado.cr/p/bebida-gaseosa-zero-sabor-cereza-dr.pepper-lata-355-ml/id/${selectedProducts[selectedChain]}`
                : `https://www.pricesmart.com/es-CR/producto/members-selection-comida-para-perro-raza-pequena-sabor-avena-y-pollo-9-07-kg-20-lb/${selectedProducts[selectedChain]}`;
            window.open(productURL, '_blank'); // Opens in a new tab
        }
    };

    const sortedStores = sortStoresByAvailability();

    const displayedStores = selectedChain === 'chain2' && showOnlyCRStores
        ? sortedStores.filter(store => ['Llorente', 'Escazú', 'Alajuela', 'Cartago', 'Zapote', 'Heredia', 'Tres Ríos', 'Liberia'].includes(store.name))
        : sortedStores;

    const displayedRecommendations = recommendedProducts.slice(recommendationStartIndex, recommendationStartIndex + RECOMMENDATIONS_PER_PAGE);

    const storeDetails = stores.map(store => ({
        ...store,
        ...availability[store.storeId]
    }));

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const toggleShowOnlyCRStores = () => {
        setShowOnlyCRStores(prev => !prev);
    };

    const handleSearchChange = async (event, value) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('handleSearchChange value:', value);
        }
        setSearchInputValue(value); // Update search input value
        if (value) {
            if (selectedChain === 'chain2') {
                fetchChain2SearchResults(value, setSearchResults, setError);
            } else {
                try {
                    const algoliaRequest = {
                        requests: [
                            {
                                indexName: "Product_CatalogueV2",
                                params: `query=${value}&hitsPerPage=10&userToken=feba0c89-3a8c-41e0-af46-a379bfd34569&enablePersonalization=true&facets=["marca","addedSugarFree","fiberSource","lactoseFree","lfGlutemFree","lfOrganic","lfVegan","lowFat","lowSodium","preservativeFree","sweetenersFree","parentProductid","parentProductid2","parentProductid_URL","catecom"]&facetFilters=[[]]`
                            }
                        ]
                    };
                    const response = await fetch(`${PROXY_URL}/am/availability`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(algoliaRequest)
                    });
                    const data = await response.json();
                    setSearchResults(data.results[0].hits);
                } catch (error) {
                    console.error('Error fetching search results:', error);
                }
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleProductSelect = (event, value) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('handleProductSelect value:', value);
        }
        if (value) {
            const productIdToAdd = selectedChain === 'chain2' ? value.id : value.objectID;
            if (process.env.NODE_ENV === 'development') {
                console.log('value:', value)
            }
            if (productIdToAdd && !productIds[selectedChain].includes(productIdToAdd)) {
                setProductIds(prevProductIds => {
                    const updatedProductIds = { ...prevProductIds, [selectedChain]: [...prevProductIds[selectedChain], productIdToAdd] };
                    setSelectedProducts(prevSelectedProducts => ({
                        ...prevSelectedProducts,
                        [selectedChain]: productIdToAdd
                    }));
                    fetchAllProductsAvailability(selectedChain, updatedProductIds[selectedChain], setProducts, setLoading, setError, setAvailability, setIsProductAvailable, PROXY_URL, showOnlyCRStores, stores);
                    return updatedProductIds;
                });
            } else {
                setSelectedProducts(prevSelectedProducts => ({
                    ...prevSelectedProducts,
                    [selectedChain]: productIdToAdd
                }));
            }
            setSearchInputValue(''); // Clear the search input value
        }
    };

    const renderHighlightedText = (text) => {
        const parts = text.split(/(<em>.*?<\/em>)/g).map((part, index) => {
            if (part.startsWith('<em>') && part.endsWith('</em>')) {
                return <strong key={index}>{part.slice(4, -5)}</strong>;
            }
            return part;
        });
        return <span>{parts}</span>;
    };

    const handleSearchIconClick = () => {
        setIsSearchOpen(prev => !prev);
        if (!isSearchOpen) {
            setTimeout(() => {
                searchInputRef.current.focus(); // Focus the search input when it is opened
            }, 0);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <ChainSelector selectedChain={selectedChain} storeChains={storeChains} handleChainChange={handleChainChange} />
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end' }}>
                        {isSearchOpen && (
                            <Autocomplete
                                freeSolo
                                options={searchResults}
                                getOptionLabel={(option) => selectedChain === 'chain2' ? option.text || '' : option.ecomDescription || ''}
                                inputValue={searchInputValue} // Bind input value to state
                                onInputChange={handleSearchChange}
                                onChange={handleProductSelect}
                                renderOption={(props, option, index) => {
                                    const { key, ...rest } = props;
                                    return (
                                        <Box key={`${key}-${index}`} {...rest}>
                                            <img
                                                src={selectedChain === 'chain2' ? option.image : option.imageUrl}
                                                alt={selectedChain === 'chain2' ? option.text : option.ecomDescription}
                                                style={{ width: '40px', height: '40px', marginRight: '10px' }}
                                            />
                                            {renderHighlightedText(selectedChain === 'chain2' ? option.text : option._snippetResult.ecomDescription.value)}
                                        </Box>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Search Products"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        inputRef={searchInputRef} // Attach reference to the search input
                                        sx={{ flexGrow: 1 }}
                                    />
                                )}
                                sx={{ mr: 1, flexGrow: 1 }}
                            />
                        )}
                        <IconButton onClick={handleSearchIconClick} color="inherit">
                            {isSearchOpen ? <CloseIcon /> : <SearchIcon />}
                        </IconButton>
                        <IconButton onClick={handleMenuOpen} color="inherit">
                            <MenuIcon />
                        </IconButton>
                    </Box>
                    <AppMenu anchorEl={anchorEl} handleMenuClose={handleMenuClose} toggleTheme={toggleTheme} themeMode={themeMode} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} toggleShowOnlyCRStores={toggleShowOnlyCRStores} showOnlyCRStores={showOnlyCRStores} />
                </Box>
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Collapse in={isMenuOpen} sx={{ width: '100%', mb: 2 }} inert={isMenuOpen.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                        <TextField
                            label="Add Product ID or URL"
                            variant="outlined"
                            size="small"
                            value={newProductId}
                            onChange={(e) => setNewProductId(e.target.value)}
                            onPaste={(e) => setNewProductId(e.clipboardData.getData('Text'))}
                            sx={{ mr: 1,flexGrow: 1 }}
                        />
                        <ElegantButton variant="outlined" onClick={handleAddProduct}>
                            Add Product
                        </ElegantButton>
                    </Box>
                </Collapse>

                <ProductList
                    products={products}
                    selectedProduct={selectedProducts[selectedChain]}
                    handleProductChange={handleProductChange}
                    handleRemoveProduct={handleRemoveProduct}
                />

                {loading ? (
                    <CircularProgress />
                ) : (
                    <Card sx={{ width: '100%', position: 'relative' }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={productImage}
                                alt={productName}
                                sx={{ 
                                    objectFit: 'contain', 
                                    p: 2, 
                                    width: { xs: '100%', sm: '50%' }, 
                                    '@media (max-width: 600px)': { alignSelf: 'flex-start', marginLeft: 0 } // Align image to the left on narrow screens
                                }} 
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: '50%' } }}>

                                <ButtonContainer>
                                    <JsonButton
                                        variant="contained"
                                        size="small"
                                        onClick={goToProductSite}
                                        startIcon={<OpenInNewIcon />}
                                        sx={{ justifyContent: 'flex-start', '@media (max-width: 600px)': { justifyContent: 'center', minWidth: 'auto', padding: '6px' } }} // Align text to the left and show only icon on narrow screens
                                    >
                                        <span className="button-text">Go to Site</span>
                                    </JsonButton>
                                    <JsonButton
                                        variant="contained"
                                        size="small"
                                        onClick={handleOpenStoreDetailsDialog}
                                        startIcon={<StoreIcon />} // Changed icon
                                        sx={{ justifyContent: 'flex-start', '@media (max-width: 600px)': { justifyContent: 'center', minWidth: 'auto', padding: '6px' } }} // Align text to the left and show only icon on narrow screens
                                    >
                                        <span className="button-text">Store Details</span>
                                    </JsonButton>
                                    <JsonButton
                                        variant="contained"
                                        size="small"
                                        onClick={handleOpenJsonDialog}
                                        startIcon={<CodeIcon />}
                                        sx={{ justifyContent: 'flex-start', '@media (max-width: 600px)': { justifyContent: 'center', minWidth: 'auto', padding: '6px' } }} // Align text to the left and show only icon on narrow screens
                                    >
                                        <span className="button-text">JSON</span>
                                    </JsonButton>
                                </ButtonContainer>
                            </Box>
                        </Box>
                        <CardContent>
                            {!isProductAvailable && products.length > 0 ? (
                                <Alert severity="warning">This product is not available in any stores.</Alert>
                            ) : null}

                            <StoreList
                                stores={displayedStores}
                                availability={availability}
                                selectedChain={selectedChain} // Pass selectedChain prop
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
