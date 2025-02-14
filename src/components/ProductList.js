import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Box,
    IconButton,
} from '@mui/material';
import { StyledMenuItem } from './StyledComponents';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductList = ({ products, selectedProduct, handleProductChange, handleRemoveProduct }) => {
    const handleRemoveClick = (event, productId) => {
        event.stopPropagation();
        handleRemoveProduct(productId);
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
