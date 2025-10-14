// Mock implementation for sharing functionality until backend endpoints are ready

import type { PublicShareResponse, PublicPromptData, CreatePublicShareData } from './api'

interface MockShare {
  id: string
  token: string
  prompt_version_id: string
  created_at: string
  is_active: boolean
  prompt_data?: PublicPromptData
}

class MockSharingService {
  private shares: Map<string, MockShare> = new Map()
  private tokenToShare: Map<string, MockShare> = new Map()

  private generateToken(): string {
    // Generate a random token
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = ''
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  async createShare(data: CreatePublicShareData): Promise<PublicShareResponse> {
    const token = this.generateToken()
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const share: MockShare = {
      id: shareId,
      token,
      prompt_version_id: data.prompt_version_id,
      created_at: new Date().toISOString(),
      is_active: true
    }

    this.shares.set(shareId, share)
    this.tokenToShare.set(token, share)

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

    return {
      id: shareId,
      token,
      share_url: `${baseUrl}/share/${token}`,
      created_at: share.created_at
    }
  }

  async getPublicPrompt(token: string): Promise<PublicPromptData> {
    const share = this.tokenToShare.get(token)

    if (!share || !share.is_active) {
      throw new Error('Share not found or expired')
    }

    // Mock prompt data - in real implementation this would fetch from backend
    return {
      prompt_name: "User Review Analysis",
      prompt_description: "Analyze user reviews to extract insights and sentiment",
      version_number: 1,
      system_prompt: `You are an expert analyst specializing in user review analysis. Your task is to:

1. Extract key themes and topics from user reviews
2. Identify sentiment (positive, negative, neutral)
3. Highlight specific issues or praise points
4. Provide actionable insights for improvement

Please analyze the provided reviews systematically and provide a comprehensive summary.`,
      user_prompt: `Please analyze the following user reviews:

{{reviews}}

Provide a detailed analysis including:
- Overall sentiment distribution
- Key themes and topics
- Specific issues mentioned
- Suggestions for improvement
- Notable positive feedback`,
      assistant_prompt: "I'll analyze these user reviews systematically, focusing on sentiment analysis, key themes, and actionable insights. Let me break down my analysis:",
      variables: [
        {
          name: "reviews",
          type: "string",
          defaultValue: "Sample user reviews...",
          isDefined: true
        }
      ],
      shared_by_name: "Alice Johnson",
      shared_by_company: "TechCorp Inc.",
      created_at: share.created_at
    }
  }

  async deleteShare(shareId: string): Promise<{ success: boolean }> {
    const share = this.shares.get(shareId)

    if (!share) {
      throw new Error('Share not found')
    }

    this.shares.delete(shareId)
    this.tokenToShare.delete(share.token)

    return { success: true }
  }

  async getShares(promptId?: string): Promise<any[]> {
    // Mock implementation - return empty array for now
    return []
  }
}

export const mockSharingService = new MockSharingService()