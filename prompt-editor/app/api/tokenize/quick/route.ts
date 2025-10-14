import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

interface TokenizeRequest {
  systemText: string;
  userText: string;
  assistantText: string;
  models: string[];
}

interface TokenizeResponse {
  results: Record<string, number>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TokenizeRequest = await request.json();

    // Validate request body
    if (!body.models || !Array.isArray(body.models) || body.models.length === 0) {
      return NextResponse.json(
        { error: 'Models array is required and must not be empty' },
        { status: 400 }
      );
    }

    try {
      // Forward request to FastAPI quick endpoint
      const response = await fetch(`${FASTAPI_BASE_URL}/internal/llm/tokenize/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemText: body.systemText || '',
          userText: body.userText || '',
          assistantText: body.assistantText || '',
          models: body.models,
        }),
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`FastAPI error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`FastAPI returned ${response.status}`);
      }

      const data: TokenizeResponse = await response.json();
      return NextResponse.json(data);

    } catch (fetchError) {
      console.error('FastAPI connection failed:', fetchError);

      // Fallback to client-side estimation if FastAPI fails
      const fallbackResults: Record<string, number> = {};
      for (const model of body.models) {
        // Simple character-based estimation as fallback
        const totalText = (body.systemText || '') + (body.userText || '') + (body.assistantText || '');
        const estimatedTokens = Math.ceil(totalText.length / 4); // Rough estimation
        fallbackResults[model] = estimatedTokens;
      }

      return NextResponse.json({ results: fallbackResults });
    }

  } catch (error) {
    console.error('Quick tokenization error:', error);

    // Return error response
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}