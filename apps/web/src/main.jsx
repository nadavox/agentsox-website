import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
// Only the Mantine component styles this app actually uses, instead of the full
// 252kB styles.css. Base layers first, then per-component (Button → UnstyledButton,
// Card → Paper, TextInput → Input).
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/UnstyledButton.css';
import '@mantine/core/styles/Button.css';
import '@mantine/core/styles/Paper.css';
import '@mantine/core/styles/Card.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/Stack.css';
import '@mantine/core/styles/Text.css';
import '@mantine/core/styles/Input.css';
import '@mantine/core/styles/ScrollArea.css';
import './themes/theme-fallback.css';
import './index.css';
import App from './App.jsx';

const theme = createTheme({
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Space Grotesk, system-ui, sans-serif',
  },
  primaryColor: 'cyan',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
);
