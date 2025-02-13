import React, { createContext, useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export const ThemeContext = createContext();

const ThemeProviderWrapper = ({ children }) => {
    // Get system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Get stored preference or fallback to system
    const storedTheme = localStorage.getItem("theme") || (prefersDark ? "dark" : "light");

    const [themeMode, setThemeMode] = useState(storedTheme);

    useEffect(() => {
        localStorage.setItem("theme", themeMode);
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode(prevMode => (prevMode === "light" ? "dark" : "light"));
    };

    const theme = createTheme({
        palette: {
            mode: themeMode,
        },
    });

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeProviderWrapper;
