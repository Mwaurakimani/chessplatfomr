import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/contexts/AuthContext';
import { useRequests } from '@/components/contexts/RequestsContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CountdownModal } from '@/components/CountdownModal';
import { getTimeClass } from '@/lib/timeUtils';

const REQUESTS_STORAGE_KEY = 'chess-requests';

const Requests = () => {
  const { user, socketRef } = useAuth();
  const { refreshRequestsCount } = useRequests();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [postponedRequests, setPostponedRequests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [isUserChallenger, setIsUserChallenger] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchChallenges = async () => {
      try {
        const res = await fetch(`/api/challenges/${user.id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const incoming = data.filter((c: any) => String(c.opponent.id) === String(user.id) && c.status === 'pending');
          const outgoing = data.filter((c: any) => String(c.challenger.id) === String(user.id) && c.status === 'pending');
          const postponed = data.filter((c: any) => c.status === 'postponed');
          setIncomingRequests(incoming);
          setOutgoingRequests(outgoing);
          setPostponedRequests(postponed);
          
          // Refresh the global requests count
          refreshRequestsCount();
        } else {
          setError('Failed to fetch challenges');
        }
      } catch (err) {
        setError('Failed to fetch challenges');
      }
      setLoading(false);
    };

    fetchChallenges();
  }, [user]);

  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleNewChallenge = (challenge: any) => {
      if (String(challenge.opponent.id) === String(user?.id)) {
        setIncomingRequests((prev) => [challenge, ...prev]);
        // Refresh the global requests count
        refreshRequestsCount();
        toast({
          title: 'New Challenge',
          description: `You have a new challenge from ${challenge.challenger.username}!`,
        });
      }
    };

    const handleChallengeSent = (challenge: any) => {
      if (String(challenge.challenger.id) === String(user?.id)) {
        setOutgoingRequests((prev) => [challenge, ...prev]);
      }
    };

    socket.on('newChallenge', handleNewChallenge);
    socket.on('challengeSent', handleChallengeSent);

    return () => {
      socket.off('newChallenge', handleNewChallenge);
      socket.off('challengeSent', handleChallengeSent);
    };
  }, [socketRef, user, toast]);

  // Early returns for error and loading states
  if (error) {
    return (
      <div className="chess-background bg-background text-foreground min-h-screen flex flex-col items-center justify-center">
        <Header title="Game Requests" />
        <div className="text-destructive font-bold text-lg">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chess-background bg-background text-foreground min-h-screen flex flex-col items-center justify-center">
        <Header title="Game Requests" />
        <div className="font-bold text-lg">Loading...</div>
      </div>
    );
  }

  const handleGoNow = () => {
    // Navigate to the game page with challenge details
    if (activeChallenge) {
      setShowCountdownModal(false);
      
      const platform = activeChallenge.platform;
      const timeControl = activeChallenge.time_control;
      const opponent = isUserChallenger ? activeChallenge.opponent.username : activeChallenge.challenger.username;
      
      // Use the same logic as startMatch3.html for proper opponent pre-loading
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
    }
  };

  const handlePostpone = async () => {
    if (activeChallenge) {
      try {
        const response = await fetch(`/api/challenges/${activeChallenge.id}/postpone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          setShowCountdownModal(false);
          setActiveChallenge(null);
          // Refresh requests to update the lists
          refreshRequestsCount();
          toast({
            title: 'Challenge Postponed',
            description: 'The challenge has been postponed and moved to your postponed list.',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to postpone challenge',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to postpone challenge',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAcceptChallenge = async (challengeId: string, isChallenger: boolean = false) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveChallenge(data.challenge);
        setIsUserChallenger(isChallenger);
        setShowCountdownModal(true);
        
        // Remove from incoming requests
        setIncomingRequests(prev => prev.filter(req => req.id !== challengeId));
        
        // Refresh the global requests count
        refreshRequestsCount();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to accept challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept challenge',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Remove from incoming requests
        setIncomingRequests(prev => prev.filter(req => req.id !== challengeId));
        
        // Refresh the global requests count
        refreshRequestsCount();
        
        toast({
          title: 'Challenge Declined',
          description: 'Challenge has been declined',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to decline challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline challenge',
        variant: 'destructive',
      });
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Remove from outgoing requests
        setOutgoingRequests(prev => prev.filter(req => req.id !== challengeId));
        
        toast({
          title: 'Challenge Cancelled',
          description: 'Challenge has been cancelled',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to cancel challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel challenge',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Remove from postponed requests
        setPostponedRequests(prev => prev.filter(req => req.id !== challengeId));
        
        toast({
          title: 'Challenge Deleted',
          description: 'Challenge has been deleted',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete challenge',
        variant: 'destructive',
      });
    }
  };

  const handlePostponeChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        // Move from incoming to postponed
        const challenge = incomingRequests.find(req => req.id === challengeId);
        if (challenge) {
          setIncomingRequests(prev => prev.filter(req => req.id !== challengeId));
          setPostponedRequests(prev => [{ ...challenge, status: 'postponed' }, ...prev]);
        }
        
        // Refresh the global requests count
        refreshRequestsCount();
        
        toast({
          title: 'Challenge Postponed',
          description: 'Challenge has been postponed',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to postpone challenge',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to postpone challenge',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  const RequestCard: React.FC<{
    challenge: any;
    type: 'incoming' | 'outgoing' | 'postponed';
  }> = ({ challenge, type }) => {
    const isIncoming = type === 'incoming';
    const isOutgoing = type === 'outgoing';
    const isPostponed = type === 'postponed';

    const opponentInfo = isIncoming ? challenge.challenger : challenge.opponent;
    const challengerInfo = challenge.challenger;

    return (
      <div className="bg-card text-card-foreground border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">
              {isIncoming ? `Challenge from ${opponentInfo?.username || 'Unknown'}` :
               isOutgoing ? `Challenge to ${opponentInfo?.username || 'Unknown'}` :
               `Postponed challenge with ${opponentInfo?.username || 'Unknown'}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              Game Type: {challenge.game_type || 'Standard'} • 
              Duration: {challenge.duration || 'Not specified'} • 
              Rating: {challenge.rating_range || 'Open'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="inline w-3 h-3 mr-1" />
              {formatTime(challenge.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isIncoming && (
            <>
              <Button
                onClick={() => handleAcceptChallenge(challenge.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Accept
              </Button>
              <Button
                onClick={() => handleDeclineChallenge(challenge.id)}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                size="sm"
              >
                Decline
              </Button>
              <Button
                onClick={() => handlePostponeChallenge(challenge.id)}
                variant="outline"
                size="sm"
              >
                Postpone
              </Button>
            </>
          )}

          {isOutgoing && (
            <Button
              onClick={() => handleCancelChallenge(challenge.id)}
              variant="outline"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              size="sm"
            >
              Cancel
            </Button>
          )}

          {isPostponed && (
            <>
              <Button
                onClick={() => handleAcceptChallenge(challenge.id, String(challengerInfo?.id) === String(user?.id))}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Resume
              </Button>
              <Button
                onClick={() => handleDeleteChallenge(challenge.id)}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                size="sm"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const totalRequests = incomingRequests.length + outgoingRequests.length + postponedRequests.length;

  return (
    <div className="chess-background bg-background text-foreground min-h-screen">
      <Header title="Game Requests" />
      
      <div className="container mx-auto p-4 max-w-4xl">
        {totalRequests === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">No game requests at the moment.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Visit the Play page to challenge other players!
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="incoming" className="relative">
                Incoming
                {incomingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {incomingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="relative">
                Outgoing
                {outgoingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {outgoingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="postponed" className="relative">
                Postponed
                {postponedRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {postponedRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="mt-6">
              {incomingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No incoming requests.</p>
              ) : (
                incomingRequests.map((challenge) => (
                  <RequestCard
                    key={challenge.id}
                    challenge={challenge}
                    type="incoming"
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="mt-6">
              {outgoingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No outgoing requests.</p>
              ) : (
                outgoingRequests.map((challenge) => (
                  <RequestCard
                    key={challenge.id}
                    challenge={challenge}
                    type="outgoing"
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="postponed" className="mt-6">
              {postponedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No postponed requests.</p>
              ) : (
                postponedRequests.map((challenge) => (
                  <RequestCard
                    key={challenge.id}
                    challenge={challenge}
                    type="postponed"
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {showCountdownModal && (
        <CountdownModal
          isOpen={showCountdownModal}
          onClose={() => setShowCountdownModal(false)}
          challenge={activeChallenge}
          onGoNow={handleGoNow}
          onPostpone={handlePostpone}
          isChallenger={isUserChallenger}
        />
      )}
    </div>
  );
};

export default Requests;
