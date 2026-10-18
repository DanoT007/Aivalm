import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aivalm.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
