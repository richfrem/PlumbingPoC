import { APIRequestContext, request } from '@playwright/test';

export interface QuoteRequest {
  id: string;
  customer_name: string;
  problem_category: string;
  problem_description: string;
  is_emergency: boolean;
  status: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export class TestApiClient {
  private requestContext: APIRequestContext;
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async init() {
    this.requestContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      }
    });
  }

  async cleanup() {
    if (this.requestContext) {
      await this.requestContext.dispose();
    }
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Get authenticated headers
   */
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Get all quote requests (Note: This endpoint may not exist in current API)
   * For now, we'll use alternative validation methods
   */
  async getRequests(): Promise<QuoteRequest[]> {
    try {
      const response = await this.requestContext.get('/api/requests');
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.warn('GET /api/requests endpoint not available, using alternative validation');
      return [];
    }
  }

  /**
   * Get request count (Note: This may not work if endpoint doesn't exist)
   */
  async getRequestCount(): Promise<number> {
    const requests = await this.getRequests();
    return requests.length;
  }

  /**
   * Get a specific request by ID
   */
  async getRequestById(id: string): Promise<QuoteRequest | null> {
    try {
      const response = await this.requestContext.get(`/api/requests/${id}`);
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.warn(`Could not retrieve request ${id}:`, error.message);
      return null;
    }
  }

  /**
   * Get latest request
   */
  async getLatestRequest(): Promise<QuoteRequest | null> {
    const requests = await this.getRequests();
    return requests.length > 0 ? requests[0] : null;
  }

  /**
   * Validate request data integrity
   */
  async validateRequestData(expectedData: Partial<QuoteRequest>): Promise<boolean> {
    const latestRequest = await this.getLatestRequest();
    if (!latestRequest) return false;

    return Object.entries(expectedData).every(([key, value]) => {
      return latestRequest[key as keyof QuoteRequest] === value;
    });
  }

  /**
   * Get requests by user ID (if authentication is implemented)
   */
  async getRequestsByUser(userId: string): Promise<QuoteRequest[]> {
    const response = await this.requestContext.get(`/api/requests?user_id=${userId}`);
    const result = await response.json();
    return result.data || result;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.requestContext.get(`/api/users?email=${encodeURIComponent(email)}`, {
        headers: this.getHeaders()
      });
      const result = await response.json();
      const users = result.data || result;
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.warn(`Could not find user by email ${email}:`, error.message);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await this.requestContext.get(`/api/users/${id}`, {
        headers: this.getHeaders()
      });
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.warn(`Could not retrieve user ${id}:`, error.message);
      return null;
    }
  }

  /**
   * Delete user by ID (for cleanup)
   */
  async deleteUserById(id: string): Promise<void> {
    try {
      await this.requestContext.delete(`/api/users/${id}`, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.warn(`Could not delete user ${id}:`, error.message);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.requestContext.get('/api/users/me', {
        headers: this.getHeaders()
      });
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.warn('Could not retrieve current user:', error.message);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(id: string, profileData: Partial<User>): Promise<User | null> {
    try {
      const response = await this.requestContext.put(`/api/users/${id}`, {
        headers: this.getHeaders(),
        data: profileData
      });
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.warn(`Could not update user ${id}:`, error.message);
      return null;
    }
  }
}

// Factory function for tests
export async function createApiClient(baseURL?: string): Promise<TestApiClient> {
  const client = new TestApiClient(baseURL);
  await client.init();
  return client;
}