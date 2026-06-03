#!/usr/bin/env node
// sync-brand.mjs — copy brand assets from the workspace `branding/` source into
// this app's public/ folder (committed). Run locally whenever branding/ changes:
//   npm run sync:brand
// The committed copies are what the build (local AND Cloudflare remote) uses, so
// the build never depends on the external branding/ folder. branding/ stays the
// single authoring source of truth.

import { cpSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BRANDING = resolve(__dirname, '../../../branding')
const PUBLIC = resolve(__dirname, 'public')

// served path under public/ -> source file inside branding/
const FILE_MAP = {
  'brand/agentsox-mark.svg': 'logo/icon/agentsox-mark.svg',
  'brand/agentsox-logo-lockup.svg': 'logo/full-color/agentsox-logo-lockup.svg',
  'brand/agentsox-logo-concept.png': 'logo/full-color/agentsox-logo-concept.png',
  'brand/agentsox-google-workspace-logo.png': 'logo/full-color/agentsox-google-workspace-logo.png',
  'brand/agentsox-google-workspace-logo-small.png': 'logo/full-color/agentsox-google-workspace-logo-small.png',
  'brand/tokens.json': 'tokens.json',
  'brandbook.html': 'brand-book/brandbook.html',
}
const DIR_MAP = { 'brand/founder': 'founder' }

for (const [dest, src] of Object.entries(FILE_MAP)) {
  const to = resolve(PUBLIC, dest)
  mkdirSync(dirname(to), { recursive: true })
  cpSync(resolve(BRANDING, src), to)
}
for (const [destDir, srcDir] of Object.entries(DIR_MAP)) {
  cpSync(resolve(BRANDING, srcDir), resolve(PUBLIC, destDir), { recursive: true })
}
console.log('Synced brand assets from branding/ into public/')
