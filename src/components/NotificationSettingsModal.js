import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Button, IconButton, Chip, Autocomplete } from '@mui/material';
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

const NotificationSettingsModal = ({ open, handleClose, notificationSettings, setNotificationSettings }) => {
  const [interval, setInterval] = useState(notificationSettings.interval);
  const [selectedStores, setSelectedStores] = useState(notificationSettings.selectedStores || { chain1: [], chain2: [] });

  useEffect(() => {
    if (open) {
      console.log('Modal opened. Updating state with notificationSettings:', notificationSettings);
      setInterval(notificationSettings.interval);
      setSelectedStores(notificationSettings.selectedStores || { chain1: [], chain2: [] });
    }
  }, [open, notificationSettings]);

  const handleSave = () => {
    const updatedSelectedStores = {
      chain1: selectedStores.chain1 || [],
      chain2: selectedStores.chain2 || []
    };
    console.log('Saving settings with interval:', interval, 'and selectedStores:', updatedSelectedStores);
    setNotificationSettings({ interval, selectedStores: updatedSelectedStores, allStores: notificationSettings.allStores });
    handleClose();
  };

  const handleStoreChange = (chainId, newValue) => {
    console.log('Store selection changed for', chainId, 'to', newValue);
    setSelectedStores((prevSelectedStores) => ({
      ...prevSelectedStores,
      [chainId]: newValue
    }));
  };

  const allStores = notificationSettings.allStores || { chain1: [], chain2: [] };
  console.log('Rendering modal with allStores:', allStores, 'and selectedStores:', selectedStores);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <h2>Notification Settings</h2>
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
        {Object.keys(allStores).map((chainId) => (
          <Box key={chainId} sx={{ mb: 2 }}>
            <h3>Select Stores for {chainId === 'chain1' ? 'Auto Mercado' : 'PriceSmart'}</h3>
            <Autocomplete
              multiple
              options={allStores[chainId]}
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
