
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  from: {
    id: string;
    name: string;
    username: string;
    chessComUsername?: string;
    lichessUsername?: string;
    preferredPlatform?: 'chess.com' | 'lichess.org';
  };
  to: {
    id: string;
    name: string;
    username: string;
    chessComUsername?: string;
    lichessUsername?: string;
    preferredPlatform?: 'chess.com' | 'lichess.org';
  };
  timestamp: number;
  platform?: 'chess.com' | 'lichess.org';
}

interface ChallengeContextType {
  incomingChallenge: Challenge | null;
  setIncomingChallenge: React.Dispatch<React.SetStateAction<Challenge | null>>;
  acceptChallenge: () => void;
  declineChallenge: () => void;
  acceptedChallenge: Challenge | null;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const [acceptedChallenge, setAcceptedChallenge] = useState<Challenge | null>(null);
  const { socketRef, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChallengeReceived = useCallback((data: Challenge) => {
    setIncomingChallenge(data);
    toast({
      title: 'Challenge Received',
      description: `You were challenged by ${data.from.name}`,
    });
  }, [toast]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (socket) {
      socket.on('challenge-received', handleChallengeReceived);
      return () => {
        socket.off('challenge-received', handleChallengeReceived);
      };
    }
  }, [socketRef, handleChallengeReceived]);

  const acceptChallenge = () => {
    if (socketRef?.current && incomingChallenge && user) {
      socketRef.current.emit('challenge-accept', {
        from: incomingChallenge.from,
        to: {
            id: user.id,
            name: user.name,
            username: user.username,
        },
        timestamp: incomingChallenge.timestamp,
        platform: user.preferredPlatform,
      });
      setIncomingChallenge(null);
    }
  };

  const declineChallenge = () => {
    if (socketRef?.current && incomingChallenge && user) {
      socketRef.current.emit('challenge-decline', {
        from: incomingChallenge.from,
        to: {
            id: user.id,
            name: user.name,
            username: user.username,
        },
        timestamp: incomingChallenge.timestamp,
      });
      setIncomingChallenge(null);
    }
  };

  useEffect(() => {
    const socket = socketRef?.current;
    if (socket) {
      const handleChallengeAccepted = (data: Challenge) => {
        setAcceptedChallenge(data);
        toast({
          title: 'Challenge Accepted!',
          description: `Your match with ${user?.id === data.from.id ? data.to.name : data.from.name} is ready!`,
        });

        // Identify the opponent
        const opponent = user?.id === data.from.id ? data.to : data.from;

        let redirectUrl = '';
        if (data.platform === 'chess.com') {
          const opponentUsername = opponent.chessComUsername || opponent.username;
          redirectUrl = `https://www.chess.com/play/online/new?opponent=${opponentUsername.toLowerCase()}`;
        } else if (data.platform === 'lichess.org') {
          const opponentUsername = opponent.lichessUsername || opponent.username;
          redirectUrl = `https://lichess.org/?user=${opponentUsername.toLowerCase()}#friend`;
        }

        if (redirectUrl) {
          window.open(redirectUrl, '_blank');
        }
        
        // Clear any incoming challenge pop-ups if they exist
        setIncomingChallenge(null);
      };

      socket.on('challengeAccepted', handleChallengeAccepted);

      return () => {
        socket.off('challengeAccepted', handleChallengeAccepted);
      };
    }
  }, [socketRef, toast, user]);

  return (
    <ChallengeContext.Provider value={{ incomingChallenge, setIncomingChallenge, acceptChallenge, declineChallenge, acceptedChallenge }}>
      {children}
    </ChallengeContext.Provider>
  );
};
