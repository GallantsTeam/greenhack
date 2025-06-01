
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
  unreadNotificationsCount: number; // Added for global access if needed
  fetchUnreadNotificationsCount: (userId: number) => Promise<void>; // Added
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); // Added state

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

  const fetchUnreadNotificationsCount = useCallback(async (userId: number) => {
    // This function is for fetching the count specifically for the AuthContext.
    // The UserNotificationBell component fetches its own data for display.
    // This context state can be used if other parts of the app need the count.
    try {
      const response = await fetch(`/api/user/${userId}/notifications?countOnly=true&status=unread`); // API needs to support this
      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationsCount(data.count || 0);
      } else {
        // console.warn("AuthContext: Failed to fetch unread notifications count.");
        setUnreadNotificationsCount(0);
      }
    } catch (error) {
      // console.error("AuthContext: Error fetching unread notifications count:", error);
      setUnreadNotificationsCount(0);
    }
  }, []);


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
        setCurrentUser(processedUser); 
        localStorage.setItem('currentUser', JSON.stringify(processedUser)); 
        fetchUnreadNotificationsCount(processedUser.id); // Fetch count after user details are updated
        return processedUser;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }, [fetchUnreadNotificationsCount]);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const processedUser = processUser(parsedUser);
          if (processedUser && processedUser.id) {
            const freshUser = await fetchUserDetails(processedUser.id); 
            if (freshUser) {
              // setCurrentUser handled by fetchUserDetails
            } else {
              setCurrentUser(processedUser); 
              fetchUnreadNotificationsCount(processedUser.id);
              console.warn("Used stored user details as fresh fetch failed.");
            }
          } else {
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
            setUnreadNotificationsCount(0);
          }
        } catch (e) {
          console.error("Failed to parse or refresh stored user:", e);
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setUnreadNotificationsCount(0);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [fetchUserDetails, fetchUnreadNotificationsCount]);


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
        const freshUser = await fetchUserDetails(data.user.id);
        if (freshUser) {
            router.push('/account');
        } else {
            const processedLoginUser = processUser(data.user); 
            if (processedLoginUser) {
                setCurrentUser(processedLoginUser);
                localStorage.setItem('currentUser', JSON.stringify(processedLoginUser));
                fetchUnreadNotificationsCount(processedLoginUser.id);
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
      setUnreadNotificationsCount(0);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [router, fetchUserDetails, fetchUnreadNotificationsCount]);

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
      router.push('/auth/login?registrationSuccess=true'); 
    } catch (error: any) {
      console.error("Registration error in AuthContext:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setUnreadNotificationsCount(0);
    if (pathname.startsWith('/account') || pathname.startsWith('/admin')) { 
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
    setCurrentUser, 
    unreadNotificationsCount, 
    fetchUnreadNotificationsCount,
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
