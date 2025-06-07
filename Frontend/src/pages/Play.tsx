
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import PlatformSelector from '@/components/PlatformSelector';
import { Crown, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';

const Play = () => {
  const { user, updateProfile } = useAuth();
  const [currentPlatform, setCurrentPlatform] = useState<'chess.com' | 'lichess.org'>(
    user?.preferredPlatform || 'chess.com'
  );

  const players = [
    {
      id: 1,
      name: "Alex Chen",
      rating: 1847,
      status: "online",
      avatar: "AC",
      country: "🇺🇸",
      wins: 145,
      losses: 23,
      rank: "Master",
      platform: "chess.com",
      platformUsername: "alexchen1847"
    },
    {
      id: 2,
      name: "Sarah Kumar",
      rating: 1623,
      status: "online",
      avatar: "SK",
      country: "🇮🇳",
      wins: 89,
      losses: 34,
      rank: "Expert",
      platform: "lichess.org",
      platformUsername: "sarahk_chess"
    },
    {
      id: 3,
      name: "Diego Martinez",
      rating: 1789,
      status: "offline",
      avatar: "DM",
      country: "🇪🇸",
      wins: 201,
      losses: 45,
      rank: "Master",
      platform: "chess.com",
      platformUsername: "diego_chess"
    },
    {
      id: 4,
      name: "Emma Wilson",
      rating: 1456,
      status: "playing",
      avatar: "EW",
      country: "🇬🇧",
      wins: 67,
      losses: 28,
      rank: "Advanced",
      platform: "lichess.org",
      platformUsername: "emmaw_plays"
    }
  ];

  // Filter to only show online players
  const onlinePlayers = players.filter(player => player.status === 'online');

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
            <span className="text-sm text-gray-400">{onlinePlayers.length} online</span>
          </div>
        </div>

        <div className="space-y-3">
          {onlinePlayers.map((player) => (
            <Link 
              key={player.id} 
              to={`/player/${player.id}`}
              className="block bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#202020] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                      {player.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(player.status)} rounded-full border-2 border-[#141414]`}></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{player.name}</h3>
                      <span className="text-lg">{player.country}</span>
                      {getRankIcon(player.rank)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* <p className="text-sm text-gray-400 capitalize">{player.status}</p> */}
                      {/* <span className="text-sm text-gray-500">•</span> */}
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">{getPlatformIcon(player.platform)}</span>
                        <span className="text-sm text-gray-400">{getPlatformDisplayName(player.platform)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">{player.rating}</div>
                  <div className="text-xs text-gray-400">
                    {player.wins}W-{player.losses}L
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Play;
