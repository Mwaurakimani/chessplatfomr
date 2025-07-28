import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface RequestsContextType {
  incomingRequestsCount: number;
  refreshRequestsCount: () => Promise<void>;
}

const RequestsContext = createContext<RequestsContextType>({
  incomingRequestsCount: 0,
  refreshRequestsCount: async () => {},
});

export const useRequests = () => {
  return useContext(RequestsContext);
};

interface RequestsProviderProps {
  children: ReactNode;
}

export const RequestsProvider = ({ children }: RequestsProviderProps) => {
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const { user, socketRef } = useAuth();

  const refreshRequestsCount = async () => {
    if (!user) {
      setIncomingRequestsCount(0);
      return;
    }

    try {
      const res = await fetch(`/api/challenges/${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const incoming = data.filter((c: any) => 
          String(c.opponent.id) === String(user.id) && c.status === 'pending'
        );
        setIncomingRequestsCount(incoming.length);
      }
    } catch (error) {
      console.error('Failed to fetch requests count:', error);
      setIncomingRequestsCount(0);
    }
  };

  // Refresh count when user changes
  useEffect(() => {
    refreshRequestsCount();
  }, [user]);

  // Listen for socket events to update count in real-time
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    // When a new challenge is received, refresh the count
    const handleNewChallenge = () => {
      refreshRequestsCount();
    };

    // When a challenge is accepted/declined, refresh the count
    const handleChallengeUpdate = () => {
      refreshRequestsCount();
    };

    socket.on('newChallenge', handleNewChallenge);
    socket.on('challengeAccepted', handleChallengeUpdate);
    socket.on('challengeDeclined', handleChallengeUpdate);

    return () => {
      socket.off('newChallenge', handleNewChallenge);
      socket.off('challengeAccepted', handleChallengeUpdate);
      socket.off('challengeDeclined', handleChallengeUpdate);
    };
  }, [socketRef?.current]);

  return (
    <RequestsContext.Provider value={{ incomingRequestsCount, refreshRequestsCount }}>
      {children}
    </RequestsContext.Provider>
  );
};
