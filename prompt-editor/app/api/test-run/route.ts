// app/api/test-run/route.ts
import { NextResponse } from "next/server";

// Types for the request body
interface TestRunRequest {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPrompt: string;
  variables?: Record<string, any>;
  tools?: any[];
}

// Types for the response
interface TestRunResponse {
  text: string;
  usage?: {
    total?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  costUsd?: number | null;
}

export async function POST(req: Request) {
  try {
    // Get the request body
    const body = await req.json() as TestRunRequest;

    // Get user authentication token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Forward the request to the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const backendResponse = await fetch(`${backendUrl}/internal/llm/test-run`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    // Forward the response from backend
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: backendResponse.status });
      } catch {
        return NextResponse.json({ error: errorText }, { status: backendResponse.status });
      }
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Test run proxy error:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}