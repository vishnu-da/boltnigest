import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User,
  AuthError
} from 'firebase/auth';
import { app } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
  clearAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      console.log('User details:', user);
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result when the component mounts
    getRedirectResult(auth).then((result) => {
      console.log('Redirect result:', result);
    }).catch((error) => {
      console.error('Error getting redirect result', error);
      if (error.code !== 'auth/credential-already-in-use') {
        setAuthError('An error occurred during sign in. Please try again.');
      }
    });

    return unsubscribe;
  }, [auth]);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Add Gmail scope for reading emails
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    // Add additional scopes that might be needed
    provider.addScope('https://www.googleapis.com/auth/gmail.modify');
    
    try {
      clearAuthError();
      const result = await signInWithPopup(auth, provider);
      
      // Get the access token for Gmail API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        // Store the access token for Gmail API calls
        (result.user as any).accessToken = credential.accessToken;
      }
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-blocked') {
        try {
          // If popup is blocked, fall back to redirect
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error('Error signing in with redirect', redirectError);
          setAuthError('An error occurred while signing in. Please try again.');
        }
      } else {
        setAuthError('An error occurred while signing in with Google. Please try again.');
        console.error('Error signing in with Google', error);
      }
    }
  };

  const logout = async () => {
    try {
      clearAuthError();
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      setAuthError('An error occurred while signing out. Please try again.');
    }
  };

  const value = {
    user,
    loading,
    authError,
    signInWithGoogle,
    logout,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};