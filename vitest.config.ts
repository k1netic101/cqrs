import { defineConfig } from 'vitest/config';  // Vitest's defineConfig: Supports 'test'
import { mergeConfig } from 'vite';  // For merging with vite.config.ts
import viteConfig from './vite.config';  // Inherit build plugins/etc.

// Optional: If you have a setup file
// const testSetup = ['./tests/setup.ts'];

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,  // Enables describe/it/expect globally
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
    // setupFiles: testSetup,  // Array if multiple
    // Add test-specific plugins here if needed
    // pool: 'threads',  // For parallel tests
  },
  // Vitest can override Vite build if needed, but keep minimal
}));