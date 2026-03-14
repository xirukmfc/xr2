import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'xR2'
  const subtitle = searchParams.get('subtitle') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#E63355',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            xR2
          </div>
          <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)' }}>Blog</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 40 ? '48px' : '56px',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.4,
              maxWidth: '800px',
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          xr2.uk
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
