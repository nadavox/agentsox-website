import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
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
