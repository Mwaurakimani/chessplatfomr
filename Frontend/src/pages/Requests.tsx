import React, { useState, useEffect, createContext, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export const RequestsCountContext = createContext<{ incomingRequestsCount: number }>({ incomingRequestsCount: 0 });

const REQUESTS_STORAGE_KEY = 'chess_requests';

const Requests = () => {
  const { user, socketRef } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingGame, setPendingGame] = useState<any>(null);
  const incomingIds = useRef<Set<string>>(new Set());
  const outgoingIds = useRef<Set<string>>(new Set());

  // Load requests from localStorage on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const stored = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '{}');
    const incoming = stored[user.id]?.incoming || [];
    const outgoing = stored[user.id]?.outgoing || [];
    setIncomingRequests(incoming);
    setOutgoingRequests(outgoing);
    incomingIds.current = new Set(incoming.map((r: any) => r.id?.toString() || ''));
    outgoingIds.current = new Set(outgoing.map((r: any) => r.id?.toString() || ''));
    setLoading(false);
  }, [user]);

  // Save requests to localStorage whenever they change
  useEffect(() => {
    if (!user) return;
    const stored = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '{}');
    stored[user.id] = {
      incoming: incomingRequests,
      outgoing: outgoingRequests,
    };
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(stored));
  }, [incomingRequests, outgoingRequests, user]);

  useEffect(() => {
    if (!user || !socketRef?.current) return;
    const socket = socketRef.current;
    const handleChallengeReceived = (data: any) => {
      // Use a unique id (timestamp + from.id)
      const reqId = `${data.timestamp}_${data.from.id}`;
      if (!incomingIds.current.has(reqId)) {
        setIncomingRequests((prev) => {
          const newReq = {
            id: reqId,
            player: data.from.name,
            userId: data.from.id,
            rating: data.from.rating || 1200,
            avatar: data.from.name.split(' ').map((n: string) => n[0]).join(''),
            country: data.from.country || '',
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
            platform: data.from.platform || 'chess.com',
            timeControl: '10+0',
          };
          incomingIds.current.add(reqId);
          return [newReq, ...prev];
        });
      }
      // Only show toast, do not navigate
      import('@/hooks/use-toast').then(({ useToast }) => {
        useToast().toast({
          title: 'Challenge Received',
          description: `You were challenged by ${data.from.name}`,
        });
      });
    };
    const handleChallengeSent = (data: any) => {
      const reqId = `${data.timestamp}_${data.to.id}`;
      if (!outgoingIds.current.has(reqId)) {
        setOutgoingRequests((prev) => {
          const newReq = {
            id: reqId,
            player: data.to.name,
            userId: data.to.id,
            rating: data.to.rating || 1200,
            avatar: data.to.name.split(' ').map((n: string) => n[0]).join(''),
            country: data.to.country || '',
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
            platform: data.to.platform || 'chess.com',
            timeControl: '10+0',
          };
          outgoingIds.current.add(reqId);
          return [newReq, ...prev];
        });
      }
      // Only show toast, do not navigate
      import('@/hooks/use-toast').then(({ useToast }) => {
        useToast().toast({
          title: 'Challenge Sent',
          description: `You challenged ${data.to.name}`,
        });
      });
    };
    const handleChallengesUpdate = (challenges: any[]) => {
      // Filter for this user
      const incoming = challenges.filter(c => c.to.id === user.id).map(c => ({
        id: `${c.timestamp}_${c.from.id}`,
        player: c.from.name,
        userId: c.from.id,
        rating: c.from.rating || 1200,
        avatar: c.from.name.split(' ').map((n: string) => n[0]).join(''),
        country: c.from.country || '',
        timestamp: new Date(c.timestamp).toLocaleTimeString(),
        platform: c.from.platform || 'chess.com',
        timeControl: '10+0',
      }));
      const outgoing = challenges.filter(c => c.from.id === user.id).map(c => ({
        id: `${c.timestamp}_${c.to.id}`,
        player: c.to.name,
        userId: c.to.id,
        rating: c.to.rating || 1200,
        avatar: c.to.name.split(' ').map((n: string) => n[0]).join(''),
        country: c.to.country || '',
        timestamp: new Date(c.timestamp).toLocaleTimeString(),
        platform: c.to.platform || 'chess.com',
        timeControl: '10+0',
      }));
      incomingIds.current = new Set(incoming.map((r: any) => r.id));
      outgoingIds.current = new Set(outgoing.map((r: any) => r.id));
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    };
    socket.on('challenge-received', handleChallengeReceived);
    socket.on('challenge-sent', handleChallengeSent);
    socket.on('challenges-update', handleChallengesUpdate);
    return () => {
      socket.off('challenge-received', handleChallengeReceived);
      socket.off('challenge-sent', handleChallengeSent);
      socket.off('challenges-update', handleChallengesUpdate);
    };
  }, [user, socketRef]);

  const handleChallenge = (playerId: number) => {
    // This will later link to chess.com or game interface
    console.log(`Starting game with player ${playerId}`);
  };

  const handleAccept = (requestId: string) => {
    const req = incomingRequests.find((r) => r.id === requestId);
    setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    if (user && req) {
      const stored = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '{}');
      stored[user.id] = {
        incoming: incomingRequests.filter((r) => r.id !== requestId),
        outgoing: outgoingRequests,
      };
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(stored));
      // Emit accept event to backend
      if (socketRef?.current) {
        socketRef.current.emit('challenge-accept', {
          from: { id: req.userId, name: req.player },
          to: { id: user.id, name: user.name },
          timestamp: requestId.split('_')[0],
          platform: req.platform
        });
      }
    }
    import('@/hooks/use-toast').then(({ useToast }) => {
      useToast().toast({
        title: 'Challenge Accepted',
        description: 'You accepted the challenge.',
      });
    });
  };

  const handleDecline = (requestId: string) => {
    const req = incomingRequests.find((r) => r.id === requestId);
    setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    if (user && req) {
      const stored = JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY) || '{}');
      stored[user.id] = {
        incoming: incomingRequests.filter((r) => r.id !== requestId),
        outgoing: outgoingRequests,
      };
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(stored));
      // Emit decline event to backend
      if (socketRef?.current) {
        socketRef.current.emit('challenge-decline', {
          from: { id: req.userId, name: req.player },
          to: { id: user.id, name: user.name },
          timestamp: requestId.split('_')[0],
        });
      }
    }
    import('@/hooks/use-toast').then(({ useToast }) => {
      useToast().toast({
        title: 'Challenge Declined',
        description: 'You declined the challenge.',
      });
    });
  };

  // Listen for challenge-accepted and challenge-declined events
  useEffect(() => {
    if (!user || !socketRef?.current) return;
    const socket = socketRef.current;
    const handleAccepted = (data: any) => {
      // Remove outgoing request for this challenge
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== `${data.timestamp}_${data.to.id}`));
      // Show modal to challenger
      setPendingGame(data);
      setShowStartModal(true);
    };
    const handleDeclined = (data: any) => {
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== `${data.timestamp}_${data.to.id}`));
      import('@/hooks/use-toast').then(({ useToast }) => {
        useToast().toast({
          title: 'Challenge Declined',
          description: 'Your challenge was declined.',
        });
      });
    };
    socket.on('challenge-accepted', handleAccepted);
    socket.on('challenge-declined', handleDeclined);
    return () => {
      socket.off('challenge-accepted', handleAccepted);
      socket.off('challenge-declined', handleDeclined);
    };
  }, [user, socketRef]);

  const getPlatformIcon = (platform: string) => {
    return platform === 'chess.com' ? '♘' : '♞';
  };

  const getPlatformDisplayName = (platform: string) => {
    return platform === 'chess.com' ? 'Chess.com' : 'Lichess.org';
  };

  const RequestCard = ({ request, isIncoming = false }: { request: any, isIncoming?: boolean }) => (
    <div className="bg-[#1a1a1a] rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
            {request.avatar}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{request.player}</h3>
              <span>{request.country}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{request.rating}</span>
              <Clock size={12} />
              <span>{request.timeControl}</span>
              <span className="text-gray-500">•</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm">{getPlatformIcon(request.platform)}</span>
                <span className="text-sm">{getPlatformDisplayName(request.platform)}</span>
              </div>
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-500">{request.timestamp}</span>
      </div>
      
      {isIncoming ? (
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleAccept(request.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            Accept
          </Button>
          <Button 
            onClick={() => handleDecline(request.id)}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            size="sm"
          >
            Decline
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-sm text-yellow-400 flex items-center">
            <Clock size={12} className="mr-1" />
            Waiting for response...
          </span>
          <Button 
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="bg-[#141414] text-white min-h-screen flex flex-col items-center justify-center">
        <Header title="Game Requests" />
        <div className="text-red-400 font-bold text-lg">{error}</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="bg-[#141414] text-white min-h-screen flex flex-col items-center justify-center">
        <Header title="Game Requests" />
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Provide the count to context consumers
  return (
    <RequestsCountContext.Provider value={{ incomingRequestsCount: incomingRequests.length }}>
      <div className="bg-[#141414] text-white min-h-screen">
        <Header title="Game Requests" />
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a]">
              <TabsTrigger value="incoming" className="data-[state=active]:bg-gray-700 relative">
                Incoming
                {incomingRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {incomingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="data-[state=active]:bg-gray-700 relative">
                Outgoing
                {outgoingRequests.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {outgoingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="incoming">
              {incomingRequests.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">No incoming requests yet.</div>
              ) : (
                incomingRequests.map((req) => (
                  <RequestCard key={req.id} request={req} isIncoming />
                ))
              )}
            </TabsContent>
            <TabsContent value="outgoing">
              {outgoingRequests.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">No outgoing requests yet.</div>
              ) : (
                outgoingRequests.map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
          <DialogContent>
            {pendingGame && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Challenge Accepted!</h2>
                <p>{pendingGame.to.name} accepted your challenge. Start the game?</p>
                <div className="flex space-x-2">
                  <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => {
                    // Redirect to chess.com or lichess.org
                    const platform = pendingGame.platform;
                    const challenger = pendingGame.from.name;
                    const challenged = pendingGame.to.name;
                    if (platform === 'chess.com') {
                      window.open(`https://www.chess.com/play/online/new?opponent=${challenged.toLowerCase()}`,'_blank');
                    } else {
                      window.open(`https://lichess.org/?user=${challenged.toLowerCase()}#friend`,'_blank');
                    }
                    setShowStartModal(false);
                  }}>Start Game</Button>
                  <Button className="bg-yellow-600 hover:bg-yellow-700 flex-1" onClick={() => setShowStartModal(false)}>Reschedule</Button>
                  <Button className="bg-red-600 hover:bg-red-700 flex-1" onClick={() => setShowStartModal(false)}>Abort</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RequestsCountContext.Provider>
  );
};

export default Requests;
