import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Copy index.html into SPA route folders so Render static hosting can serve /login etc. */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', 'dist');
const indexHtml = path.join(dist, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('spa-fallback: dist/index.html missing — run vite build first');
  process.exit(1);
}

const routes = [
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'settings',
  'dashboard',
  'tasks',
  path.join('tasks', 'new'),
];

for (const route of routes) {
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(indexHtml, path.join(dir, 'index.html'));
  console.log(`spa-fallback: ${route}/index.html`);
}
