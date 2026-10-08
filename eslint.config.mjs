import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  {
    ignores: [
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      'next-env.d.ts',
      'app/lib/placeholder-data.ts',
      'scripts/seed.js',
      'node_modules/**',
    ],
  },
  ...nextVitals,
]);