import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.antoniocumberbatch.com',
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
