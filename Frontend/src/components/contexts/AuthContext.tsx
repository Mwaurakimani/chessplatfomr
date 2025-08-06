import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { getTimeClass } from '@/lib/timeUtils';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  catchphrase?: string;
  slogan?: string;
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
  const { toast } = useToast();

  const createAndStartGame = (challenge: any) => {
    const platform = challenge.platform;
    const timeControl = challenge.time_control;
    const challenger = challenge.challenger.username;
    const opponent = challenge.opponent.username;
    
    // For chess.com games, use the direct challenge URL with opponent pre-loaded
    if (platform === 'chess.com') {
      // Use the proper chess.com challenge URL that pre-loads the opponent
      const gameUrl = `https://www.chess.com/play/online/new?opponent=${opponent.toLowerCase()}`;
      window.open(gameUrl, '_blank');
      
      // Show instructions
      toast({
        title: 'Game Starting!',
        description: `Opening chess.com with ${opponent} pre-loaded. Set time control to ${timeControl} and start the game!`,
        duration: 15000,
      });
    } else if (platform === 'lichess.org') {
      // For lichess, use the direct challenge URL with opponent pre-loaded
      const gameUrl = `https://lichess.org/?user=${opponent.toLowerCase()}#friend`;
      window.open(gameUrl, '_blank');
      
      toast({
        title: 'Game Starting!',
        description: `Opening lichess with ${opponent} pre-loaded. Send a ${timeControl} challenge!`,
        duration: 15000,
      });
    } else {
      // Fallback to platform homepage
      const correctedPlatform = platform.replace('.com', '');
      window.open(`https://www.${correctedPlatform}.com`, '_blank');
    }
  };

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
    const socket = io('http://localhost:3001', { transports: ['websocket'] });
    socketRef.current = socket;
    // Emit user-online event with user info
    socket.emit('user-online', {
      id: user.id,
      name: user.name,
      username: user.username,
      rating: user.rating,
      avatar: user.name.split(' ').map(n => n[0]).join(''),
      country: user.country,
      rank: user.rank,
      platform: user.preferredPlatform,
      platformUsername: user.chessComUsername || user.lichessUsername || user.username,
      chessComUsername: user.chessComUsername,
      lichessUsername: user.lichessUsername,
      slogan: user.slogan || user.catchphrase || 'Ready to Play!'
    });
    // Listen for online-users updates
    socket.on('online-users', (users) => {
      // Deduplicate users by ID to prevent duplicate keys in React
      const uniqueUsers = users.filter((user: User, index: number, arr: User[]) => 
        arr.findIndex(u => u.id === user.id) === index
      );
      
      // Additional check to ensure we don't have the same user data as before
      setOnlineUsers(prevUsers => {
        const prevUserIds = new Set(prevUsers.map(u => u.id));
        const newUserIds = new Set(uniqueUsers.map(u => u.id));
        
        // Only update if the user sets are actually different
        if (prevUsers.length !== uniqueUsers.length || 
            !Array.from(newUserIds).every((id: string) => prevUserIds.has(id))) {
          return uniqueUsers;
        }
        return prevUsers;
      });
    });

    // Listen for challenge accepted notifications
    socket.on('challengeAccepted', (data) => {
      // Extract challenger ID from the data structure
      const challengerId = data.challengerId || data.challenge?.challenger?.id;
      const challengerUsername = data.challengerUsername || data.challenge?.challenger?.username;
      const accepterUsername = data.accepterUsername;
      
      // Only show notification if this user is the challenger
      if (challengerId && String(challengerId) === String(user.id)) {
        const handlePlayNow = () => {
          // Create and start the game immediately
          createAndStartGame(data.challenge);
        };
        
        const handlePostpone = async () => {
          try {
            const response = await fetch(`/api/challenges/${data.challenge.id}/postpone`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.ok) {
              toast({
                title: 'Challenge Postponed',
                description: 'The challenge has been postponed.',
              });
            }
          } catch (error) {
            console.error('Failed to postpone challenge:', error);
          }
        };
        
        toast({
          title: 'Challenge Accepted! 🎉',
          description: `${accepterUsername} has accepted your challenge! Click "Play Now" to start the game or dismiss to postpone.`,
          duration: 15000,
          action: (
            <ToastAction altText="Play Now" onClick={handlePlayNow}>
              Play Now
            </ToastAction>
          ),
        });
      }
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
      const response = await fetch('http://localhost:3001/api/auth/login', {
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
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (data.success) {
        // Create a user object from the response data
        const userObject: User = {
          id: data.user.id,
          name: userData.name || userData.username,
          username: data.user.username,
          email: data.user.email,
          phone: userData.phone,
          catchphrase: "Ready to play!",
          rating: 1200,
          rank: "Beginner",
          country: "🇰🇪",
          chessComUsername: userData.chessComUsername,
          lichessUsername: userData.lichessUsername,
          preferredPlatform: data.user.preferredPlatform
        };

        setUser(userObject);
        localStorage.setItem('chess_user', JSON.stringify(userObject));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error during registration' };
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
