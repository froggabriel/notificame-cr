import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Button, IconButton, Chip, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications'; // Import NotificationsIcon

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

const defaultAutoMercadoStores = [
  'AM Plaza del Sol',
  'AM Guadalupe',
  'AM Guayabos',
  'AM Tres Rios'
].sort();

const costaRicaStoreNames = ['Llorente', 'Escazú', 'Alajuela', 'Cartago', 'Zapote', 'Heredia', 'Tres Ríos', 'Liberia', 'Santa Ana'];

const NotificationSettingsModal = ({ open, handleClose, notificationSettings, setNotificationSettings }) => {
  const [interval, setInterval] = useState(notificationSettings.interval);
  const [selectedStores, setSelectedStores] = useState(notificationSettings.selectedStores || { chain1: [], chain2: [] });

  useEffect(() => {
    if (open) {
      console.log('Modal opened. Updating state with notificationSettings:', notificationSettings);
      setInterval(notificationSettings.interval);
      setSelectedStores(notificationSettings.selectedStores || { chain1: [], chain2: [] });

      // Set default stores for Auto Mercado if not already set
      if (!notificationSettings.selectedStores.chain1 || notificationSettings.selectedStores.chain1.length === 0) {
        const autoMercadoStores = notificationSettings.allStores.chain1.filter(store => defaultAutoMercadoStores.includes(store.name));
        setSelectedStores(prevSelectedStores => ({
          ...prevSelectedStores,
          chain1: autoMercadoStores
        }));
      }
    }
  }, [open, notificationSettings]);

  const handleSave = () => {
    const updatedSelectedStores = {
      chain1: selectedStores.chain1.sort((a, b) => a.name.localeCompare(b.name)) || [],
      chain2: selectedStores.chain2.sort((a, b) => a.name.localeCompare(b.name)) || []
    };
    console.log('Saving settings with interval:', interval, 'and selectedStores:', updatedSelectedStores);
    setNotificationSettings({ interval, selectedStores: updatedSelectedStores, allStores: notificationSettings.allStores });
    handleClose();
  };

  const handleStoreChange = (chainId, newValue) => {
    console.log('Store selection changed for', chainId, 'to', newValue);
    setSelectedStores((prevSelectedStores) => ({
      ...prevSelectedStores,
      [chainId]: newValue.sort((a, b) => a.name.localeCompare(b.name))
    }));
  };

  const allStores = notificationSettings.allStores || { chain1: [], chain2: [] };

  // Filter out already selected stores
  const availableStores = {
    chain1: allStores.chain1.filter(store => !selectedStores.chain1.some(selectedStore => selectedStore.storeId === store.storeId)),
    chain2: allStores.chain2.filter(store => !selectedStores.chain2.some(selectedStore => selectedStore.storeId === store.storeId))
  };

  // Prioritize Costa Rica locations at the top for chain2
  availableStores.chain2.sort((a, b) => {
    const isACR = costaRicaStoreNames.includes(a.name);
    const isBCR = costaRicaStoreNames.includes(b.name);
    if (isACR && !isBCR) return -1;
    if (!isACR && isBCR) return 1;
    return a.name.localeCompare(b.name);
  });

  console.log('Rendering modal with allStores:', allStores, 'and selectedStores:', selectedStores);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 1 }} /> {/* Add NotificationsIcon */}
            <h2>Notification Settings</h2>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <TextField
          label="Notification Interval (minutes)"
          variant="outlined"
          size="small"
          fullWidth
          type="number"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          sx={{ mb: 2 }}
        />
        {Object.keys(availableStores).map((chainId) => (
          <Box key={chainId} sx={{ mb: 2 }}>
            <h3>Select Stores for {chainId === 'chain1' ? 'Auto Mercado' : 'PriceSmart'}</h3>
            <Autocomplete
              multiple
              options={availableStores[chainId].sort((a, b) => {
                const isACR = costaRicaStoreNames.includes(a.name);
                const isBCR = costaRicaStoreNames.includes(b.name);
                if (isACR && !isBCR) return -1;
                if (!isACR && isBCR) return 1;
                return a.name.localeCompare(b.name);
              })}
              getOptionLabel={(option) => option.name}
              value={selectedStores[chainId] || []}
              onChange={(event, newValue) => handleStoreChange(chainId, newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option.storeId}
                    label={option.name}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label={`Select Stores for ${chainId === 'chain1' ? 'Auto Mercado' : 'PriceSmart'}`}
                  placeholder="Search stores"
                />
              )}
            />
          </Box>
        ))}
        <Button variant="contained" onClick={handleSave} fullWidth>
          Save
        </Button>
      </Box>
    </Modal>
  );
};

export default NotificationSettingsModal;
