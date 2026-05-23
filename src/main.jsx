import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Analytics } from '@vercel/analytics/react';
import '@mantine/core/styles.css';
import './index.css';
import App from './App.jsx';

const theme = createTheme({
  fontFamily: 'Figtree, system-ui, sans-serif',
  headings: {
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
  },
  primaryColor: 'cyan',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
      <Analytics />
    </MantineProvider>
  </StrictMode>,
);
