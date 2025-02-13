import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip, IconButton, Typography } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { JsonViewer } from '@textea/json-viewer';
import { useTheme } from '@mui/material/styles';

const ProductDialog = ({ isJsonDialogOpen, handleCloseJsonDialog, selectedProductJson, handleCopyJson, copySuccess }) => {
    const theme = useTheme();

    return (
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
                    <JsonViewer
                        value={selectedProductJson}
                        theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                        style={{ fontFamily: theme.typography.fontFamily }}
                    />
                ) : (
                    <Typography>No product selected.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseJsonDialog}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductDialog;
