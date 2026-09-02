import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Source uses JSX inside plain .js files (carried over from Create React App,
// which handled this via Babel). Two separate things need to be told about it:
//
// 1. Vite's own esbuild transform plugin (`vite:esbuild`) excludes `.js` from
//    esbuild transformation BY DEFAULT (createFilter(include, exclude) where
//    the default exclude is /\.js$/ — this veto applies even if you set a
//    custom `include`, so `exclude` must be reset too).
// 2. The dependency pre-bundling scanner (`optimizeDeps`) runs directly on
//    raw files via esbuild, independent of the plugin pipeline above, and
//    needs its own loader override.
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    port: 3000
  },
  preview: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  }
});
