import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Box,
    IconButton,
    Typography // Add Typography import
} from '@mui/material';
import { StyledMenuItem } from './StyledComponents';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductList = ({ products, selectedProduct, handleProductChange, handleRemoveProduct }) => {
    const handleRemoveClick = (event, productId) => {
        event.stopPropagation();
        console.log(productId)
        handleRemoveProduct(productId);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price).replace(/\s/g, '.');
    };

    return (
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
                        <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            <Typography variant="body2">
                                {selectedProductData.name}
                            </Typography>
                        </Box>
                    ) : null;
                }}
            >
                {products.map(product => (
                    <StyledMenuItem key={product.productId} value={product.productId} available={product.availableAnywhere.toString()}>
                        <ListItemAvatar>
                            <Avatar src={product.imageUrl} sx={{ width: 80, height: 80, borderRadius: 0 }} /> {/* Increase image size and remove circle frame */}
                        </ListItemAvatar>
                        <ListItemText 
                            sx={{ ml: 2 }}
                            primary={
                                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                    {product.name}
                                </Typography>
                            } 
                            secondary={
                                <Typography variant="body2" color="textSecondary">
                                    {formatPrice(product.storeDetail[Object.keys(product.storeDetail)[0]].basePrice)}
                                </Typography>
                            }
                        />
                        <IconButton edge="end" aria-label="delete" onClick={(event) => handleRemoveClick(event, product.productId)}>
                            <DeleteIcon />
                        </IconButton>
                    </StyledMenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ProductList;
