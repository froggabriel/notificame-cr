import React from 'react';
import { Grid, Typography, Box, Paper } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const StoreList = ({ stores, availability, selectedChain }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price).replace(/\s/g, '.');
    };

    return (
        <Grid container spacing={2} sx={{ mt: 2 }}>
            {stores.map(store => (
                <Grid item xs={12} sm={6} md={4} key={store.storeId}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" gutterBottom>
                                {store.name}
                            </Typography>
                            {availability[store.storeId] && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {availability[store.storeId].hasInventory === 1 ? (
                                        <CheckIcon color="success" sx={{ mr: 1 }} />
                                    ) : (
                                        <CloseIcon color="error" sx={{ mr: 1 }} />
                                    )}
                                    <Typography variant="body2">
                                        {availability[store.storeId].hasInventory === 1 ? 'In Stock' : 'Out of Stock'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        {availability[store.storeId] && availability[store.storeId].hasInventory === 1 && (
                            <Box sx={{ mt: 1, pl: 2 }}>
                                <Grid container spacing={0.5}>
                                    <Grid item xs={4}>
                                        <Typography variant="body2">
                                            <strong>Price:</strong>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">
                                            {formatPrice(availability[store.storeId].basePrice)}
                                        </Typography>
                                    </Grid>
                                    {selectedChain === 'chain1' ? (
                                        <>
                                            <Grid item xs={4}>
                                                <Typography variant="body2">
                                                    <strong>Hall:</strong>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={8}>
                                                <Typography variant="body2">
                                                    {availability[store.storeId].hall}
                                                </Typography>
                                            </Grid>
                                        </>
                                    ) : (
                                        <>
                                            <Grid item xs={4}>
                                                <Typography variant="body2">
                                                    <strong>Quantity:</strong>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={8}>
                                                <Typography variant="body2">
                                                    {availability[store.storeId].quantity || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </>
                                    )}
                                </Grid>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

export default StoreList;
