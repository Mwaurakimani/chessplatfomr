import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PlatformSelector from '@/components/PlatformSelector';
import { Crown, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const Play = () => {
  const { user, updateProfile, onlineUsers, socketRef } = useAuth();
  const [currentPlatform, setCurrentPlatform] = useState<'chess.com' | 'lichess.org'>(
    user?.preferredPlatform || 'chess.com'
  );
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  // Access socket from AuthContext
  const socket = socketRef?.current;

  // Filter out the current user from the onlinePlayers list
  const filteredOnlinePlayers = onlineUsers.filter(
    (player) => user && player.id !== user.id
  );

  const handlePlatformChange = (platform: 'chess.com' | 'lichess.org') => {
    setCurrentPlatform(platform);
    if (user) {
      updateProfile({ preferredPlatform: platform });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'playing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Master': return <Crown size={16} className="text-yellow-400" />;
      case 'Expert': return <Star size={16} className="text-blue-400" />;
      default: return <Trophy size={16} className="text-gray-400" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'chess.com' ? '♘' : '♞';
  };

  const getPlatformDisplayName = (platform: string) => {
    return platform === 'chess.com' ? 'Chess.com' : 'Lichess.org';
  };

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
    setModalOpen(true);
  };

  const handleChallenge = () => {
    if (user && selectedPlayer && socketRef?.current) {
      socketRef.current.emit('challenge', {
        from: {
          id: user.id,
          username: user.username,
          name: user.name,
        },
        to: {
          id: selectedPlayer.id,
          username: selectedPlayer.username,
          name: selectedPlayer.name,
        },
        timestamp: Date.now(),
      });
      toast({
        title: 'Challenge Sent',
        description: `You challenged ${selectedPlayer.name}`,
      });
    }
    setModalOpen(false);
  };

  const handleViewProfile = () => {
    setModalOpen(false);
    if (selectedPlayer?.username) {
      navigate(`/profile/${selectedPlayer.username}`);
    }
  };

  

  return (
    <div className="bg-[#141414] text-white min-h-screen">
      <Header title="Players" showMenu />
      <div className="p-4">
        {/* Platform Selector */}
        {user && (
          <div className="mb-6">
            <PlatformSelector
              chessComUsername={user.chessComUsername}
              lichessUsername={user.lichessUsername}
              currentPlatform={currentPlatform}
              onPlatformChange={handlePlatformChange}
            />
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Online Players</h2>
            <span className="text-sm text-gray-400">{filteredOnlinePlayers.length} online</span>
          </div>
        </div>
        <div className="space-y-3">
          {filteredOnlinePlayers.map((player) => {
            // Determine the platform for the player:
            let platform: 'chess.com' | 'lichess.org';
            if (player.chessComUsername && player.lichessUsername) {
              // Use preferredPlatform if both exist
              platform =
          player.preferredPlatform === 'lichess.org'
            ? 'lichess.org'
            : 'chess.com';
            } else if (player.chessComUsername) {
              platform = 'chess.com';
            } else if (player.lichessUsername) {
              platform = 'lichess.org';
            } else {
              platform = 'chess.com'; // fallback
            }

            return (
              <button
                key={player.id}
                className="block w-full text-left bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#202020] transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor('online')} rounded-full border-2 border-[#141414]`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{player.name}</h3>
                        <span className="text-lg">{player.country}</span>
                        {getRankIcon(player.rank)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{getPlatformIcon(platform)}</span>
                          <span className="text-sm text-gray-400">
                            {platform === 'chess.com' ? 'Chess.com' : 'Lichess'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">{player.rating}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {/* Player Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            {selectedPlayer && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold">
                    {selectedPlayer.name ? selectedPlayer.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPlayer.name}</h3>
                    <p className="text-gray-400">@{selectedPlayer.username}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                    onClick={handleChallenge}
                  >
                    Challenge
                  </button>
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
                    onClick={handleViewProfile}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Play;
