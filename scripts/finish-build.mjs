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

const allFiles = await filesIn(dist);
const precache = allFiles
  .filter((file) => !file.endsWith('sw.js') && !file.endsWith('.map'))
  .map((file) => `/${relative(dist, file).replaceAll('\\', '/')}`);
const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 10);
const swPath = join(dist, 'sw.js');
const source = await readFile(swPath, 'utf8');
await writeFile(swPath, source.replace('__BUILD_VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache)));

// Keep the critical shell in one cached document. Besides saving two first-load
// round trips, this makes a just-installed board resilient to engines that apply
// offline mode before dispatching parser-created subresource requests.
const indexPath = join(dist, 'index.html');
let index = await readFile(indexPath, 'utf8');
const scriptMatch = index.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const styleMatch = index.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if (!scriptMatch || !styleMatch) throw new Error('Could not locate built app shell assets');
const script = (await readFile(join(dist, scriptMatch[1].slice(1)), 'utf8')).replaceAll('</script', '<\\/script');
const style = await readFile(join(dist, styleMatch[1].slice(1)), 'utf8');
index = index.replace(scriptMatch[0], `<script type="module">${script}</script>`).replace(styleMatch[0], `<style>${style}</style>`);
await writeFile(indexPath, index);

for (const route of ['privacy', 'terms']) {
  await mkdir(join(dist, route), { recursive: true });
  await cp(join(dist, 'index.html'), join(dist, route, 'index.html'));
}
