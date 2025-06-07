
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  catchphrase?: string;
  rating: number;
  rank: string;
  country: string;
  chessComUsername?: string;
  lichessUsername?: string;
  preferredPlatform: 'chess.com' | 'lichess.org';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: {
    email: string;
    password: string;
    username: string;
    phone: string;
    name?: string;
    chessComUsername?: string;
    lichessUsername?: string;
    preferredPlatform: 'chess.com' | 'lichess.org';
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('chess_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call - this will be replaced with actual backend call
    try {
      // For demo purposes, check if user exists in localStorage
      const storedUsers = JSON.parse(localStorage.getItem('chess_users') || '[]');
      const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('chess_user', JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    username: string;
    phone: string;
    name?: string;
    chessComUsername?: string;
    lichessUsername?: string;
    preferredPlatform: 'chess.com' | 'lichess.org';
  }): Promise<boolean> => {
    // Simulate API call - this will be replaced with actual backend call
    try {
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || userData.username,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        catchphrase: "Ready to play!",
        rating: 1200,
        rank: "Beginner",
        country: "🇰🇪",
        chessComUsername: userData.chessComUsername,
        lichessUsername: userData.lichessUsername,
        preferredPlatform: userData.preferredPlatform
      };

      // Store user in localStorage (temporary storage)
      const storedUsers = JSON.parse(localStorage.getItem('chess_users') || '[]');
      storedUsers.push({ ...newUser, password: userData.password });
      localStorage.setItem('chess_users', JSON.stringify(storedUsers));

      setUser(newUser);
      localStorage.setItem('chess_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chess_user');
  };

  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('chess_user', JSON.stringify(updatedUser));
      
      // Update in users array too
      const storedUsers = JSON.parse(localStorage.getItem('chess_users') || '[]');
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === user.id ? { ...u, ...userData } : u
      );
      localStorage.setItem('chess_users', JSON.stringify(updatedUsers));
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
