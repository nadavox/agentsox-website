import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  existsSync,
  cpSync,
  mkdirSync,
  createReadStream,
  statSync,
} from 'node:fs'
import { dirname, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Brand assets are the single source of truth at the workspace root (outside this
// repo). They are copied into the build output at build time and served from there
// in dev. NOTE: builds must run locally where this sibling folder exists (we deploy
// via local `wrangler deploy`).
const BRANDING = resolve(__dirname, '../../../branding')
if (!existsSync(BRANDING)) {
  throw new Error(
    `Brand source not found at ${BRANDING}. The web build needs the workspace ` +
      `"branding/" folder one level above agentsox-website. Run the build locally ` +
      `from ~/agentsox where branding/ exists.`
  )
}

// Served path (under dist/ and the dev server) -> source file inside branding/.
// The served layout is flat under /brand/ (unchanged from before); the source is
// structured. This map is the single place that bridges the two.
const FILE_MAP = {
  'brand/agentsox-mark.svg': 'logo/icon/agentsox-mark.svg',
  'brand/agentsox-logo-lockup.svg': 'logo/full-color/agentsox-logo-lockup.svg',
  'brand/agentsox-logo-concept.png': 'logo/full-color/agentsox-logo-concept.png',
  'brand/agentsox-google-workspace-logo.png': 'logo/full-color/agentsox-google-workspace-logo.png',
  'brand/agentsox-google-workspace-logo-small.png': 'logo/full-color/agentsox-google-workspace-logo-small.png',
  'brand/tokens.json': 'tokens.json',
  'brandbook.html': 'brand-book/brandbook.html',
}
// Served dir -> source dir, copied recursively (preserves filenames).
const DIR_MAP = { 'brand/founder': 'founder' }

const MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.html': 'text/html',
  '.md': 'text/markdown',
}

// Copies the flat /brand/* + /brandbook.html paths from the structured branding/
// source — at build (into dist/) and in dev (via a middleware).
function brandAssets() {
  return {
    name: 'agentsox-brand-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0].replace(/^\/+/, '')
        let file
        if (FILE_MAP[url]) {
          file = resolve(BRANDING, FILE_MAP[url])
        } else {
          for (const [d, s] of Object.entries(DIR_MAP)) {
            if (url.startsWith(d + '/')) {
              file = resolve(BRANDING, s, url.slice(d.length + 1))
              break
            }
          }
        }
        if (file && existsSync(file) && statSync(file).isFile()) {
          res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
          createReadStream(file).pipe(res)
          return
        }
        next()
      })
    },
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      for (const [served, src] of Object.entries(FILE_MAP)) {
        const to = resolve(dist, served)
        mkdirSync(dirname(to), { recursive: true })
        cpSync(resolve(BRANDING, src), to)
      }
      for (const [servedDir, srcDir] of Object.entries(DIR_MAP)) {
        cpSync(resolve(BRANDING, srcDir), resolve(dist, servedDir), { recursive: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), brandAssets()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
})
