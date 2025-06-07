import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  applyRandomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
  systemTheme: 'light',
  applyRandomColors: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<Theme>('track4health_theme', 'light');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  
  // Determine the resolved theme (what's actually applied)
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  
  // Update the document class based on the resolved theme
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Apply the resolved theme
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);
  
  // Detect system preference
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(query.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);
  
  // Function to apply random colors to UI elements
  const applyRandomColors = () => {
    const isDark = resolvedTheme === 'dark';
    
    // Function to generate a random color
    const getRandomColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = isDark ? '70%' : '85%';
      const lightness = isDark ? '25%' : '65%';
      return `hsl(${hue}, ${saturation}, ${lightness})`;
    };
    
    // Apply random colors to avatars, cards, etc.
    document.querySelectorAll('[data-random-color="true"]').forEach(element => {
      (element as HTMLElement).style.backgroundColor = getRandomColor();
    });
    
    // Special handling for ensuring text contrast
    document.querySelectorAll('[data-ensure-contrast="true"]').forEach(element => {
      const bgColor = getRandomColor();
      const textColor = isDark ? 'white' : 'black';
      
      (element as HTMLElement).style.backgroundColor = bgColor;
      (element as HTMLElement).style.color = textColor;
    });
  };
  
  // Apply random colors on theme change and on component mount
  useEffect(() => {
    applyRandomColors();
    
    // Also refresh colors on page navigation
    const handleRouteChange = () => {
      setTimeout(applyRandomColors, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [resolvedTheme]);
  
  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      resolvedTheme, 
      systemTheme,
      applyRandomColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
