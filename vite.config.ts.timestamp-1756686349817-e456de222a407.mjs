// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import { viteStaticCopy } from "file:///home/project/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "preload.js", dest: "dist" },
        { src: "src/assets", dest: "dist/assets" }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  // Ensuring proper base path for both dev and production
  base: process.env.NODE_ENV === "production" ? "./" : "/",
  // Build output configuration
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Target Electron's Chromium version
    target: "chrome98",
    // Adjust based on your Electron version
    // Improve build performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ["react", "react-dom"]
        }
      }
    }
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@assets": path.resolve(__vite_injected_original_dirname, "./src/assets")
    }
  },
  // Development server configuration
  server: {
    port: 5173,
    // Only listen on localhost for security
    host: "localhost",
    // Open the app in browser automatically (optional)
    open: false
  },
  // Environment variables prefix
  envPrefix: "VITE_"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSBcInZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5XCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRwbHVnaW5zOiBbXG5cdFx0cmVhY3QoKSxcblx0XHR2aXRlU3RhdGljQ29weSh7XG5cdFx0XHR0YXJnZXRzOiBbXG5cdFx0XHRcdHsgc3JjOiBcInByZWxvYWQuanNcIiwgZGVzdDogXCJkaXN0XCIgfSxcblx0XHRcdFx0eyBzcmM6IFwic3JjL2Fzc2V0c1wiLCBkZXN0OiBcImRpc3QvYXNzZXRzXCIgfSxcblx0XHRcdF0sXG5cdFx0fSksXG5cdF0sXG5cdG9wdGltaXplRGVwczoge1xuXHRcdGV4Y2x1ZGU6IFtcImx1Y2lkZS1yZWFjdFwiXSxcblx0fSxcblx0Ly8gRW5zdXJpbmcgcHJvcGVyIGJhc2UgcGF0aCBmb3IgYm90aCBkZXYgYW5kIHByb2R1Y3Rpb25cblx0YmFzZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiID8gXCIuL1wiIDogXCIvXCIsXG5cdC8vIEJ1aWxkIG91dHB1dCBjb25maWd1cmF0aW9uXG5cdGJ1aWxkOiB7XG5cdFx0b3V0RGlyOiBcImRpc3RcIixcblx0XHRhc3NldHNEaXI6IFwiYXNzZXRzXCIsXG5cdFx0Ly8gVGFyZ2V0IEVsZWN0cm9uJ3MgQ2hyb21pdW0gdmVyc2lvblxuXHRcdHRhcmdldDogXCJjaHJvbWU5OFwiLCAvLyBBZGp1c3QgYmFzZWQgb24geW91ciBFbGVjdHJvbiB2ZXJzaW9uXG5cdFx0Ly8gSW1wcm92ZSBidWlsZCBwZXJmb3JtYW5jZVxuXHRcdHJvbGx1cE9wdGlvbnM6IHtcblx0XHRcdG91dHB1dDoge1xuXHRcdFx0XHRtYW51YWxDaHVua3M6IHtcblx0XHRcdFx0XHQvLyBTcGxpdCB2ZW5kb3IgbGlicmFyaWVzXG5cdFx0XHRcdFx0dmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0fSxcblx0fSxcblx0Ly8gUmVzb2x2ZSBhbGlhc2VzIGZvciBjbGVhbmVyIGltcG9ydHNcblx0cmVzb2x2ZToge1xuXHRcdGFsaWFzOiB7XG5cdFx0XHRcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcblx0XHRcdFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2Fzc2V0c1wiKSxcblx0XHR9LFxuXHR9LFxuXHQvLyBEZXZlbG9wbWVudCBzZXJ2ZXIgY29uZmlndXJhdGlvblxuXHRzZXJ2ZXI6IHtcblx0XHRwb3J0OiA1MTczLFxuXHRcdC8vIE9ubHkgbGlzdGVuIG9uIGxvY2FsaG9zdCBmb3Igc2VjdXJpdHlcblx0XHRob3N0OiBcImxvY2FsaG9zdFwiLFxuXHRcdC8vIE9wZW4gdGhlIGFwcCBpbiBicm93c2VyIGF1dG9tYXRpY2FsbHkgKG9wdGlvbmFsKVxuXHRcdG9wZW46IGZhbHNlLFxuXHR9LFxuXHQvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXMgcHJlZml4XG5cdGVudlByZWZpeDogXCJWSVRFX1wiLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxzQkFBc0I7QUFIL0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBLElBQ1IsTUFBTTtBQUFBLElBQ04sZUFBZTtBQUFBLE1BQ2QsU0FBUztBQUFBLFFBQ1IsRUFBRSxLQUFLLGNBQWMsTUFBTSxPQUFPO0FBQUEsUUFDbEMsRUFBRSxLQUFLLGNBQWMsTUFBTSxjQUFjO0FBQUEsTUFDMUM7QUFBQSxJQUNELENBQUM7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDYixTQUFTLENBQUMsY0FBYztBQUFBLEVBQ3pCO0FBQUE7QUFBQSxFQUVBLE1BQU0sUUFBUSxJQUFJLGFBQWEsZUFBZSxPQUFPO0FBQUE7QUFBQSxFQUVyRCxPQUFPO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUE7QUFBQSxJQUVYLFFBQVE7QUFBQTtBQUFBO0FBQUEsSUFFUixlQUFlO0FBQUEsTUFDZCxRQUFRO0FBQUEsUUFDUCxjQUFjO0FBQUE7QUFBQSxVQUViLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxRQUM5QjtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUixPQUFPO0FBQUEsTUFDTixLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDcEMsV0FBVyxLQUFLLFFBQVEsa0NBQVcsY0FBYztBQUFBLElBQ2xEO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUVOLE1BQU07QUFBQTtBQUFBLElBRU4sTUFBTTtBQUFBLEVBQ1A7QUFBQTtBQUFBLEVBRUEsV0FBVztBQUNaLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
