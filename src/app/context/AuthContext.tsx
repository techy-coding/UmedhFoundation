import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const signInWithGoogle = async () => {
    // Initialize Google Sign-In
    if (typeof window !== 'undefined' && (window as any).google) {
      const google = (window as any).google;

      google.accounts.id.initialize({
        client_id: '1064645141711-baqnhhu42jjqvgdk1cp5kh4d46oiubsk.apps.googleusercontent.com', // Demo client ID
        callback: handleGoogleCallback,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to manual popup if One Tap is not displayed
          google.accounts.id.renderButton(
            document.getElementById('googleSignInDiv'),
            { theme: 'outline', size: 'large' }
          );
        }
      });
    } else {
      // Simulate Google Sign-In for demo
      simulateGoogleSignIn();
    }
  };

  const simulateGoogleSignIn = () => {
    // Simulated Google user data
    const mockUser: User = {
      id: 'google_' + Date.now(),
      name: 'Google User',
      email: 'user@gmail.com',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      role: 'donor',
    };

    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('userRole', mockUser.role);
    localStorage.setItem('userName', mockUser.name);
    localStorage.setItem('userEmail', mockUser.email);

    navigate('/dashboard');
  };

  const handleGoogleCallback = (response: any) => {
    // Decode JWT token
    const decodedToken = decodeJWT(response.credential);

    const googleUser: User = {
      id: decodedToken.sub,
      name: decodedToken.name,
      email: decodedToken.email,
      picture: decodedToken.picture,
      role: 'donor', // Default role, can be changed later
    };

    setUser(googleUser);
    localStorage.setItem('user', JSON.stringify(googleUser));
    localStorage.setItem('userRole', googleUser.role);
    localStorage.setItem('userName', googleUser.name);
    localStorage.setItem('userEmail', googleUser.email);

    navigate('/dashboard');
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }

    navigate('/login');
  };

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return {};
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
