import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeBase = (value: string) => {
  const withLeadingSlash = value.charAt(0) === '/' ? value : `/${value}`
  return withLeadingSlash.charAt(withLeadingSlash.length - 1) === '/' ? withLeadingSlash : `${withLeadingSlash}/`
}

const GITHUB_PAGES_DEFAULT_BASE = '/chat/'

const resolvePagesBase = () => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  const configuredBase = env.PAGES_BASE || GITHUB_PAGES_DEFAULT_BASE
  return normalizeBase(configuredBase)
}

const resolveBuildTarget = () => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  return env.BUILD_TARGET
}

export default defineConfig({
  plugins: [react()],
  base: resolveBuildTarget() === 'pages' ? resolvePagesBase() : '/',
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
})
