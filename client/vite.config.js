import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build') {
    let api
    try {
      api = new URL(environment.VITE_API_URL)
    } catch {
      /* Show the configuration error below. */
    }
    if (
      !api ||
      api.protocol !== 'https:' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname)
    ) {
      throw new Error(
        'Set VITE_API_URL to the public HTTPS API origin before building. See docs/DEPLOYMENT.md.',
      )
    }
    if (
      api.pathname !== '/' ||
      api.search ||
      api.hash ||
      api.username ||
      api.password
    ) {
      throw new Error(
        'VITE_API_URL must be an origin, without /api, credentials, query parameters or a fragment.',
      )
    }
  }
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      include: ['src/**/*.test.{js,jsx}'],
    },
  }
})
