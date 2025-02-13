import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';

const StoreDetailsDialog = ({ isOpen, onClose, storeDetails }) => {
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('name');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedStoreDetails = [...storeDetails].sort((a, b) => {
        if (orderBy === 'name') {
            return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else {
            return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
        }
    });

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Store Details</DialogTitle>
            <DialogContent>
                <TableContainer component={Paper}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => handleRequestSort('name')}
                                    >
                                        Store Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'hasInventory'}
                                        direction={orderBy === 'hasInventory' ? order : 'asc'}
                                        onClick={() => handleRequestSort('hasInventory')}
                                    >
                                        Inventory
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'basePrice'}
                                        direction={orderBy === 'basePrice' ? order : 'asc'}
                                        onClick={() => handleRequestSort('basePrice')}
                                    >
                                        Base Price
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'uomPrice'}
                                        direction={orderBy === 'uomPrice' ? order : 'asc'}
                                        onClick={() => handleRequestSort('uomPrice')}
                                    >
                                        UOM Price
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'percentDiscount'}
                                        direction={orderBy === 'percentDiscount' ? order : 'asc'}
                                        onClick={() => handleRequestSort('percentDiscount')}
                                    >
                                        Percent Discount
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={orderBy === 'hall'}
                                        direction={orderBy === 'hall' ? order : 'asc'}
                                        onClick={() => handleRequestSort('hall')}
                                    >
                                        Hall
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedStoreDetails.map((store) => (
                                <TableRow key={store.storeId}>
                                    <TableCell component="th" scope="row">
                                        {store.name}
                                    </TableCell>
                                    <TableCell align="right">{store.hasInventory ? 'Yes' : 'No'}</TableCell>
                                    <TableCell align="right">{store.basePrice}</TableCell>
                                    <TableCell align="right">{store.uomPrice}</TableCell>
                                    <TableCell align="right">{store.percentDiscount}</TableCell>
                                    <TableCell align="right">{store.hall}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default StoreDetailsDialog;
