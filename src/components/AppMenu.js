import React from 'react';
import { Menu, MenuItem, Switch, FormControlLabel, ListItemIcon, ListItemText } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Correct import path
import NotificationsIcon from '@mui/icons-material/Notifications'; // Import NotificationsIcon

const AppMenu = ({ anchorEl, handleMenuClose, toggleTheme, themeMode, isMenuOpen, setIsMenuOpen, toggleShowOnlyCRStores, showOnlyCRStores, handleOpenNotificationSettings }) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={toggleTheme}>
                <ListItemIcon>
                    {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </ListItemIcon>
                <ListItemText primary={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
            </MenuItem>
            <MenuItem onClick={handleOpenNotificationSettings}>
                <ListItemIcon>
                    <NotificationsIcon />
                </ListItemIcon>
                <ListItemText primary="Notification Settings" />
            </MenuItem>
            <MenuItem>
                <FormControlLabel
                    control={<Switch checked={showOnlyCRStores} onChange={toggleShowOnlyCRStores} />}
                    label="Show only stores in Costa Rica"
                />
            </MenuItem>
        </Menu>
    );
};

export default AppMenu;
