/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable to prevent double requests in production
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },

  // Прогрессивная загрузка и оптимизации
  poweredByHeader: false,
  compress: true,
  
  // Экспериментальные настройки (минимальные для быстрой сборки)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
    ],
    scrollRestoration: true,
  },

  // Длинный кеш для статических ресурсов из public/
  async headers() {
    return [
      {
        source: '/:path*.(svg|png|jpg|jpeg|webp|avif|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Настройки webpack для максимальной оптимизации
  webpack: (config, { dev, isServer }) => {
    // Monaco Editor - динамическая загрузка
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Оптимизация шрифтов с предзагрузкой
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name].[contenthash:8][ext]',
      },
    })

    return config
  },

  // Развитые настройки для development
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 60 * 1000, // 1 минута
      pagesBufferLength: 5,
    },
  }),

  // Production оптимизации (всегда для Docker)
  output: 'standalone',

  // Оптимизация трейсинга для ускорения сборки
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild',
      'node_modules/webpack',
      'node_modules/terser',
    ],
  },
}

export default nextConfig