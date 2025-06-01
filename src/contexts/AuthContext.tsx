
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from '@/types'; 
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (emailOrLogin: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  fetchUserDetails: (userId: number) => Promise<User | null>; 
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define AuthProviderClient that will wrap components needing useAuth
export const AuthProviderClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This component simply renders children, allowing useAuth to be called within them
  // The actual AuthContext.Provider is in the RootLayout.
  return <>{children}</>;
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const processUser = (user: any): User | null => {
    if (user && user.id && user.username && user.email) {
      let balance = 0;
      if (typeof user.balance === 'string') {
        balance = parseFloat(user.balance);
      } else if (typeof user.balance === 'number') {
        balance = user.balance;
      }
      if (isNaN(balance)) {
        balance = 0;
      }
      return {
        ...user,
        balance: balance,
      };
    }
    return null;
  }

  const fetchUserDetails = useCallback(async (userId: number): Promise<User | null> => {
    try {
      const response = await fetch(`/api/user/${userId}/details`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch updated user details' }));
        console.warn(`Failed to fetch updated user details for user ${userId}: ${errorData.message || response.statusText}`);
        return null; 
      }
      const data = await response.json();
      const processedUser = processUser(data.user);
      if (processedUser) {
        setCurrentUser(processedUser); // Update context state
        localStorage.setItem('currentUser', JSON.stringify(processedUser)); // Update localStorage
        return processedUser;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const processedUser = processUser(parsedUser);
          if (processedUser && processedUser.id) {
            // Fetch fresh user details to ensure data is up-to-date
            const freshUser = await fetchUserDetails(processedUser.id); 
            if (freshUser) {
              setCurrentUser(freshUser); // This will now update context state
            } else {
              // If fetching fresh details fails, use stored (potentially stale) user
              // Or, you could decide to log out the user here if fresh data is critical
              setCurrentUser(processedUser); 
              console.warn("Used stored user details as fresh fetch failed.");
            }
          } else {
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
          }
        } catch (e) {
          console.error("Failed to parse or refresh stored user:", e);
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [fetchUserDetails]);


  const login = useCallback(async (emailOrLogin: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrLogin, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.user && data.user.id) {
        // Instead of just setting, fetch full details to ensure consistency
        const freshUser = await fetchUserDetails(data.user.id);
        if (freshUser) {
            router.push('/account');
        } else {
            // Fallback to processed login data if fetch fails immediately after login
            const processedLoginUser = processUser(data.user); 
            if (processedLoginUser) {
                setCurrentUser(processedLoginUser);
                localStorage.setItem('currentUser', JSON.stringify(processedLoginUser));
                router.push('/account');
            } else {
                throw new Error('Invalid user data received from login.');
            }
        }
      } else {
        throw new Error('Login response did not include user ID.');
      }
    } catch (error: any) {
      console.error("Login error in AuthContext:", error);
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      throw error; // Re-throw to be caught by the form
    } finally {
      setLoading(false);
    }
  }, [router, fetchUserDetails]);

  const register = useCallback(async (username: string, email: string, password: string, referralCode?: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, referralCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      // Registration successful, redirect to login page
      router.push('/auth/login?registrationSuccess=true'); // Optionally, show a success message on login page
    } catch (error: any) {
      console.error("Registration error in AuthContext:", error);
      throw error; // Re-throw to be caught by the form
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    if (pathname.startsWith('/account') || pathname.startsWith('/admin')) { // Added admin check
      router.push('/auth/login'); 
    } else {
      router.push('/');
    }
  }, [router, pathname]);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    fetchUserDetails,
    setCurrentUser, // Expose setCurrentUser for direct manipulation if needed (e.g., after admin actions)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
