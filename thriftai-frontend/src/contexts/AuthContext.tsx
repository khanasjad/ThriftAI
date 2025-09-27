import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'buyer' | 'seller';
  photoURL?: string;
  firebaseUid: string;
}

interface AuthContextType {
  firebaseUser: AuthUser | null;
  appUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to convert Firebase user to app user
  const createAppUserFromFirebase = (firebaseUser: AuthUser): AppUser => {
    const displayName = firebaseUser.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName,
      lastName,
      userType: 'buyer', // Default to buyer, can be updated later
      photoURL: firebaseUser.photoURL || undefined,
      firebaseUid: firebaseUser.uid
    };
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setFirebaseUser(user);
      if (user) {
        // Convert Firebase user to app user format
        const appUserData = createAppUserFromFirebase(user);
        setAppUser(appUserData);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const user = await authService.signInWithGoogle();
      setFirebaseUser(user);
      if (user) {
        const appUserData = createAppUserFromFirebase(user);
        setAppUser(appUserData);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signInWithEmailPassword(email, password);
      if (result.success) {
        // For now, create a temporary user object for traditional login
        // In a real app, you'd get user details from the backend response
        const tempUser: AppUser = {
          id: 'temp-' + Date.now(),
          email: email,
          firstName: 'User',
          lastName: '',
          userType: 'buyer',
          firebaseUid: ''
        };
        setAppUser(tempUser);
      }
      return result;
    } catch (error) {
      console.error('Error signing in with email/password:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setFirebaseUser(null);
      setAppUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    firebaseUser,
    appUser,
    loading,
    signInWithGoogle,
    signInWithEmailPassword,
    signOut,
    isAuthenticated: !!firebaseUser || !!appUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;