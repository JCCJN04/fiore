import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    {
      name: 'html-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/login' || req.url === '/login/') {
            req.url = '/login.html'
          } else if (req.url === '/admin' || req.url === '/admin/') {
            req.url = '/admin.html'
          }
          next()
        })
      },
    },
  ],
})
