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

  // Function to refresh the access token
  const refreshAccessToken = async (user: User) => {
    try {
      const token = await user.getIdToken(true); // Force refresh
      (user as any).accessToken = token;
      setUser({ ...user }); // Trigger re-render with new token
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If token refresh fails, sign out the user
      await signOut(auth);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Create or update user document
          await createOrUpdateUserDocument(user);
          
          // Get initial token
          const token = await user.getIdToken();
          (user as any).accessToken = token;
          
          // Set up token refresh
          const refreshInterval = setInterval(() => {
            refreshAccessToken(user);
          }, 50 * 60 * 1000); // Refresh every 50 minutes (tokens typically last 1 hour)
          
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
      
      // Get the access token for Gmail API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        // Store the access token for Gmail API calls
        (result.user as any).accessToken = credential.accessToken;
      }
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