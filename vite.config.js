import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Usamos resolve(process.cwd(), ...) para garantir que ele ache a raiz certinha
        main: resolve(process.cwd(), 'index.html'),
        agenda: resolve(process.cwd(), 'agenda.html')
      }
    }
  }
})
