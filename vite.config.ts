import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				{ src: "preload.js", dest: "dist" },
				// { src: "src/assets", dest: "assets" },
			],
		}),
	],
	optimizeDeps: {
		exclude: ["lucide-react"],
	},
	// Ensure proper base path for both dev and production
	base: process.env.NODE_ENV === "production" ? "./" : "/",
	// Build output configuration
	build: {
		outDir: "dist",
		assetsDir: "assets",
		// Target Electron's Chromium version
		target: "chrome98", // Adjust based on your Electron version
		// Improve build performance
		rollupOptions: {
			output: {
				manualChunks: {
					// Split vendor libraries
					vendor: ["react", "react-dom"],
				},
			},
		},
	},
	// Resolve aliases for cleaner imports
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	// Development server configuration
	server: {
		port: 5173,
		// Only listen on localhost for security
		host: "localhost",
		// Open the app in browser automatically (optional)
		open: false,
	},
	// Environment variables prefix
	envPrefix: "VITE_",
});
