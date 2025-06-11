import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 10000,
    // --- THIS IS THE FIX! ---
    // We are telling Vite that it's okay to be accessed
    // from our new Render debug URL.
    hmr: {
      host: 'realm-debug.onrender.com'
    },
    watch: {
      usePolling: true
    }
  }
})
