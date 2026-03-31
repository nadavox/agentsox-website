import { createContext, useState, useEffect, useCallback } from 'react';
import { applyTheme } from '../themes/applyTheme';

const STORAGE_KEY = 'agentsox-theme';
const DEFAULTS = { aesthetic: 'sleek', mode: 'dark', hasChosen: false };

export const ThemeContext = createContext(DEFAULTS);

function getInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        aesthetic: parsed.aesthetic || DEFAULTS.aesthetic,
        mode: parsed.mode || DEFAULTS.mode,
        hasChosen: parsed.hasChosen ?? DEFAULTS.hasChosen,
      };
    }
  } catch {
    // ignore parse errors
  }

  // Respect system preference for initial mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { ...DEFAULTS, mode: prefersDark ? 'dark' : 'light' };
}

export function ThemeProvider({ children }) {
  const [state, setState] = useState(getInitialState);

  // Apply theme on mount and every change
  useEffect(() => {
    applyTheme(state.aesthetic, state.mode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  // Auto-skip chooser when arriving via hash link (e.g. /#contact)
  useEffect(() => {
    if (!state.hasChosen && window.location.hash) {
      setState((prev) => ({ ...prev, hasChosen: true }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
