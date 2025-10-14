import { apiCache } from './api-cache'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/internal';

// Конфигурация для кэширования разных типов данных
const CACHE_CONFIG = {
  prompts: 2 * 60 * 1000,        // 2 минуты
  prompt_detail: 5 * 60 * 1000,  // 5 минут  
  user_limits: 30 * 1000,        // 30 секунд
  settings: 10 * 60 * 1000,      // 10 минут
  counts: 1 * 60 * 1000,         // 1 минута
} as const;

// Tag types
export interface ApiTag {
    id: string;
    name: string;
    color: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// Prompt Version types - новые типы для версий
export interface ApiPromptVersion {
    id: string;
    prompt_id: string;
    version_number: number;
    system_prompt?: string;
    user_prompt?: string;
    assistant_prompt?: string;
    prompt_template?: string;
    variables: any[];
    model_config: any;
    status: 'draft' | 'testing' | 'production' | 'deprecated';
    deployed_at?: string;
    deployed_by?: string;
    usage_count: number;
    avg_latency?: number;
    changelog?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

// Обновленные типы промтов
export interface ApiPrompt {
    id: string
    name: string
    slug: string
    description: string
    status: "active" | "draft" | "archived"
    created_by: string
    updated_by: string
    creator_name?: string
    creator_full_name?: string
    updater_name?: string
    updater_full_name?: string
    updated_at: string
    created_at: string
    usage_24h?: number
    tags?: Array<{
        id: string
        name: string
        color: string
    }>
    current_version?: {
        id: string
        version_number: number
        usage_count: number
    }
}


export interface CreatePromptData {
    name: string;
    slug?: string;
    description?: string;
    workspace_id: string;
    system_prompt?: string;
    user_prompt?: string;
    assistant_prompt?: string;
    prompt_template?: string;
    variables?: any[];
    model_config?: any;
    tag_ids?: string[];
}

export interface CreatePromptVersionData {
    prompt_id: string;
    system_prompt?: string;
    user_prompt?: string;
    assistant_prompt?: string;
    prompt_template?: string;
    variables?: any[];
    model_config?: any;
    changelog?: string;
    tag_ids?: string[];
}

export interface UpdatePromptData {
    name?: string;
    slug?: string;
    description?: string;
    status?: 'draft' | 'active' | 'archived';
    tag_ids?: (string | number)[];
}

export interface UpdatePromptVersionData {
    system_prompt?: string;
    user_prompt?: string;
    assistant_prompt?: string;
    prompt_template?: string;
    variables?: any[];
    model_config?: any;
    changelog?: string;
    tag_ids?: string[];
}

export interface ApiPublicShare {
    id: string;
    token: string;
    prompt_version_id: string;
    created_by: string;
    created_at: string;
    expires_at?: string;
    is_active: boolean;
}

export interface CreatePublicShareData {
    prompt_version_id: string;
    expires_at?: string;
}

export interface PublicShareResponse {
    id: string;
    token: string;
    share_url: string;
    created_at: string;
    expires_at?: string;
}

export interface PublicPromptData {
    prompt_name: string;
    prompt_description?: string;
    version_number: number;
    system_prompt?: string;
    user_prompt?: string;
    assistant_prompt?: string;
    prompt_template?: string;
    variables: any[];
    shared_by_name?: string;
    created_by_name?: string;
    updated_by_name?: string;
    created_at: string;
    updated_at: string;
}

export interface UserLimits {
  user_id: string
  username: string
  is_superuser: boolean
  limits: {
    is_superuser: boolean
    prompts: {
      current: number
      max: number
      can_create: boolean
    }
    api_requests: {
      current: number
      max: number
      can_request: boolean
      reset_time: string
    }
  }
}


export interface ApiWorkspace {
    id: string
    name: string
    slug: string
    created_at?: string
    updated_at?: string
}

export interface CurrentWorkspaceResponse {
  id: string
  name: string
  slug: string
  description?: string | null
  owner_id: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

// API Client
class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        
        // Load token from localStorage on initialization
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token');
        }
    }

    // Authentication methods
    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log('[API Client] Making request to:', url, 'with method:', options.method || 'GET');
        console.log('[API Client] Token available:', !!this.token);
        const defaultHeaders: Record<string, string> = {'Content-Type': 'application/json'};

        // Add Authorization header if token exists
        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
            console.log('[API Client] Added Authorization header');
        } else {
            console.warn('[API Client] No token available for authenticated request');
        }
        
        const config: RequestInit = {
            headers: {...defaultHeaders, ...options.headers},
            ...options,
        };

        try {
            console.log('[API Client] Fetching with config:', JSON.stringify(config, null, 2));
            const response = await fetch(url, config);
            console.log('[API Client] Response status:', response.status, response.statusText);
            if (!response.ok) {
                const errorText = await response.text();
                
                // If it's a 401 error and we have a token, the token is likely invalid
                if (response.status === 401 && this.token) {
                    this.clearToken();
                }
                
                // Try to parse error as JSON to get structured error details
                let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.detail) {
                        if (typeof errorJson.detail === 'object' && errorJson.detail.message) {
                            // For structured errors like limits exceeded
                            errorMessage = errorJson.detail.message;
                        } else if (typeof errorJson.detail === 'string') {
                            // For simple string errors
                            errorMessage = errorJson.detail;
                        }
                    }
                } catch {
                    // Fallback to original text if JSON parsing fails
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            // Handle empty responses (like DELETE operations)
            const text = await response.text();
            if (!text) {
                return {} as T;
            }
            
            try {
                return JSON.parse(text);
            } catch {
                return text as T;
            }
        } catch (error) {
            console.error('[API Client] Fetch error:', error);
            console.error('[API Client] Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : 'Unknown',
                stack: error instanceof Error ? error.stack : 'Unknown',
                url: url,
                config: config
            });

            // Handle network errors more specifically
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error(`Cannot connect to server at ${this.baseUrl}. Please ensure the backend API is running and accessible.`);
            }
            
            // Убеждаемся, что всегда бросаем Error объект
            if (error instanceof Error) {
                throw error;
            } else if (typeof error === 'object' && error !== null) {
                const message = (error as any).message || (error as any).error || 'API request failed';
                throw new Error(typeof message === 'string' ? message : JSON.stringify(error));
            } else {
                throw new Error('API request failed');
            }
        }
    }

    // Prompts API methods с кэшированием
    async getPrompts(params?: {
        workspace_id?: string;
        status?: string;
        skip?: number;
        limit?: number;
    }): Promise<ApiPrompt[]> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/prompts/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        
        // Кэшируем запросы с параметрами
        const cacheKey = `prompts:${searchParams.toString()}`;
        return apiCache.getOrFetch(
            cacheKey,
            () => this.request<ApiPrompt[]>(endpoint),
            CACHE_CONFIG.prompts
        );
    }

    async getPrompt(id: string): Promise<ApiPrompt> {
        const cacheKey = `prompt:${id}`;
        return apiCache.getOrFetch(
            cacheKey,
            () => this.request<ApiPrompt>(`/prompts/${id}`),
            CACHE_CONFIG.prompt_detail
        );
    }

    async createPrompt(data: CreatePromptData): Promise<ApiPrompt> {
        const result = await this.request<ApiPrompt>('/prompts/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        // Инвалидируем кэш списков промптов
        apiCache.invalidate('prompts:');
        return result;
    }

    async updatePrompt(id: string, data: UpdatePromptData): Promise<ApiPrompt> {
        const result = await this.request<ApiPrompt>(`/prompts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        // Инвалидируем кэш конкретного промпта и списков
        apiCache.invalidate(`prompt:${id}`);
        apiCache.invalidate('prompts:');
        return result;
    }

    async deletePrompt(id: string): Promise<{ success: boolean }> {
        const result = await this.request<{ success: boolean }>(`/prompts/${id}`, {
            method: 'DELETE',
        });
        // Инвалидируем кэш удаленного промпта и списков
        apiCache.invalidate(`prompt:${id}`);
        apiCache.invalidate('prompts:');
        return result;
    }

    // Prompt Versions API methods
    async getPromptVersions(promptId: string): Promise<ApiPromptVersion[]> {
        return this.request<ApiPromptVersion[]>(`/prompts/${promptId}/versions`);
    }

    async getPromptVersion(promptId: string, versionId: string): Promise<ApiPromptVersion> {
        return this.request<ApiPromptVersion>(`/prompts/${promptId}/versions/${versionId}`);
    }

    async createPromptVersion(data: CreatePromptVersionData): Promise<ApiPromptVersion> {
        return this.request<ApiPromptVersion>(`/prompts/${data.prompt_id}/versions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePromptVersion(promptId: string, versionId: string, data: UpdatePromptVersionData): Promise<ApiPromptVersion> {
        return this.request<ApiPromptVersion>(`/prompts/${promptId}/versions/${versionId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deployPromptVersion(promptId: string, versionId: string): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>(`/prompts/${promptId}/versions/${versionId}/deploy`, {
            method: 'POST',
        });
    }

    async undeployPromptVersion(promptId: string, versionId: string): Promise<{ success: boolean; new_status: string; message: string }> {
        return this.request<{ success: boolean; new_status: string; message: string }>(`/prompts/${promptId}/versions/${versionId}/undeploy`, {
            method: 'POST',
        });
    }

    async deletePromptVersion(promptId: string, versionId: string): Promise<{ success: boolean; message: string; version_id: string; deleted_at: string }> {
        return this.request<{ success: boolean; message: string; version_id: string; deleted_at: string }>(`/prompts/${promptId}/versions/${versionId}`, {
            method: 'DELETE',
        });
    }

    // Authentication API methods
    async login(username: string, password: string): Promise<{access_token: string, token_type: string, user: any}> {
        const response = await this.request<{access_token: string, token_type: string, user: any}>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        
        // Store token automatically
        this.setToken(response.access_token);
        
        return response;
    }

    async googleLogin(credential: string): Promise<{access_token: string, token_type: string, user: any}> {
        const response = await this.request<{access_token: string, token_type: string, user: any}>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        });
        
        // Store token automatically
        this.setToken(response.access_token);
        
        return response;
    }

    async register(username: string, email: string, password: string, fullName?: string): Promise<any> {
        return this.request<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ 
                username, 
                email, 
                password, 
                full_name: fullName 
            }),
        });
    }

    async getCurrentUser(): Promise<any> {
        return this.request<any>('/auth/me');
    }

    async logout(): Promise<void> {
        await this.request<void>('/auth/logout', {
            method: 'POST',
        });
        this.clearToken();
    }

    async refreshToken(): Promise<{access_token: string, token_type: string, user: any}> {
        const response = await this.request<{access_token: string, token_type: string, user: any}>('/auth/refresh', {
            method: 'POST',
        });
        
        // Update stored token
        this.setToken(response.access_token);
        
        return response;
    }

    // Tags API methods (остаются те же)
    async getUserTags(): Promise<ApiTag[]> {
        return this.request<ApiTag[]>('/tags/get_user_tags')
    }

    async getTags(): Promise<ApiTag[]> {
        return this.request<ApiTag[]>('/tags');
    }

    async createTag(data: { name: string; color?: string }): Promise<ApiTag> {
        return this.request<ApiTag>('/tags', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTag(id: string, data: { name?: string; color?: string }): Promise<ApiTag> {
        return this.request<ApiTag>(`/tags/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteTag(id: string): Promise<void> {
        return this.request<void>(`/tags/${id}`, {method: 'DELETE'});
    }

    async getCurrentWorkspace(): Promise<CurrentWorkspaceResponse> {
        return this.request<CurrentWorkspaceResponse>(`/workspaces/current`)
    }

    async getWorkspaces(): Promise<ApiWorkspace[]> {
        return this.request<ApiWorkspace[]>(`/workspaces`)
    }

    // Product API Keys methods (for external use)
    async getApiKeys(): Promise<any[]> {
        return this.request<any[]>('/keys-for-external-use/');
    }

    async createApiKey(data: { 
        name: string; 
        description?: string;
    }): Promise<any> {
        return this.request<any>('/keys-for-external-use/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateApiKey(id: string, data: { 
        name?: string; 
        description?: string;
    }): Promise<any> {
        return this.request<any>(`/keys-for-external-use/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteApiKey(id: string): Promise<void> {
        return this.request<void>(`/keys-for-external-use/${id}`, {
            method: 'DELETE',
        });
    }

    // Stats methods с кэшированием
    async getCounts(workspace_id?: string): Promise<{prompts_count: number, api_keys_count: number, cached_at: number}> {
        const params = new URLSearchParams();
        if (workspace_id) {
            params.append('workspace_id', workspace_id);
        }
        const endpoint = `/stats/counts${params.toString() ? `?${params.toString()}` : ''}`;
        
        const cacheKey = `counts:${workspace_id || 'default'}`;
        return apiCache.getOrFetch(
            cacheKey,
            () => this.request<{prompts_count: number, api_keys_count: number, cached_at: number}>(endpoint),
            CACHE_CONFIG.counts
        );
    }

    // API Logs methods
    async getApiLogs(params?: {
        api_key_id?: string;
        status_code?: number;
        endpoint?: string;
        method?: string;
        is_success?: boolean;
        date_from?: string;
        date_to?: string;
        page?: number;
        per_page?: number;
    }): Promise<{logs: any[], total: number, page: number, per_page: number, pages: number}> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, value.toString());
                }
            });
        }
        const endpoint = `/api-usage/logs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return this.request<{logs: any[], total: number, page: number, per_page: number, pages: number}>(endpoint);
    }

    // User limits method с кэшированием
    async getUserLimits(): Promise<any> {
        return apiCache.getOrFetch(
            'user-limits',
            () => this.request<any>('/prompts/user-limits'),
            CACHE_CONFIG.user_limits
        );
    }

    async invalidateCache(): Promise<{success: boolean, message: string}> {
        return this.request<{success: boolean, message: string}>('/stats/invalidate-cache', {
            method: 'POST',
        });
    }

    // Public sharing methods
    async createPublicShare(data: CreatePublicShareData): Promise<PublicShareResponse> {
        const response = await this.request<PublicShareResponse>('/shares', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // If the API doesn't return a full URL, construct it
        if (!response.share_url.startsWith('http')) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            response.share_url = `${baseUrl}/share/${response.token}`;
        }

        return response;
    }

    async getPublicShares(promptId?: string): Promise<ApiPublicShare[]> {
        const endpoint = promptId ? `/shares?prompt_id=${promptId}` : '/shares';
        return this.request<ApiPublicShare[]>(endpoint);
    }

    async deletePublicShare(shareId: string): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>(`/shares/${shareId}`, {
            method: 'DELETE',
        });
    }

    async getPublicPrompt(token: string): Promise<PublicPromptData> {
        // This endpoint doesn't require authentication and uses a different base URL
        const originalToken = this.token;
        this.token = null; // Temporarily remove token for public endpoint

        try {
            // Use direct fetch since we need to call a different endpoint structure
            const url = `${this.baseUrl.replace('/internal', '')}/share/${token}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } finally {
            this.token = originalToken; // Restore token
        }
    }

}

export const apiClient = new ApiClient();

// Export convenience functions
export const getPrompts = apiClient.getPrompts.bind(apiClient);
export const getPrompt = apiClient.getPrompt.bind(apiClient);
export const createPrompt = apiClient.createPrompt.bind(apiClient);
export const updatePrompt = apiClient.updatePrompt.bind(apiClient);
export const deletePrompt = apiClient.deletePrompt.bind(apiClient);
export const getPromptVersions = apiClient.getPromptVersions.bind(apiClient);
export const getPromptVersion = apiClient.getPromptVersion.bind(apiClient);
export const createPromptVersion = apiClient.createPromptVersion.bind(apiClient);
export const updatePromptVersion = apiClient.updatePromptVersion.bind(apiClient);
export const deployPromptVersion = apiClient.deployPromptVersion.bind(apiClient);
export const undeployPromptVersion = apiClient.undeployPromptVersion.bind(apiClient);
export const getTags = apiClient.getTags.bind(apiClient);
export const createTag = apiClient.createTag.bind(apiClient);
export const updateTag = apiClient.updateTag.bind(apiClient);
export const deleteTag = apiClient.deleteTag.bind(apiClient);
export const getUserTags = apiClient.getUserTags.bind(apiClient);
export const getCurrentWorkspace = apiClient.getCurrentWorkspace.bind(apiClient);
export const getWorkspaces = apiClient.getWorkspaces.bind(apiClient);
export const getApiKeys = apiClient.getApiKeys.bind(apiClient);
export const createApiKey = apiClient.createApiKey.bind(apiClient);
export const updateApiKey = apiClient.updateApiKey.bind(apiClient);
export const deleteApiKey = apiClient.deleteApiKey.bind(apiClient);
export const getCounts = apiClient.getCounts.bind(apiClient);
export const getApiLogs = apiClient.getApiLogs.bind(apiClient);
export const getUserLimits = apiClient.getUserLimits.bind(apiClient);
export const invalidateCache = apiClient.invalidateCache.bind(apiClient);
export const invalidatePromptsCache = () => apiCache.invalidatePromptsCache();
export const createPublicShare = apiClient.createPublicShare.bind(apiClient);
export const getPublicShares = apiClient.getPublicShares.bind(apiClient);
export const deletePublicShare = apiClient.deletePublicShare.bind(apiClient);
export const getPublicPrompt = apiClient.getPublicPrompt.bind(apiClient);


// Constants
export const PROMPT_STATUSES = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived',
} as const;

export const VERSION_STATUSES = {
    DRAFT: 'draft',
    TESTING: 'testing',
    PRODUCTION: 'production',
    DEPRECATED: 'deprecated',
    INACTIVE: 'inactive',
} as const;