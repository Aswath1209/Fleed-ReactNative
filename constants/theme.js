const commonColors = {
    primary: "#00c26f",
    primaryDark: '#00Ac62',
    rose: '#ef4444',
    roseLight: '#f87171',
};

export const lightColors = {
    ...commonColors,
    background: '#ffffff',
    surface: '#ffffff',
    text: "#494949",
    textLight: '#7c7c7c',
    textDark: "#1d1d1d",
    gray: "#e3e3e3",
    border: 'rgba(0,0,0,0.05)',
    dark: "#3e3e3e",
    darkLight: '#e1e1e1',
};

export const darkColors = {
    ...commonColors,
    background: '#121212',
    surface: '#1e1e1e',
    text: "#e3e3e3",        // Invert text
    textLight: '#a0a0a0',   // Invert textLight
    textDark: "#ffffff",    // Invert textDark
    gray: "#333333",        // Invert gray
    border: 'rgba(255,255,255,0.1)',
    dark: "#e1e1e1",
    darkLight: '#2c2c2c',
};

export const theme = {
    colors: lightColors, // Default fallback
    fonts: {
        medium: '500',
        semiBold: '600',
        bold: '700',
        extraBold: '800',
    },
    radius: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 22
    }
};