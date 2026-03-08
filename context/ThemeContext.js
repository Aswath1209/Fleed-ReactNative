import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, theme as baseTheme } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Detects if the phone is set to Dark Mode
    const systemColorScheme = useColorScheme();
    const isDark = systemColorScheme === 'dark';
    
    // Choose the correct color palette based on system theme
    const colors = isDark ? darkColors : lightColors;
    
    // Build the dynamic theme object
    const theme = {
        ...baseTheme,
        colors
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook so any component can just call `const { theme } = useTheme()`
export const useTheme = () => useContext(ThemeContext);
