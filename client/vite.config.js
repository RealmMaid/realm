import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // This makes it accessible from outside the container
    port: process.env.PORT || 10000 // Uses the port Render provides
  }
})
