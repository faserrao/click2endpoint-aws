// AWS Cognito Authentication Service
// Integrates with C2M API v2 Security infrastructure

export const AUTH_CONFIG = {
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL ||
    'https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth',
  tokenEndpoints: {
    long: '/tokens/long',
    short: '/tokens/short',
    revoke: '/tokens/{tokenId}/revoke',
    info: '/tokens/{tokenId}'
  },
  tokenStorage: {
    longTerm: 'c2e_long_token',
    shortTerm: 'c2e_short_token',
    expiry: 'c2e_token_expiry',
    tokenId: 'c2e_token_id',
    longTokenId: 'c2e_long_token_id',
    longTokenExpiry: 'c2e_long_token_expiry'
  }
};

export interface TokenResponse {
  access_token: string;
  token_id: string;
  expires_at: string;
  token_type: 'Bearer';
  ttl_seconds?: number;
}

export interface AuthError {
  code: string;
  message: string;
}

export class AuthService {
  private authBaseUrl: string;

  constructor(authBaseUrl?: string) {
    this.authBaseUrl = authBaseUrl || AUTH_CONFIG.authBaseUrl;
  }

  /**
   * Get long-term token (30-90 days)
   */
  async getLongTermToken(
    clientId: string,
    clientSecret: string
  ): Promise<TokenResponse> {
    const url = `${this.authBaseUrl}${AUTH_CONFIG.tokenEndpoints.long}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scopes: ['jobs:submit', 'templates:read', 'tokens:revoke'],
        ttl_seconds: 2592000 // 30 days
      })
    });

    if (!response.ok) {
      const error: AuthError = await response.json().catch(() => ({
        code: 'unknown_error',
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(`Failed to get long-term token: ${error.message}`);
    }

    const data: TokenResponse = await response.json();

    // Store in sessionStorage (more secure than localStorage)
    sessionStorage.setItem(AUTH_CONFIG.tokenStorage.longTerm, data.access_token);
    sessionStorage.setItem(AUTH_CONFIG.tokenStorage.longTokenId, data.token_id);
    sessionStorage.setItem(AUTH_CONFIG.tokenStorage.longTokenExpiry, data.expires_at);

    return data;
  }

  /**
   * Exchange long-term token for short-term token (15 minutes)
   */
  async getShortTermToken(longTermToken: string): Promise<TokenResponse> {
    const url = `${this.authBaseUrl}${AUTH_CONFIG.tokenEndpoints.short}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${longTermToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'token_exchange',
        scopes: ['jobs:submit'] // Narrow scope for actual API calls
      })
    });

    if (!response.ok) {
      const error: AuthError = await response.json().catch(() => ({
        code: 'unknown_error',
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(`Failed to get short-term token: ${error.message}`);
    }

    const data: TokenResponse = await response.json();

    // Store in sessionStorage
    sessionStorage.setItem(AUTH_CONFIG.tokenStorage.shortTerm, data.access_token);
    sessionStorage.setItem(AUTH_CONFIG.tokenStorage.tokenId, data.token_id);
    sessionStorage.setItem(AUTH_CONFIG.tokenStorage.expiry, data.expires_at);

    return data;
  }

  /**
   * Revoke a token
   */
  async revokeToken(tokenId: string, token: string): Promise<void> {
    const url = `${this.authBaseUrl}${AUTH_CONFIG.tokenEndpoints.revoke.replace('{tokenId}', tokenId)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const error: AuthError = await response.json().catch(() => ({
        code: 'unknown_error',
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(`Failed to revoke token: ${error.message}`);
    }

    // Clear from sessionStorage
    this.clearTokens();
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiryTime: string): boolean {
    if (!expiryTime) return true;

    const now = new Date().getTime();
    const expiry = new Date(expiryTime).getTime();
    const bufferTime = 60 * 1000; // 1 minute buffer

    return (expiry - now) <= bufferTime;
  }

  /**
   * Get current short-term token, refreshing if needed
   */
  async getCurrentToken(clientId: string, clientSecret: string): Promise<string> {
    // Check for existing valid short-term token
    const shortTermToken = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.shortTerm);
    const tokenExpiry = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.expiry);

    if (shortTermToken && tokenExpiry && !this.isTokenExpired(tokenExpiry)) {
      return shortTermToken;
    }

    // Check for existing long-term token
    let longTermToken = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.longTerm);
    const longTokenExpiry = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.longTokenExpiry);

    // If no long-term token or it's expired, get a new one
    if (!longTermToken || !longTokenExpiry || this.isTokenExpired(longTokenExpiry)) {
      const longTokenResponse = await this.getLongTermToken(clientId, clientSecret);
      longTermToken = longTokenResponse.access_token;
    }

    // Exchange for short-term token
    const shortTokenResponse = await getShortTermToken(longTermToken);
    return shortTokenResponse.access_token;
  }

  /**
   * Authenticate and return short-term token
   * This is the main method to call for getting an access token
   */
  async authenticate(clientId: string, clientSecret: string): Promise<string> {
    return this.getCurrentToken(clientId, clientSecret);
  }

  /**
   * Test connection to auth service
   */
  async testConnection(clientId: string, clientSecret: string): Promise<{
    success: boolean;
    message: string;
    tokenId?: string;
  }> {
    try {
      const tokenResponse = await this.getLongTermToken(clientId, clientSecret);
      return {
        success: true,
        message: 'Successfully authenticated',
        tokenId: tokenResponse.token_id
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    sessionStorage.removeItem(AUTH_CONFIG.tokenStorage.longTerm);
    sessionStorage.removeItem(AUTH_CONFIG.tokenStorage.shortTerm);
    sessionStorage.removeItem(AUTH_CONFIG.tokenStorage.expiry);
    sessionStorage.removeItem(AUTH_CONFIG.tokenStorage.tokenId);
    sessionStorage.removeItem(AUTH_CONFIG.tokenStorage.longTokenId);
    sessionStorage.removeItem(AUTH_CONFIG.tokenStorage.longTokenExpiry);
  }

  /**
   * Get stored tokens info (for debugging)
   */
  getTokensInfo(): {
    hasLongTermToken: boolean;
    hasShortTermToken: boolean;
    longTokenExpiry?: string;
    shortTokenExpiry?: string;
    isLongTokenExpired?: boolean;
    isShortTokenExpired?: boolean;
  } {
    const longTermToken = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.longTerm);
    const shortTermToken = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.shortTerm);
    const longTokenExpiry = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.longTokenExpiry);
    const shortTokenExpiry = sessionStorage.getItem(AUTH_CONFIG.tokenStorage.expiry);

    return {
      hasLongTermToken: !!longTermToken,
      hasShortTermToken: !!shortTermToken,
      longTokenExpiry: longTokenExpiry || undefined,
      shortTokenExpiry: shortTokenExpiry || undefined,
      isLongTokenExpired: longTokenExpiry ? this.isTokenExpired(longTokenExpiry) : undefined,
      isShortTokenExpired: shortTokenExpiry ? this.isTokenExpired(shortTokenExpiry) : undefined
    };
  }
}

// Default export for convenience
export default new AuthService();
