
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import paymentService from '../../services/paymentService';
import debugService from '../../services/debugService';

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
  time_control?: string;
  timeConfig?: {
    category: string;
    timeMinutes: number;
    incrementSeconds: number;
    displayName: string;
  };
  paymentDetails?: {
    phoneNumber: string;
    amount: number;
  };
}

interface ChallengeContextType {
  incomingChallenge: Challenge | null;
  setIncomingChallenge: React.Dispatch<React.SetStateAction<Challenge | null>>;
  acceptChallenge: (opponentPhoneNumber?: string) => void;
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
    debugService.challengeReceived(data);
    setIncomingChallenge(data);
    toast({
      title: 'Challenge Received',
      description: `You were challenged by ${data.from.name}`,
    });
  }, [toast]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (socket) {
      socket.on('newChallenge', handleChallengeReceived);
      return () => {
        socket.off('newChallenge', handleChallengeReceived);
      };
    }
  }, [socketRef, handleChallengeReceived]);

  const acceptChallenge = async (opponentPhoneNumber?: string) => {
    if (socketRef?.current && incomingChallenge && user) {
      debugService.challengeAccepted(
        opponentPhoneNumber || user.phone || 'NO_PHONE',
        !!(incomingChallenge.paymentDetails && incomingChallenge.paymentDetails.amount > 0)
      );
      
      // If this is a payment challenge, initiate deposits
      if (incomingChallenge.paymentDetails && incomingChallenge.paymentDetails.amount > 0) {
        try {
          // Show loading toast
          toast({
            title: 'Processing Payment Challenge',
            description: 'Setting up deposits for both players...',
          });

          // Get user's phone number from profile or use provided one
          const userPhoneNumber = opponentPhoneNumber || user.phone;
          
          if (!userPhoneNumber) {
            throw new Error('Phone number is required for payment challenges');
          }

          // Emit challenge acceptance first to get challenge ID
          const acceptanceData = {
            from: incomingChallenge.from,
            to: {
                id: user.id,
                name: user.name,
                username: user.username,
            },
            timestamp: incomingChallenge.timestamp,
            platform: user.preferredPlatform,
            paymentDetails: incomingChallenge.paymentDetails,
            opponentPhoneNumber: opponentPhoneNumber,
          };
          
          console.log('🎯 [FRONTEND] Emitting challenge-accept:', acceptanceData);
          socketRef.current.emit('challenge-accept', acceptanceData);

          // Clear incoming challenge immediately
          setIncomingChallenge(null);

          // TODO: We need to get the challenge ID from the backend
          // For now, we'll wait for the challenge to be created and then initiate deposits
          // This will be handled when we implement the deposit flow after challenge creation

        } catch (error) {
          console.error('Error processing payment challenge:', error);
          toast({
            title: 'Payment Error',
            description: error instanceof Error ? error.message : 'Failed to process payment challenge',
            variant: 'destructive'
          });
        }
      } else {
        // Regular challenge without payment
        socketRef.current.emit('challenge-accept', {
          from: incomingChallenge.from,
          to: {
              id: user.id,
              name: user.name,
              username: user.username,
          },
          timestamp: incomingChallenge.timestamp,
          platform: user.preferredPlatform,
          paymentDetails: incomingChallenge.paymentDetails,
          opponentPhoneNumber: opponentPhoneNumber,
        });
        setIncomingChallenge(null);
      }
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
