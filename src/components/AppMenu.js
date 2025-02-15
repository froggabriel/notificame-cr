import React from 'react';
import { Menu, MenuItem, Typography, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const AppMenu = ({ anchorEl, handleMenuClose, toggleTheme, themeMode, isMenuOpen, setIsMenuOpen }) => {
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
            <MenuItem onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                <Typography sx={{ ml: 1 }}>{'Add Products'}</Typography>
            </MenuItem>
        </Menu>
    );
};

export default AppMenu;
