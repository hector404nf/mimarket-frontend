/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiPort = process.env.API_PORT || '8001'
    // Usar beforeFiles para asegurar que las rutas /api/* se proxyeen
    // antes de que Next intente resolver sus propias API routes.
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `http://localhost:${apiPort}/:path*`,
        },
        {
          source: '/v1/:path*',
          destination: `http://localhost:${apiPort}/v1/:path*`,
        },
      ],
    }
  },
}

export default nextConfig