import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), basicSsl()],
  base: '/grid-client/',
  server: {
    host: true, // Equivalent to running --host
    allowedHosts: true // 👈 CRITICAL: Tells Vite to accept connections from your phone's IP
  }
})
