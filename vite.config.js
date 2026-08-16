import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'json', 'typescript']
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          wasmoon: ['wasmoon'],
          rapier: ['@dimforge/rapier3d-compat']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['wasmoon', '@dimforge/rapier3d-compat']
  }
});
