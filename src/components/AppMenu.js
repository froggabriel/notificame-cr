import React from 'react';
import { Menu, MenuItem, Switch, FormControlLabel, ListItemIcon, ListItemText, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Correct import path
import NotificationsIcon from '@mui/icons-material/Notifications'; // Import NotificationsIcon
import PublicIcon from '@mui/icons-material/Public'; // Import PublicIcon
import CostaRicaFlagIcon from './icons/CostaRicaFlagIcon'; // Import CostaRicaFlagIcon

const AppMenu = ({ anchorEl, handleMenuClose, toggleTheme, themeMode, isMenuOpen, setIsMenuOpen, toggleShowOnlyCRStores, showOnlyCRStores, handleOpenNotificationSettings }) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
        >
            <MenuItem>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PublicIcon />
                    <FormControlLabel
                        control={<Switch checked={showOnlyCRStores} onChange={toggleShowOnlyCRStores} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'gray' }, '& .MuiSwitch-switchBase': { color: 'gray' }, '& .MuiSwitch-switchBase + .MuiSwitch-track': { backgroundColor: 'gray' } }} />}
                        label=""
                        sx={{ mx: 1 }}
                    />
                    <CostaRicaFlagIcon />
                </Box>
            </MenuItem>
            <MenuItem>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Brightness7Icon />
                    <FormControlLabel
                        control={<Switch checked={themeMode === 'dark'} onChange={toggleTheme} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'gray' }, '& .MuiSwitch-switchBase': { color: 'gray' }, '& .MuiSwitch-switchBase + .MuiSwitch-track': { backgroundColor: 'gray' } }} />}
                        label=""
                        sx={{ mx: 1 }}
                    />
                    <Brightness4Icon />
                </Box>
            </MenuItem>
            <MenuItem onClick={handleOpenNotificationSettings}>
                <ListItemIcon>
                    <NotificationsIcon />
                </ListItemIcon>
                <ListItemText primary="Notifications" />
            </MenuItem>
        </Menu>
    );
};

export default AppMenu;
