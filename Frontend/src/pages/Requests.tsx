
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import { Clock, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Requests = () => {
  const [activeTab, setActiveTab] = useState('incoming');

  const incomingRequests = [
    {
      id: 1,
      player: "Alex Chen",
      rating: 1847,
      timeControl: "10+0",
      avatar: "AC",
      country: "🇺🇸",
      timestamp: "2 min ago",
      platform: "chess.com"
    },
    {
      id: 2,
      player: "Sarah Kumar",
      rating: 1623,
      timeControl: "5+3",
      avatar: "SK",
      country: "🇮🇳",
      timestamp: "5 min ago",
      platform: "lichess.org"
    }
  ];

  const outgoingRequests = [
    {
      id: 3,
      player: "Diego Martinez",
      rating: 1789,
      timeControl: "15+10",
      avatar: "DM",
      country: "🇪🇸",
      timestamp: "1 min ago",
      platform: "chess.com"
    }
  ];

  const handleChallenge = (playerId: number) => {
    // This will later link to chess.com or game interface
    console.log(`Starting game with player ${playerId}`);
  };

  const handleAccept = (requestId: number) => {
    console.log(`Accepting request ${requestId}`);
  };

  const handleDecline = (requestId: number) => {
    console.log(`Declining request ${requestId}`);
  };

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

  return (
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
          
          <TabsContent value="incoming" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Incoming Challenges</h3>
              <p className="text-sm text-gray-400">Players who want to challenge you</p>
            </div>
            
            {incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <RequestCard key={request.id} request={request} isIncoming />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <User size={48} className="mx-auto mb-2 opacity-50" />
                <p>No incoming challenges</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="outgoing" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Outgoing Challenges</h3>
              <p className="text-sm text-gray-400">Challenges you've sent to other players</p>
            </div>
            
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Zap size={48} className="mx-auto mb-2 opacity-50" />
                <p>No outgoing challenges</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Requests;
