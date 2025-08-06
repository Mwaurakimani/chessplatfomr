import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PlatformSelector from '@/components/PlatformSelector';
import { Crown, Star, Trophy, Brain } from 'lucide-react';
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
  const [suggestedOpponents, setSuggestedOpponents] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [playerRatings, setPlayerRatings] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Access socket from AuthContext
  const socket = socketRef?.current;

  // Filter out the current user from the onlinePlayers list - memoized to prevent unnecessary re-renders
  const filteredOnlinePlayers = useMemo(() => {
    return onlineUsers.filter((player) => user && player.id !== user.id);
  }, [onlineUsers, user?.id]);

  // Filter suggested opponents to exclude users who are already online
  const filteredSuggestedOpponents = useMemo(() => {
    const onlinePlayerIds = new Set(filteredOnlinePlayers.map(player => player.id));
    return suggestedOpponents.filter(opponent => !onlinePlayerIds.has(opponent.id));
  }, [suggestedOpponents, filteredOnlinePlayers]);

  const handlePlatformChange = (platform: 'chess.com' | 'lichess.org') => {
    setCurrentPlatform(platform);
    if (user) {
      updateProfile({ preferredPlatform: platform });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-foreground';
      case 'playing': return 'bg-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Master': return <Crown size={16} className="text-foreground opacity-90" />;
      case 'Expert': return <Star size={16} className="text-foreground opacity-80" />;
      default: return <Trophy size={16} className="text-muted-foreground" />;
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
        platform: currentPlatform, // Include the platform information
        timestamp: Date.now(),
      });
      toast({
        title: 'Challenge Sent',
        description: `You challenged ${selectedPlayer.name} on ${currentPlatform}`,
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

  // Cache for player ratings with timestamps
  const [ratingCache, setRatingCache] = useState<Record<string, { rating: number; timestamp: number }>>({});
  const RATING_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Fetch real ratings for online players
  const fetchPlayerRating = async (player: any) => {
    try {
      // Check cache first
      const cached = ratingCache[player.id];
      if (cached && Date.now() - cached.timestamp < RATING_CACHE_DURATION) {
        return cached.rating;
      }

      // Determine platform and username based on player data
      let platform: 'chess.com' | 'lichess.org' = 'chess.com';
      let platformUsername = '';

      if (player.chessComUsername && player.lichessUsername) {
        // Use preferred platform if both exist
        platform = player.preferredPlatform === 'lichess.org' ? 'lichess.org' : 'chess.com';
        platformUsername = platform === 'chess.com' ? player.chessComUsername : player.lichessUsername;
      } else if (player.chessComUsername) {
        platform = 'chess.com';
        platformUsername = player.chessComUsername;
      } else if (player.lichessUsername) {
        platform = 'lichess.org';
        platformUsername = player.lichessUsername;
      }
      
      if (!platformUsername) {
        console.log(`No platform username found for ${player.username}`);
        return 1200; // Default rating
      }

      console.log(`Fetching ${platform} rating for ${player.username} (${platformUsername})`);

      const response = await fetch(`/api/matchmaking/rating/${platform}/${platformUsername}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const rating = data.rating || 1200;
        console.log(`Fresh rating fetched for ${player.username}: ${rating}`);
        
        // Cache the rating with timestamp
        setRatingCache(prev => ({
          ...prev,
          [player.id]: { rating, timestamp: Date.now() }
        }));
        
        return rating;
      } else {
        console.error(`Failed to fetch rating for ${player.username}:`, response.status);
        return 1200;
      }
    } catch (error) {
      console.error('Error fetching player rating for', player.username, ':', error);
      return 1200;
    }
  };

  // Fetch suggested opponents with caching
  const fetchSuggestedOpponents = async (forceRefresh = false) => {
    if (!user) {
      console.log('No user found, skipping suggestions fetch');
      return;
    }
    
    // Check if we have cached suggestions that are still valid (within 5 minutes)
    const cacheKey = `suggestions_${user.id}_${user.preferredPlatform}`;
    const cacheTimestampKey = `suggestions_timestamp_${user.id}_${user.preferredPlatform}`;
    
    if (!forceRefresh) {
      const cachedSuggestions = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      
      if (cachedSuggestions && cacheTimestamp) {
        const timeDiff = Date.now() - parseInt(cacheTimestamp);
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timeDiff < fiveMinutes) {
          setSuggestedOpponents(JSON.parse(cachedSuggestions));
          return;
        }
      }
    }
    
    console.log('Fetching fresh suggestions for user:', user.username);
    setLoadingSuggestions(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        setLoadingSuggestions(false);
        return;
      }

      console.log('Making request to /api/matchmaking/suggested');
      const response = await fetch('/api/matchmaking/suggested', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Suggestions response:', data);
        
        const suggestions = data.suggestions || [];
        setSuggestedOpponents(suggestions);
        
        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify(suggestions));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
        
        if (suggestions.length === 0) {
          console.log('No suggestions returned:', data.message || 'Unknown reason');
        }
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch suggestions:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Fetch suggestions when user or platform changes (with cache check)
  useEffect(() => {
    if (user) {
      fetchSuggestedOpponents(); // Will check cache first
    }
  }, [user, currentPlatform]);

  // Fetch ratings for online players only when needed - with strict caching
  useEffect(() => {
    const fetchRatings = async () => {
      const ratings: Record<string, number> = {};
      const now = Date.now();
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
      
      for (const player of filteredOnlinePlayers.slice(0, 5)) {
        const cachedRating = ratingCache[player.id];
        const existingRating = playerRatings[player.id];
        
        if (cachedRating && (now - cachedRating.timestamp) < CACHE_DURATION) {
          // Use cached rating - no fetch needed
          ratings[player.id] = cachedRating.rating;
        } else if (existingRating && !cachedRating) {
          // Use existing rating and cache it to prevent future fetches
          ratings[player.id] = existingRating;
          setRatingCache(prev => ({
            ...prev,
            [player.id]: { rating: existingRating, timestamp: now }
          }));
        } else if (!existingRating && !cachedRating) {
          // Only fetch if we have no data at all
          const rating = await fetchPlayerRating(player);
          ratings[player.id] = rating;
        }
      }
      
      if (Object.keys(ratings).length > 0) {
        setPlayerRatings(prev => ({ ...prev, ...ratings }));
      }
    };

    if (filteredOnlinePlayers.length > 0) {
      fetchRatings();
    }
  }, [filteredOnlinePlayers.length]); // Keep only length dependency

  return (
    <div className="chess-background bg-background text-foreground min-h-screen">
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

        {/* Suggested Opponents Section */}
        {user && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-foreground" />
                <h2 className="text-lg font-semibold">Suggested Opponents</h2>
              </div>
              <div className="flex items-center gap-2">
                {loadingSuggestions ? (
                  <span className="text-sm text-muted-foreground">Finding matches...</span>
                ) : (
                  <button
                    onClick={() => fetchSuggestedOpponents(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                    disabled={loadingSuggestions}
                  >
                    ↻ Refresh
                  </button>
                )}
              </div>
            </div>
            
            {filteredSuggestedOpponents.length > 0 ? (
              <div className="space-y-2">
                {filteredSuggestedOpponents.slice(0, 3).map((opponent, index) => (
                  <div
                    key={`suggested-${opponent.id}-${index}`}
                    className="chess-card rounded-lg p-4 cursor-pointer transition-all duration-200 border border-border hover:shadow-lg"
                    onClick={() => {
                      setSelectedPlayer(opponent);
                      setModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold text-foreground">
                          {opponent.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{opponent.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>@{opponent.username}</span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              {getRankIcon(opponent.rank || 'Beginner')}
                              <span>{opponent.rank || 'Beginner'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {opponent.rating || '1200'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {opponent.matchReason || 'Good match'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loadingSuggestions && (
                <div className="chess-card rounded-lg p-4 text-center text-muted-foreground">
                  <Brain size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No suggestions available yet</p>
                  <p className="text-sm">Play more games to get better matches</p>
                </div>
              )
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">Online Players</h2>
            <span className="text-sm text-muted-foreground">{filteredOnlinePlayers.length} online</span>
          </div>
        </div>
        <div className="space-y-3">
          {filteredOnlinePlayers.map((player, index) => {
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
                key={`online-${player.id}-${index}`}
                className="block w-full text-left chess-card rounded-lg p-4 transition-all duration-200 border border-border hover:shadow-lg"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-foreground">
                        {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor('online')} rounded-full border-2 border-background`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-foreground">{player.name}</h3>
                        <span className="text-lg">{player.country}</span>
                        {getRankIcon(player.rank)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{getPlatformIcon(platform)}</span>
                          <span className="text-sm text-muted-foreground">
                            {platform === 'chess.com' ? 'Chess.com' : 'Lichess'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {playerRatings[player.id] || player.rating || 1200}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {/* Player Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="bg-card border-border">
            {selectedPlayer && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-lg font-bold text-foreground">
                    {selectedPlayer.name ? selectedPlayer.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{selectedPlayer.name}</h3>
                    <p className="text-muted-foreground">@{selectedPlayer.username}</p>
                    {selectedPlayer.slogan && (
                      <p className="text-sm text-muted-foreground italic mt-1">"{selectedPlayer.slogan}"</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                    onClick={handleChallenge}
                  >
                    Challenge
                  </button>
                  <button
                    className="flex-1 border-2 border-green-600 hover:border-green-700 hover:bg-green-50 text-green-600 hover:text-green-700 py-3 rounded-lg font-medium transition-colors"
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
