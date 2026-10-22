import { defineConfig } from 'astro/config';

// If the Vercel address changes, update `site` here and SITE.url in src/lib/i18n.ts.
export default defineConfig({
  site: 'https://monsoonledger.vercel.app',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
