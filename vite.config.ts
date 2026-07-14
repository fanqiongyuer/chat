import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const normalizeBase = (value: string) => {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

const resolvePagesBase = () => {
  if (process.env.PAGES_BASE) {
    return normalizeBase(process.env.PAGES_BASE)
  }

  try {
    const remoteUrl = execSync('git config --get remote.origin.url', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()

    const match = remoteUrl.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
    const repoName = match?.[2]
    return repoName ? `/${repoName}/` : '/chat/'
  } catch {
    return '/chat/'
  }
}

export default defineConfig({
  plugins: [react()],
  base: process.env.BUILD_TARGET === 'pages' ? resolvePagesBase() : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
})
