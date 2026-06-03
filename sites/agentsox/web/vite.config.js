import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Brand assets live committed in public/brand (synced from the workspace
// `branding/` source via `npm run sync:brand`). The build is self-contained so
// it works in Cloudflare's remote git build — it never reaches outside this repo.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
})
