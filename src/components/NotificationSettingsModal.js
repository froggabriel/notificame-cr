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
  const [selectedStores, setSelectedStores] = useState(notificationSettings.selectedStores);

  useEffect(() => {
    setInterval(notificationSettings.interval);
    setSelectedStores(notificationSettings.selectedStores);
  }, [notificationSettings]);

  const handleSave = () => {
    setNotificationSettings({ interval, selectedStores });
    handleClose();
  };

  const handleStoreChange = (chainId, newValue) => {
    setSelectedStores((prevSelectedStores) => ({
      ...prevSelectedStores,
      [chainId]: newValue
    }));
  };

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
        {Object.keys(notificationSettings.allStores).map((chainId) => (
          <Box key={chainId} sx={{ mb: 2 }}>
            <h3>Select Stores for {chainId === 'chain1' ? 'Auto Mercado' : 'PriceSmart'}</h3>
            <Autocomplete
              multiple
              options={notificationSettings.allStores[chainId]}
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
