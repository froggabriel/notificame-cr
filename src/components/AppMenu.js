import React from 'react';
import { Menu, MenuItem, Typography, Switch, FormControlLabel } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const AppMenu = ({ anchorEl, handleMenuClose, toggleTheme, themeMode, isMenuOpen, setIsMenuOpen, toggleShowOnlyCRStores, showOnlyCRStores }) => {
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
        </Menu>
    );
};

export default AppMenu;
