// pages/_document.tsx (create pages folder if it doesn't exist)
// Or app/_document.tsx if using app directory

import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Disable automatic font preload links */}
          <meta name="format-detection" content="telephone=no" />

          {/* Add script for immediate suppression of warnings */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Suppress font preload warnings as early as possible
                (function() {
                  const originalWarn = console.warn;
                  const originalError = console.error;
                  
                  console.warn = function(...args) {
                    const message = args.join(' ');
                    if (message.includes('preloaded using link preload but not used') ||
                        message.includes('_next/static/media/') && message.includes('.woff')) {
                      return;
                    }
                    originalWarn.apply(console, args);
                  };

                  console.error = function(...args) {
                    const message = args.join(' ');
                    if (message.includes('preloaded using link preload but not used') ||
                        message.includes('_next/static/media/') && message.includes('.woff')) {
                      return;
                    }
                    originalError.apply(console, args);
                  };
                })();
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

// IMPORTANT: If you are using app directory (Next.js 13+),
// this file should be in app/_document.tsx
//
// If using pages directory (Next.js 12 and below),
// this file should be in pages/_document.tsx