// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Open item 4: set the real domain here and in src/data/site.ts.
export default defineConfig({
  site: 'https://silmun.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !/\/(thanks|404)\/?$/.test(page),
    }),
  ],
});
