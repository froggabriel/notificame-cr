import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const StoreList = ({ stores, availability }) => {
    return (
        <Grid container spacing={2} sx={{ mt: 2 }}>
            {stores.map(store => (
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
    );
};

export default StoreList;
