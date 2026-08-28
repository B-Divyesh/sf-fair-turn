import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    cssCodeSplit: false,
  },
});
