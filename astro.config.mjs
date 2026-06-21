import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.antoniocumberbatch.com',
  redirects: {
    '/blog/four-ingredients-of-a-good-copilot-prompt': '/blog/good-chefs-saute-evenly-copilot-prompt-framework',
  },
  integrations: [],
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'learn.microsoft.com' },
      { protocol: 'https', hostname: 'follow.it' },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
