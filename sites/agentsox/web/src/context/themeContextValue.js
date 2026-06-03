import { createContext } from 'react';

export const DEFAULT_THEME_STATE = { aesthetic: 'sleek', mode: 'dark', hasChosen: true };

export const ThemeContext = createContext(DEFAULT_THEME_STATE);
