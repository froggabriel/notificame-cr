import React from 'react';
import { Menu, MenuItem, Typography, Switch, FormControlLabel } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const AppMenu = ({ anchorEl, handleMenuClose, toggleTheme, themeMode, isMenuOpen, setIsMenuOpen, toggleShowOnlyCRStores, showOnlyCRStores, handleOpenNotificationSettings }) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={toggleTheme}>
                {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                <Typography sx={{ ml: 1 }}>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Typography>
            </MenuItem>
            <MenuItem>
                <FormControlLabel
                    control={<Switch checked={showOnlyCRStores} onChange={toggleShowOnlyCRStores} />}
                    label="Show only stores in Costa Rica"
                />
            </MenuItem>
            <MenuItem onClick={handleOpenNotificationSettings}>
                <Typography>Notification Settings</Typography>
            </MenuItem>
        </Menu>
    );
};

export default AppMenu;
