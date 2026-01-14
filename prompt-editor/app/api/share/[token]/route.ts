import { NextRequest, NextResponse } from 'next/server'

// In Docker, use app service name. In development, use localhost
const BACKEND_URL = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'http://app:8000' : 'http://localhost:8000')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    // Forward request to FastAPI backend
    const backendResponse = await fetch(`${BACKEND_URL}/share/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'xr2.uk',
      },
    })

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch shared prompt' },
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching shared prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
