import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

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
  onlineUsers: User[];
  socketRef: React.RefObject<Socket | null>; // Expose socketRef type
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
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('chess_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (socketRef.current) return; // Prevent multiple connections
    const socket = io('http://localhost:3000', { transports: ['websocket'] });
    socketRef.current = socket;
    // Emit user-online event with user info
    socket.emit('user-online', {
      id: user.id,
      name: user.name,
      rating: user.rating,
      avatar: user.name.split(' ').map(n => n[0]).join(''),
      country: user.country,
      rank: user.rank,
      platform: user.preferredPlatform,
      platformUsername: user.chessComUsername || user.lichessUsername || user.username,
      chessComUsername: user.chessComUsername,
      lichessUsername: user.lichessUsername
    });
    // Listen for online-users updates
    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });
    // Cleanup on unmount or logout
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // The login API call is now handled in the Login component
      // We just need to set up the user session here using the response data
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Create a user object from the response data
        const userObject: User = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          name: data.user.name || data.user.username,
          phone: data.user.phone || "",
          rating: data.user.rating || 1200,
          rank: data.user.rank || "Beginner",
          country: data.user.country || "🇰🇪",
          chessComUsername: data.user.chessComUsername,
          lichessUsername: data.user.lichessUsername,
          preferredPlatform: data.user.preferredPlatform || "chess.com",
          catchphrase: data.user.catchphrase || "Ready to play!"
        };

        setUser(userObject);
        localStorage.setItem('chess_user', JSON.stringify(userObject));
        localStorage.setItem('token', data.token);
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

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      await response.json();
      window.location.href = '/login'; // Redirect to login after successful signup

      // console.log(resp)

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
    updateProfile,
    onlineUsers,
    socketRef // expose socketRef for real-time events
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
