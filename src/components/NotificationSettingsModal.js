import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, IconButton, Chip, Autocomplete, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Switch, Snackbar, Alert, Typography, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications'; // Import NotificationsIcon
import SaveIcon from '@mui/icons-material/Save'; // Import SaveIcon
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Import CheckCircleIcon
import CancelIcon from '@mui/icons-material/Cancel'; // Import CancelIcon
import { ElegantButton } from './StyledComponents'; // Import ElegantButton
import { getFromDB, saveToDB } from '../utils/indexedDB'; // Import IndexedDB utility functions

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  maxHeight: '90vh', // Add maxHeight
  overflowY: 'auto', // Add overflowY
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const defaultAutoMercadoStores = [
  'AM Guadalupe',
  'AM Guayabos',
  'AM Moravia',
  'AM Plaza del Sol',
  'AM Tres Rios'
].sort();

const defaultPriceSmartStores = [
  'Llorente',
  'Tres Ríos',
  'Zapote'
];

const costaRicaStoreNames = ['Llorente', 'Escazú', 'Alajuela', 'Cartago', 'Zapote', 'Heredia', 'Tres Ríos', 'Liberia', 'Santa Ana'];

const NotificationSettingsModal = ({ open, handleClose, notificationSettings, setNotificationSettings, onSave }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationSettings.notificationsEnabled || false);
  const [unit, setUnit] = useState('minutes');
  const [value, setValue] = useState(notificationSettings.interval);
  const [selectedStores, setSelectedStores] = useState(notificationSettings.selectedStores || { chain1: [], chain2: [] });
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission); // Add state for notification permission
  const [periodicSyncAllowed, setPeriodicSyncAllowed] = useState(false); // Add state for periodic sync permission
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Add state for Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Add state for Snackbar message

  useEffect(() => {
    if (open) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Modal opened. Updating state with notificationSettings:', notificationSettings);
      }
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

      // Set default stores for PriceSmart if not already set
      if (!notificationSettings.selectedStores.chain2 || notificationSettings.selectedStores.chain2.length === 0) {
        const priceSmartStores = notificationSettings.allStores.chain2.filter(store => defaultPriceSmartStores.includes(store.name));
        setSelectedStores(prevSelectedStores => ({
          ...prevSelectedStores,
          chain2: priceSmartStores
        }));
      }
    }
  }, [open, notificationSettings]);

  useEffect(() => {
    if ('periodicSync' in navigator.serviceWorker) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.periodicSync.getTags().then((tags) => {
          setPeriodicSyncAllowed(tags.includes('check-product-availability'));
          if (process.env.NODE_ENV === 'development') {
            console.log('Periodic sync tags:', tags); // Add logging
          }
        }).catch((error) => {
          setPeriodicSyncAllowed(false);
          if (process.env.NODE_ENV === 'development') {
            console.error('Error getting periodic sync tags:', error); // Add logging
          }
        });
      }).catch((error) => {
        setPeriodicSyncAllowed(false);
        if (process.env.NODE_ENV === 'development') {
          console.error('Error during service worker registration:', error); // Add logging
        }
      });
    } else {
      setPeriodicSyncAllowed(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('Periodic sync is not supported in this browser.'); // Add logging
      }
    }
  }, []);

  const handleSave = async () => {
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving settings with interval:', interval, 'and selectedStores:', updatedSelectedStores);
    }
    const newSettings = { notificationsEnabled, interval, selectedStores: updatedSelectedStores, allStores: notificationSettings.allStores };
    setNotificationSettings(newSettings);

    // Persist settings to IndexedDB
    await saveToDB('notificationSettings', newSettings);

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
    if (process.env.NODE_ENV === 'development') {
      console.log('Store selection changed for', chainId, 'to', newValue);
    }
    setSelectedStores((prevSelectedStores) => ({
      ...prevSelectedStores,
      [chainId]: newValue.sort((a, b) => a.name.localeCompare(b.name))
    }));
  };

  const handleTestNotification = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending test notification'); // Add logging
    }
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('Service worker controller found. Sending TEST_NOTIFICATION message.'); // Add logging
      navigator.serviceWorker.controller.postMessage({
        type: 'TEST_NOTIFICATION'
      });
    } else {
      console.log("navigator: ", navigator)
      console.log('Service worker controller not found. Cannot send TEST_NOTIFICATION message.'); // Add logging
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
        setSnackbarMessage('Notification permission denied. Please enable notifications in your browser settings.');
        setSnackbarOpen(true);
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
        <Divider sx={{ mb: 2 }} />
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Required Permissions</FormLabel>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 2, mt: 2 }}>
            {notificationPermission === 'granted' ? (
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            ) : (
              <CancelIcon color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">Notifications Permission</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 2 }}>
            {periodicSyncAllowed ? (
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            ) : (
              <CancelIcon color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">Periodic Sync Permission</Typography>
          </Box>
        </FormControl>
        {(!notificationPermission) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            To enable notifications, please ensure that notifications are allowed in your browser settings and that periodic sync is enabled.
          </Alert>
        )}
        {notificationsEnabled && (
          <>
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
                <Typography variant="h6" sx={{ mb: 1 }}>Select Stores for {chainId === 'chain1' ? 'Auto Mercado' : 'PriceSmart'}</Typography>
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
        <ElegantButton variant="outlined" onClick={handleTestNotification} fullWidth sx={{ mb: 2 }}>
          Test Notification
        </ElegantButton>
        <ElegantButton variant="outlined" onClick={handleSave} fullWidth startIcon={<SaveIcon />}>
          Save
        </ElegantButton>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
};

export default NotificationSettingsModal;
