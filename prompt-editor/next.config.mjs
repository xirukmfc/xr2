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
  
  // Экспериментальные настройки для максимальной производительности
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'react-hook-form',
      'date-fns'
    ],
    optimizeServerReact: true,
    serverMinification: true,
    webVitalsAttribution: ['CLS', 'LCP'],
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
        // Агрессивное разделение чанков только для production
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 244000,
            cacheGroups: {
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true,
              },
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: -10,
                chunks: 'all',
                maxSize: 244000,
              },
              monaco: {
                test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor)[\\/]/,
                name: 'monaco',
                priority: 10,
                chunks: 'async',
                enforce: true,
              },
              radix: {
                test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                name: 'radix',
                priority: 5,
                chunks: 'all',
              },
              lucide: {
                test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                name: 'lucide',
                priority: 3,
                chunks: 'all',
              }
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

  ...(process.env.NODE_ENV === 'production' && {
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        skipDefaultConversion: true,
      },
    },
  }),
}

export default nextConfig