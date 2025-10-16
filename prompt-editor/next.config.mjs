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

      // Упрощенное разделение чанков для development
      if (dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                chunks: 'all',
                enforce: true,
              }
            },
          },
        }
      } else {
        // Упрощенное разделение чанков для production (быстрая сборка)
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: -10,
                chunks: 'all',
              },
              monaco: {
                test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor)[\\/]/,
                name: 'monaco',
                priority: 10,
                chunks: 'async',
                enforce: true,
              },
            },
          },
        }
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