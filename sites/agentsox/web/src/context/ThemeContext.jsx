import { useState, useEffect, useCallback } from 'react';
import { applyTheme } from '../themes/applyTheme';
import { DEFAULT_THEME_STATE, ThemeContext } from './themeContextValue';

const STORAGE_KEY = 'agentsox-theme';

function getInitialState() {
  return DEFAULT_THEME_STATE;
}

export function ThemeProvider({ children }) {
  const [state, setState] = useState(getInitialState);

  // Apply theme on mount and every change
  useEffect(() => {
    applyTheme(state.aesthetic, state.mode);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* localStorage unavailable */ }
  }, [state]);

  const setAesthetic = useCallback((aesthetic) => {
    setState((prev) => ({ ...prev, aesthetic }));
  }, []);

  const setMode = useCallback((mode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setState((prev) => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' }));
  }, []);

  const markChosen = useCallback(() => {
    setState((prev) => ({ ...prev, hasChosen: true }));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        aesthetic: state.aesthetic,
        mode: state.mode,
        hasChosen: state.hasChosen,
        setAesthetic,
        setMode,
        toggleMode,
        markChosen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
