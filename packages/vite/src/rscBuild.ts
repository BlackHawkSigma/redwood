import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { rscAnalyzePlugin } from './waku-lib/vite-plugin-rsc'

/**
 * RSC build
 * Uses rscAnalyzePlugin to collect client and server entry points
 * Starts building the AST in entries.ts
 * Doesn't output any files, only collects a list of RSCs and RSFs
 */
export async function rscBuild(viteConfigPath: string) {
  const rwPaths = getPaths()
  const clientEntryFileSet = new Set<string>()
  const serverEntryFileSet = new Set<string>()

  if (!rwPaths.web.entries) {
    throw new Error('RSC entries file not found')
  }

  await viteBuild({
    configFile: viteConfigPath,
    root: rwPaths.base,
    plugins: [
      react(),
      {
        name: 'rsc-test-plugin',
        transform(_code, id) {
          console.log('rsc-test-plugin id', id)
        },
      },
      rscAnalyzePlugin(
        (id) => clientEntryFileSet.add(id),
        (id) => serverEntryFileSet.add(id)
      ),
    ],
    // ssr: {
    //   // FIXME Without this, waku/router isn't considered to have client
    //   // entries, and "No client entry" error occurs.
    //   // Unless we fix this, RSC-capable packages aren't supported.
    //   // This also seems to cause problems with pnpm.
    //   // noExternal: ['@redwoodjs/web', '@redwoodjs/router'],
    // },
    build: {
      manifest: 'rsc-build-manifest.json',
      write: false,
      ssr: true,
      rollupOptions: {
        input: {
          entries: rwPaths.web.entries,
        },
      },
    },
  })

  const clientEntryFiles = Object.fromEntries(
    Array.from(clientEntryFileSet).map((filename, i) => [`rsc${i}`, filename])
  )
  const serverEntryFiles = Object.fromEntries(
    Array.from(serverEntryFileSet).map((filename, i) => [`rsf${i}`, filename])
  )

  console.log('clientEntryFileSet', Array.from(clientEntryFileSet))
  console.log('serverEntryFileSet', Array.from(serverEntryFileSet))
  console.log('clientEntryFiles', clientEntryFiles)
  console.log('serverEntryFiles', serverEntryFiles)

  return { clientEntryFiles, serverEntryFiles }
}