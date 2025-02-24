import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, IconButton, Chip, Autocomplete, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Switch } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications'; // Import NotificationsIcon
import SaveIcon from '@mui/icons-material/Save'; // Import SaveIcon
import { ElegantButton } from './StyledComponents'; // Import ElegantButton

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

const NotificationSettingsModal = ({ open, handleClose, notificationSettings, setNotificationSettings, onSave }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationSettings.notificationsEnabled || false);
  const [unit, setUnit] = useState('minutes');
  const [value, setValue] = useState(notificationSettings.interval);
  const [selectedStores, setSelectedStores] = useState(notificationSettings.selectedStores || { chain1: [], chain2: [] });
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission); // Add state for notification permission

  useEffect(() => {
    if (open) {
      console.log('Modal opened. Updating state with notificationSettings:', notificationSettings);
      setNotificationsEnabled(notificationSettings.notificationsEnabled || false);
      setUnit('minutes');
      setValue(notificationSettings.interval);
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
    let interval;
    switch (unit) {
      case 'days':
        interval = value * 1440;
        break;
      case 'hours':
        interval = value * 60;
        break;
      case 'minutes':
      default:
        interval = value;
        break;
    }
    const updatedSelectedStores = {
      chain1: selectedStores.chain1.sort((a, b) => a.name.localeCompare(b.name)) || [],
      chain2: selectedStores.chain2.sort((a, b) => a.name.localeCompare(b.name)) || []
    };
    console.log('Saving settings with interval:', interval, 'and selectedStores:', updatedSelectedStores);
    const newSettings = { notificationsEnabled, interval, selectedStores: updatedSelectedStores, allStores: notificationSettings.allStores };
    setNotificationSettings(newSettings);

    // Persist settings to local storage
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));

    // Send settings to the service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_NOTIFICATION_SETTINGS',
        settings: newSettings
      });
    }

    if (onSave) {
      onSave(); // Call onSave to show Snackbar
    }
    handleClose();
  };

  const handleStoreChange = (chainId, newValue) => {
    console.log('Store selection changed for', chainId, 'to', newValue);
    setSelectedStores((prevSelectedStores) => ({
      ...prevSelectedStores,
      [chainId]: newValue.sort((a, b) => a.name.localeCompare(b.name))
    }));
  };

  const handleTestNotification = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TEST_NOTIFICATION'
      });
    }
  };

  const handleNotificationSwitchChange = async (event) => {
    if (event.target.checked && notificationPermission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setNotificationPermission(permission);
      } else {
        setNotificationsEnabled(false);
        setNotificationPermission(permission);
      }
    } else {
      setNotificationsEnabled(event.target.checked);
    }
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
        <FormControlLabel
          control={<Switch checked={notificationsEnabled} onChange={handleNotificationSwitchChange} />}
          label="Enable Notifications"
          sx={{ mb: 2 }}
        />
        {notificationsEnabled && (
          <>
            <ElegantButton variant="outlined" onClick={handleTestNotification} fullWidth sx={{ mb: 2 }}>
              Test Notification
            </ElegantButton>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Notification Interval</FormLabel>
              <RadioGroup row value={unit} onChange={(e) => setUnit(e.target.value)}>
                <FormControlLabel value="days" control={<Radio />} label="Days" />
                <FormControlLabel value="hours" control={<Radio />} label="Hours" />
                <FormControlLabel value="minutes" control={<Radio />} label="Minutes" />
              </RadioGroup>
            </FormControl>
            <TextField
              label={`Interval in ${unit}`}
              variant="outlined"
              size="small"
              fullWidth
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value, 10))}
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
          </>
        )}
        <ElegantButton variant="outlined" onClick={handleSave} fullWidth startIcon={<SaveIcon />}>
          Save
        </ElegantButton>
      </Box>
    </Modal>
  );
};

export default NotificationSettingsModal;
