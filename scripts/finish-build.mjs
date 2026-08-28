import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(target));
    else files.push(target);
  }
  return files;
}

// Inline the critical shell so parser-created resources remain available when
// Chromium enters offline mode during a navigation. Exact CSP hashes retain a
// strict policy without unsafe-inline.
const indexPath = join(dist, 'index.html');
let index = await readFile(indexPath, 'utf8');
const scriptMatch = index.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const styleMatch = index.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if (!scriptMatch || !styleMatch) throw new Error('Could not locate built app shell assets');
const script = (await readFile(join(dist, scriptMatch[1].slice(1)), 'utf8')).replaceAll('</script', '<\\/script');
const style = await readFile(join(dist, styleMatch[1].slice(1)), 'utf8');
index = index.replace(scriptMatch[0], `<script type="module">${script}</script>`).replace(styleMatch[0], `<style>${style}</style>`);
await writeFile(indexPath, index);

const digest = (input) => createHash('sha256').update(input).digest('base64');
const configPath = join(dist, 'staticwebapp.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
config.globalHeaders['Content-Security-Policy'] = config.globalHeaders['Content-Security-Policy']
  .replace("script-src 'self'", `script-src 'self' 'sha256-${digest(script)}'`)
  .replace("style-src 'self'", `style-src 'self' 'sha256-${digest(style)}'`);
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

for (const route of ['demo', 'privacy', 'terms']) {
  await mkdir(join(dist, route), { recursive: true });
  await cp(indexPath, join(dist, route, 'index.html'));
}
await cp(indexPath, join(dist, '404.html'));

const allFiles = await filesIn(dist);
const precache = allFiles
  .filter((file) => !file.endsWith('sw.js') && !file.endsWith('.map'))
  .map((file) => `/${relative(dist, file).replaceAll('\\', '/')}`);
const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 10);
const swPath = join(dist, 'sw.js');
const source = await readFile(swPath, 'utf8');
await writeFile(swPath, source.replace('__BUILD_VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache)));
