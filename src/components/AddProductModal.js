import React from 'react';
import { Modal, Box, TextField, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

const AddProductModal = ({ open, handleClose, newProductId, setNewProductId, handleAddProduct }) => {
    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <h2>Add Product</h2>
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <TextField
                    label="Product ID or URL"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Button variant="contained" onClick={handleAddProduct} fullWidth>
                    Add Product
                </Button>
            </Box>
        </Modal>
    );
};

export default AddProductModal;
