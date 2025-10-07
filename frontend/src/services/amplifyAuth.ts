// AWS Amplify Authentication Service
// Modern, reliable authentication without Hosted UI

import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

// Configure Amplify immediately on module load
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

console.log('Amplify configuration on module load:', { userPoolId, userPoolClientId });

if (!userPoolId || !userPoolClientId) {
  console.error('Cognito configuration missing. Check environment variables.');
} else {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      }
    }
  });

  console.log('Amplify configured successfully');
  console.log('Verification - getConfig:', Amplify.getConfig());
}

export interface AuthUserData {
  username: string;
  userId: string;
}

class AmplifyAuthService {
  /**
   * Ensure Amplify is configured before auth operations
   */
  private ensureConfigured() {
    const currentConfig = Amplify.getConfig();
    console.log('Current Amplify config:', currentConfig);

    // If not configured, configure now
    if (!currentConfig.Auth) {
      console.log('Reconfiguring Amplify...');
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: userPoolId,
            userPoolClientId: userPoolClientId,
          }
        }
      });
      console.log('Reconfigured - new config:', Amplify.getConfig());
    }
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthUserData> {
    try {
      this.ensureConfigured();
      console.log('Calling signIn with username:', username);

      const { isSignedIn } = await signIn({ username, password });

      if (!isSignedIn) {
        throw new Error('Sign in failed');
      }

      const user = await getCurrentUser();

      return {
        username: user.username,
        userId: user.userId
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Authentication failed');
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUserData | null> {
    try {
      const user = await getCurrentUser();
      return {
        username: user.username,
        userId: user.userId
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get auth tokens
   */
  async getTokens() {
    try {
      const session = await fetchAuthSession();
      return {
        accessToken: session.tokens?.accessToken?.toString(),
        idToken: session.tokens?.idToken?.toString(),
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const amplifyAuth = new AmplifyAuthService();
