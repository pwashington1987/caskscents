import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Where the site lives. Moving to a custom domain later means setting
// SITE_URL to the domain and BASE_PATH to "/" (see the README).
const site = process.env.SITE_URL ?? 'https://pwashington1987.github.io';
const base = process.env.BASE_PATH ?? '/caskscents';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
});
