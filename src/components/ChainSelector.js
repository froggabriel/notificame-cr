import React, { useState } from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography } from '@mui/material';

const ChainSelector = ({ selectedChain, storeChains, handleChainChange }) => {
    const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);

    const handleChainSelectorOpen = () => {
        setIsChainSelectorOpen(true);
    };

    const handleChainSelectorClose = () => {
        setIsChainSelectorOpen(false);
    };

    return (
        <>
            <IconButton onClick={handleChainSelectorOpen} color="inherit">
                <img src={storeChains.find(chain => chain.id === selectedChain).image} alt={selectedChain} style={{ width: 40, height: 40 }} />
            </IconButton>
            <Dialog open={isChainSelectorOpen} onClose={handleChainSelectorClose}>
                <DialogTitle>Select a Store Chain</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        {storeChains.map(chain => (
                            <Grid item xs={6} key={chain.id}>
                                <Button
                                    onClick={() => {
                                        handleChainChange({ target: { value: chain.id } });
                                        handleChainSelectorClose();
                                    }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textTransform: 'none' }}
                                >
                                    <img src={chain.image} alt={chain.name} style={{ width: 60, height: 60 }} />
                                    <Typography variant="body2" color="textPrimary">{chain.name}</Typography>
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleChainSelectorClose} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ChainSelector;