import { screenGraphPlugin } from "@animaapp/vite-plugin-screen-graph";
import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
// @ts-ignore - Type conflict between @animaapp plugin and vite versions
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && screenGraphPlugin()].filter(Boolean),
  publicDir: "./static",
  base: "./",
  build: {
    // Оптимизация для JUCE WebView
    target: 'es2015', // Совместимость с WebView
    minify: 'esbuild', // Встроенный минификатор (быстрее terser)
    rollupOptions: {
      input: {
        main: './index.html',
        'visual-tips': './visual-tips.html',
        'chat-visual-tips-2': './chat-visual-tips-2.html',
        'split-chat': './split-chat.html',
        'embed-chat': './embed-chat.html'
      },
      output: {
        // Инлайн маленьких assets для WebView
        inlineDynamicImports: false,
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        }
      }
    },
    // Оптимизация размера
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // Инлайнить файлы < 4KB
  },
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
}));
