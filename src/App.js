import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardMedia,
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Box,
    ListItemAvatar,
    Avatar,
    ListItemText,
    TextField,
    Button,
    alpha,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CodeIcon from '@mui/icons-material/Code';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { styled } from '@mui/material/styles';
import { JsonViewer } from '@textea/json-viewer';

const StyledMenuItem = styled(MenuItem)(({ theme, available }) => ({
    ...(available === 'false' && {
        color: theme.palette.text.disabled,
        '& .MuiAvatar-root': {
            filter: 'grayscale(100%)',
        },
    }),
}));

const ElegantButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    borderColor: alpha(theme.palette.text.secondary, 0.5),
    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
    },
}));

const RecommendationCard = styled(Card)(({ theme, available }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ...(available === 'false' && {
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        color: theme.palette.text.disabled,
        '& .MuiCardMedia-root': {
            filter: 'grayscale(100%)',
        },
    }),
}));

const JsonButton = styled(Button)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.7),
    color: theme.palette.common.white,
    padding: theme.spacing(0.5, 1),
    minWidth: 0,
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    fontWeight: theme.typography.fontWeightMedium,
    width: '100%', // Full width of the container
    boxSizing: 'border-box', // Include padding and border in the element's total width and height
    '&:hover': {
        backgroundColor: theme.palette.primary.main,
    },
}));

const ButtonContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1), // Spacing between buttons
    // alignItems: 'flex-end', // Remove alignItems
    width: 'max-content', // Width based on content
    maxWidth: '200px', // Prevent content from becoming too wide
}));

function App() {
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
    const [copySuccess, setCopySuccess] = useState(false);
    const [initialSelectionMade, setInitialSelectionMade] = useState(false);

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
                 // After sorting, set selected product.
                if (sortedProducts.length > 0) {
                   // setSelectedProduct(sortedProducts[0].productId); // Select the first product. Removed, this has to be done on add product only
                }
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
                    productAvailable: detail.productAvailable,
                    hall: detail.hall
                };
                if (detail.hasInvontory === 1) {
                    productAvailableAnywhereVar = true;
                }
            } else {
                storeAvailability[storeId] = {
                    hasInventory: false,
                    productAvailable: false,
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
            // Update productIds state and then set selected product
            setProductIds(prevProductIds => {
                const updatedProductIds = [...prevProductIds, productIdToAdd];
                setSelectedProduct(productIdToAdd); // Select the new product
                fetchAllProductsAvailability(updatedProductIds); // Refetch all products to include the new one
                return updatedProductIds;

            });
             // setSelectedProduct(productIdToAdd); // set selectedProduct to the new product id.
             // fetchAllProductsAvailability([...productIds, productIdToAdd]); // fetch all products again with the new id
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

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Grocery Store Availability
                </Typography>

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
                    <ElegantButton variant="outlined" onClick={handleAddProduct}>
                        Add Product
                    </ElegantButton>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="product-select-label">Select a Product</InputLabel>
                    <Select
                        labelId="product-select-label"
                        id="product-select"
                        value={selectedProduct || ''}
                        label="Select a Product"
                        onChange={handleProductChange}
                        renderValue={(selected) => {
                            const selectedProductData = products.find(product => product.productId === selected);
                            return selectedProductData ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar src={selectedProductData.imageUrl} sx={{ mr: 1, width: 24, height: 24 }} />
                                    {selectedProductData.name}
                                </Box>
                            ) : null;
                        }}
                    >
                        {products.map(product => (
                            <StyledMenuItem key={product.productId} value={product.productId} available={product.availableAnywhere.toString()}>
                                <ListItemAvatar>
                                    <Avatar src={product.imageUrl} />
                                </ListItemAvatar>
                                <ListItemText primary={product.name} />
                            </StyledMenuItem>
                        ))}
                    </Select>
                </FormControl>

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

                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                {sortedStores.map(store => (
                                    <Grid item xs={12} sm={6} md={4} key={store.storeId}>
                                        <Typography variant="subtitle1">
                                            {store.name}
                                        </Typography>
                                        {availability[store.storeId] ? (
                                            <div>
                                                {availability[store.storeId].hasInventory === 1 ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <CheckIcon color="success" sx={{ mr: 1 }} />
                                                        <Typography variant="body2">
                                                            In Stock - Hall: {availability[store.storeId].hall}
                                                        </Typography>
                                                    </Box>
                                                ) : availability[store.storeId].hasInventory === 0 ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <CloseIcon color="error" sx={{ mr: 1 }} />
                                                        <Typography variant="body2">Out of Stock</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2">Availability Unknown</Typography>
                                                )}
                                            </div>
                                        ) : (
                                            <Typography variant="body2">Checking...</Typography>
                                        )}
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                )}
                <Divider sx={{ my: 3, width: '100%' }} />
                <Typography variant="h6" component="h3" sx={{ width: '100%', textAlign: 'left', mb: 1 }}>
                    Recommended Products
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', overflowX: 'auto', width: '100%', scrollBehavior: 'smooth' }}>
                    <IconButton onClick={handlePrevRecommendations} disabled={recommendationStartIndex === 0}>
                        <ArrowBackIosIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 2, width: '100%', overflow: 'hidden' }}>
                        {displayedRecommendations.map(product => (
                            <RecommendationCard key={product.productID} sx={{ width: 200, flexShrink: 0 }} available={product.availableAnywhere.toString()}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={product.imageUrl}
                                    alt={product.ecomDescription}
                                    sx={{ objectFit: 'contain', p: 1 }}
                                />
                                <CardContent>
                                    <Typography variant="subtitle1" component="div">
                                        {product.ecomDescription}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => addRecommendedProduct(product.productID)}
                                    >
                                        Add to List
                                    </Button>
                                </Box>
                            </RecommendationCard>
                        ))}
                    </Box>
                    <IconButton onClick={handleNextRecommendations} disabled={recommendationStartIndex + RECOMMENDATIONS_PER_PAGE >= recommendedProducts.length}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
            </Box>
            <Dialog open={isJsonDialogOpen} onClose={handleCloseJsonDialog} fullWidth maxWidth="md">
                <DialogTitle>
                    Product JSON
                    <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
                        <IconButton
                            aria-label="copy"
                            onClick={handleCopyJson}
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <FileCopyIcon />
                        </IconButton>
                    </Tooltip>
                </DialogTitle>
                <DialogContent>
                    {selectedProductJson ? (
                        <JsonViewer value={selectedProductJson} />
                    ) : (
                        <Typography>No product selected.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseJsonDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default App;
