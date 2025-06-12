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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { app, db } from '../firebase/config';

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

  // Function to get a fresh Gmail access token
  const getGmailAccessToken = async (user: User) => {
    try {
      // Get a fresh ID token
      const idToken = await user.getIdToken(true);
      
      // Get a fresh Gmail access token using the ID token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
          client_id: import.meta.env.VITE_FIREBASE_API_KEY,
          subject_token: idToken,
          requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Gmail access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting Gmail access token:', error);
      throw error;
    }
  };

  // Function to create or update user document in Firestore
  const createOrUpdateUserDocument = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Update last login
        await setDoc(userRef, {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Create or update user document
          await createOrUpdateUserDocument(user);
          
          // Get initial Gmail access token
          const gmailToken = await getGmailAccessToken(user);
          (user as any).accessToken = gmailToken;
          
          // Set up token refresh
          const refreshInterval = setInterval(async () => {
            try {
              const newToken = await getGmailAccessToken(user);
              (user as any).accessToken = newToken;
              setUser({ ...user }); // Trigger re-render with new token
            } catch (error) {
              console.error('Error refreshing Gmail token:', error);
              // If token refresh fails, sign out the user
              await signOut(auth);
            }
          }, 45 * 60 * 1000); // Refresh every 45 minutes (tokens typically last 1 hour)
          
          setUser(user);
          setLoading(false);
          
          // Cleanup interval on unmount
          return () => clearInterval(refreshInterval);
        } catch (error) {
          console.error('Error setting up user:', error);
          setAuthError('Error setting up your account. Please try again.');
          await signOut(auth);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Check for redirect result when the component mounts
    getRedirectResult(auth).catch((error) => {
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
      
      // Log current domain for debugging
      console.log('Current domain:', window.location.origin);
      console.log('Current hostname:', window.location.hostname);
      console.log('Current port:', window.location.port);
      
      const result = await signInWithPopup(auth, provider);
      
      // Get the initial Gmail access token
      const gmailToken = await getGmailAccessToken(result.user);
      (result.user as any).accessToken = gmailToken;
      
    } catch (error) {
      const authError = error as AuthError;
      console.error('Full auth error:', authError);
      
      if (authError.code === 'auth/popup-blocked') {
        try {
          // If popup is blocked, fall back to redirect
          console.log('Popup blocked, trying redirect...');
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error('Error signing in with redirect', redirectError);
          setAuthError('An error occurred while signing in. Please try again.');
        }
      } else if (authError.code === 'auth/unauthorized-domain') {
        console.error('Unauthorized domain error. Current origin:', window.location.origin);
        setAuthError(`Domain authorization error. Please ensure ${window.location.origin} is added to Firebase authorized domains.`);
      } else {
        setAuthError(`Authentication error: ${authError.message}`);
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