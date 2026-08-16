// vite.config.js
import { defineConfig } from "file:///C:/Users/a2b/Downloads/wtv/node_modules/vite/dist/node/index.js";
import wasm from "file:///C:/Users/a2b/Downloads/wtv/node_modules/vite-plugin-wasm/exports/import.mjs";
import topLevelAwait from "file:///C:/Users/a2b/Downloads/wtv/node_modules/vite-plugin-top-level-await/exports/import.mjs";
import monacoEditorPlugin from "file:///C:/Users/a2b/Downloads/wtv/node_modules/vite-plugin-monaco-editor/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    monacoEditorPlugin.default({
      languageWorkers: ["editorWorkerService", "json", "typescript"]
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 3e3,
    cors: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          wasmoon: ["wasmoon"],
          rapier: ["@dimforge/rapier3d-compat"]
        }
      }
    }
  },
  optimizeDeps: {
    include: ["wasmoon", "@dimforge/rapier3d-compat"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhMmJcXFxcRG93bmxvYWRzXFxcXHd0dlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYTJiXFxcXERvd25sb2Fkc1xcXFx3dHZcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2EyYi9Eb3dubG9hZHMvd3R2L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgd2FzbSBmcm9tICd2aXRlLXBsdWdpbi13YXNtJztcbmltcG9ydCB0b3BMZXZlbEF3YWl0IGZyb20gJ3ZpdGUtcGx1Z2luLXRvcC1sZXZlbC1hd2FpdCc7XG5pbXBvcnQgbW9uYWNvRWRpdG9yUGx1Z2luIGZyb20gJ3ZpdGUtcGx1Z2luLW1vbmFjby1lZGl0b3InO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgd2FzbSgpLFxuICAgIHRvcExldmVsQXdhaXQoKSxcbiAgICBtb25hY29FZGl0b3JQbHVnaW4uZGVmYXVsdCh7XG4gICAgICBsYW5ndWFnZVdvcmtlcnM6IFsnZWRpdG9yV29ya2VyU2VydmljZScsICdqc29uJywgJ3R5cGVzY3JpcHQnXVxuICAgIH0pXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICBwb3J0OiAzMDAwLFxuICAgIGNvcnM6IHRydWUsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0Nyb3NzLU9yaWdpbi1PcGVuZXItUG9saWN5JzogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICdDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5JzogJ3JlcXVpcmUtY29ycCdcbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHRocmVlOiBbJ3RocmVlJ10sXG4gICAgICAgICAgd2FzbW9vbjogWyd3YXNtb29uJ10sXG4gICAgICAgICAgcmFwaWVyOiBbJ0BkaW1mb3JnZS9yYXBpZXIzZC1jb21wYXQnXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ3dhc21vb24nLCAnQGRpbWZvcmdlL3JhcGllcjNkLWNvbXBhdCddXG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwUSxTQUFTLG9CQUFvQjtBQUN2UyxPQUFPLFVBQVU7QUFDakIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyx3QkFBd0I7QUFFL0IsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsS0FBSztBQUFBLElBQ0wsY0FBYztBQUFBLElBQ2QsbUJBQW1CLFFBQVE7QUFBQSxNQUN6QixpQkFBaUIsQ0FBQyx1QkFBdUIsUUFBUSxZQUFZO0FBQUEsSUFDL0QsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLDhCQUE4QjtBQUFBLE1BQzlCLGdDQUFnQztBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osT0FBTyxDQUFDLE9BQU87QUFBQSxVQUNmLFNBQVMsQ0FBQyxTQUFTO0FBQUEsVUFDbkIsUUFBUSxDQUFDLDJCQUEyQjtBQUFBLFFBQ3RDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsV0FBVywyQkFBMkI7QUFBQSxFQUNsRDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
