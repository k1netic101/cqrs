import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,  // Adds types export
      rollupTypes: true,  // Bundles .d.ts into single file
      exclude: ['vitest.config.ts', 'tests/**'],  // Skip tests
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),  // Your main entry
      name: 'cqrsShared',  // Global var for UMD (optional)
      formats: ['es', 'cjs'],  // ESM + CJS
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [],  // No externals; bundle everything (pure TS)
      output: {
        globals: {},  // UMD globals if needed
      },
    },
    sourcemap: true,  // For debugging
    minify: false,  // Keep readable for lib
    target: 'ES2022',  // Matches your tsconfig
  },
  
});