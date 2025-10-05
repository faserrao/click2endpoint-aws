// Cognito Authentication Service
// Simple username/password authentication for Click2Endpoint access control

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

// Cognito configuration from environment variables
const COGNITO_CONFIG = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

// Initialize user pool
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.userPoolId,
  ClientId: COGNITO_CONFIG.clientId,
});

export interface AuthUser {
  username: string;
  email?: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class CognitoAuthService {
  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { username, password } = credentials;

    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session: CognitoUserSession) => {
          const accessToken = session.getAccessToken().getJwtToken();
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();

          // Get user attributes
          cognitoUser.getUserAttributes((err, attributes) => {
            const email = attributes?.find(attr => attr.getName() === 'email')?.getValue();

            const user: AuthUser = {
              username,
              email,
              accessToken,
              idToken,
              refreshToken,
            };

            // Store in sessionStorage
            this.storeAuthData(user);

            resolve(user);
          });
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Authentication failed'));
        },
      });
    });
  }

  /**
   * Logout current user
   */
  logout(): void {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    this.clearAuthData();
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const currentUser = userPool.getCurrentUser();

    if (!currentUser) {
      return null;
    }

    return new Promise((resolve, reject) => {
      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }

        if (!session.isValid()) {
          resolve(null);
          return;
        }

        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        currentUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
            return;
          }

          const email = attributes?.find(attr => attr.getName() === 'email')?.getValue();

          resolve({
            username: currentUser.getUsername(),
            email,
            accessToken,
            idToken,
            refreshToken,
          });
        });
      });
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Get current session (with automatic refresh if needed)
   */
  async getSession(): Promise<CognitoUserSession | null> {
    const currentUser = userPool.getCurrentUser();

    if (!currentUser) {
      return null;
    }

    return new Promise((resolve, reject) => {
      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session);
      });
    });
  }

  /**
   * Store auth data in sessionStorage
   */
  private storeAuthData(user: AuthUser): void {
    sessionStorage.setItem('c2e_auth_user', JSON.stringify(user));
  }

  /**
   * Clear auth data from sessionStorage
   */
  private clearAuthData(): void {
    sessionStorage.removeItem('c2e_auth_user');
  }

  /**
   * Get stored auth data
   */
  getStoredAuthData(): AuthUser | null {
    const data = sessionStorage.getItem('c2e_auth_user');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthService();
