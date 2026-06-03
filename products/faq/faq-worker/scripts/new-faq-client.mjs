#!/usr/bin/env node
// Scaffold a new FAQ client: generates <slug>.ts + <slug>.faq.json and registers
// the client in src/clients/index.ts. One command, no schema recall, can't forget
// the registry. Usage:
//   npm --workspace @agentsox/faq-worker run faq:new-client -- <slug> [email]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const slug = process.argv[2];
const email = process.argv[3]; // optional, recorded in account.email

if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: faq:new-client -- <slug> [email]');
  console.error('  <slug> must be lower-case letters/digits/dashes, e.g. "acme" or "taste-bistro".');
  process.exit(1);
}

const clientsDir = fileURLToPath(new URL('../src/clients/', import.meta.url));
const tsPath = `${clientsDir}${slug}.ts`;
const jsonPath = `${clientsDir}${slug}.faq.json`;
const indexPath = `${clientsDir}index.ts`;

// slug -> camelCase identifier + a const name, e.g. taste-bistro -> tasteBistroFaqClient
const camel = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const varName = `${camel}FaqClient`;
const titled = camel.charAt(0).toUpperCase() + camel.slice(1);

if (existsSync(tsPath) || existsSync(jsonPath)) {
  console.error(`A client "${slug}" already exists in src/clients/. Aborting.`);
  process.exit(1);
}

const faqJson = `{
  "company": { "name": "TODO ${titled}" },
  "faq": [
    { "question": "TODO a question visitors ask?", "answer": "TODO the answer." }
  ]
}
`;

const tsConfig = `import { defineFaqClient } from '@agentsox/faq-agent';
import knowledge from './${slug}.faq.json';

/**
 * ${titled} - FAQ bot config. Edit the FAQ content in ./${slug}.faq.json.
 * Belongs to clients/${email ?? '<email>'}/ in the workspace.
 */
export const ${varName} = defineFaqClient({
  id: '${slug}', // == the siteId the client's site sends
  account: { ${email ? `email: '${email}', ` : ''}name: 'TODO ${titled}' },
  identity: {
    brand: 'TODO ${titled}',
    persona: 'TODO one paragraph: who this assistant is and what the business does.',
    voice: ['TODO voice line, e.g. Warm and direct - plain words a real person says.'],
    // examples: [{ q: 'A real question', a: 'How the brand would answer it' }], // optional, calibrates tone
  },
  knowledge,
  // rules: ['TODO client policy. e.g. AgentsOX: never quote a price. A shop: always quote the menu price.'], // optional
  // handoff: { enabled: true, scope: 'You answer questions about ${titled}.', actionPhrase: 'book a call', ctaExample: 'Book a call about ...' }, // optional
  origins: ['https://TODO-${slug}-domain.com'], // PRODUCTION origins only (localhost added automatically off-prod)
  // ai: { model: 'deepseek/deepseek-v4-flash', temperature: 0.5 }, // optional per-client overrides
  // behavior: { chips: true }, // optional
});
`;

writeFileSync(jsonPath, faqJson);
writeFileSync(tsPath, tsConfig);

// Register in index.ts: add the import and the registry array entry (idempotent).
let index = readFileSync(indexPath, 'utf8');
if (!index.includes(`from './${slug}'`)) {
  index = index.replace(
    /(import \{ agentsoxFaqClient \} from '\.\/agentsox';\n)/,
    `$1import { ${varName} } from './${slug}';\n`,
  );
  index = index.replace(
    /(defineFaqClientRegistry\(\[\n)/,
    `$1  ${varName},\n`,
  );
  writeFileSync(indexPath, index);
}

console.log(`\n  Created src/clients/${slug}.ts and src/clients/${slug}.faq.json`);
console.log(`  Registered ${varName} in src/clients/index.ts\n`);
console.log('  Next:');
console.log(`    1. Fill in the TODOs in src/clients/${slug}.ts (brand, persona, voice, origins).`);
console.log(`       For a chat bubble: set handoff.url (e.g. https://wa.me/...) + the widget block.`);
console.log(`    2. Paste their Q/A into src/clients/${slug}.faq.json.`);
console.log('    3. npm --workspace @agentsox/faq-worker run typecheck');
console.log('    4. npm --workspace @agentsox/faq-worker run deploy');
console.log('    5. Put it on their site (one line) - see products/faq/faq-worker/INTEGRATION.md:\n');
console.log(`       <script src="https://faq.agentsox.com/widget.js" data-site-id="${slug}" async></script>`);
console.log(`\n       No-access fallback: link to  https://faq.agentsox.com/c/${slug}\n`);
