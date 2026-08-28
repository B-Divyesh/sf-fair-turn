import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('release configuration regressions', () => {
  it('ships strict security headers, immutable asset caching, and a real 404 override', async () => {
    const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8'));
    expect(config.globalHeaders['Content-Security-Policy']).toContain("script-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).not.toContain('unsafe-inline');
    expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
    expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  });

  it('registers canonical and social metadata with a 1200 by 630 image', async () => {
    const html = await readFile('index.html', 'utf8');
    expect(html).toContain('<link rel="canonical" href="https://fair-turn.sociobot.in/"');
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="og:image:height" content="630"');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
  });

  it('build script emits static demo, legal, and not-found documents before precaching', async () => {
    const script = await readFile('scripts/finish-build.mjs', 'utf8');
    expect(script).toContain("['demo', 'privacy', 'terms']");
    expect(script).toContain("join(dist, '404.html')");
    expect(script).toContain("!file.endsWith('staticwebapp.config.json')");
  });

  it('keeps versioned offline caching and the update activation path', async () => {
    const worker = await readFile('public/sw.js', 'utf8');
    const app = await readFile('src/main.ts', 'utf8');
    expect(worker).toContain("const VERSION = 'fair-turn-__BUILD_VERSION__'");
    expect(worker).toContain("event.data?.type === 'SKIP_WAITING'");
    expect(worker).toContain('self.clients.claim()');
    expect(app).toContain("registration.addEventListener('updatefound'");
    expect(app).toContain("toast('An update is ready. Reload to use it.')");
  });
});
