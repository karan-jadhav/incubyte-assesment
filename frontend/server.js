import { stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'

const port = Number(process.env.PORT ?? 3000)
const distRoot = resolve(import.meta.dir, 'dist')
const fallbackPath = resolve(distRoot, 'index.html')

Bun.serve({
  port,
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          Allow: 'GET, HEAD',
        },
      })
    }

    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return textResponse('ok\n', request.method, {
        'Cache-Control': 'no-store',
      })
    }

    const requestedPath = parsePathname(url.pathname)
    if (!requestedPath) {
      return new Response('Bad Request', { status: 400 })
    }

    const staticPath = requestedPath === '/' ? '/index.html' : requestedPath
    const filePath = resolve(distRoot, `.${staticPath}`)

    if (isPathInsideDist(filePath) && (await isFile(filePath))) {
      return fileResponse(
        filePath,
        request.method,
        cacheHeadersForFile(filePath),
      )
    }

    if (await isFile(fallbackPath)) {
      return fileResponse(fallbackPath, request.method, {
        'Cache-Control': 'no-cache',
      })
    }

    return new Response('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  },
})

console.log(`Production server running on http://localhost:${port}`)

function parsePathname(pathname) {
  try {
    const decodedPathname = decodeURIComponent(pathname)
    if (decodedPathname.includes('\0')) {
      return null
    }
    return decodedPathname
  } catch {
    return null
  }
}

function isPathInsideDist(filePath) {
  const relativePath = relative(distRoot, filePath)
  return (
    relativePath !== '' &&
    !relativePath.startsWith('..') &&
    !isAbsolute(relativePath)
  )
}

function cacheHeadersForFile(filePath) {
  if (filePath === fallbackPath || filePath.endsWith('/index.html')) {
    return {
      'Cache-Control': 'no-cache',
    }
  }

  if (filePath.includes('/assets/')) {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
    }
  }

  return {
    'Cache-Control': 'public, max-age=3600',
  }
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

function fileResponse(filePath, method, headers = {}) {
  const file = Bun.file(filePath)
  return new Response(method === 'HEAD' ? null : file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...headers,
    },
  })
}

function textResponse(text, method, headers = {}) {
  return new Response(method === 'HEAD' ? null : text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...headers,
    },
  })
}
