import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router'))
            return 'react-vendor';
          if (id.includes('node_modules/@supabase'))
            return 'supabase';
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet'))
            return 'leaflet';
          if (id.includes('node_modules/lucide-react'))
            return 'lucide';
        },
      },
    },
  },
})
