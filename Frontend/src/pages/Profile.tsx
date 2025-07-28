import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/components/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Edit2, Trophy, Target, Calendar, Wallet, LogOut, Settings } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { username } = useParams();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [settingsProfile, setSettingsProfile] = useState({
    preferredPlatform: user?.preferredPlatform || 'chess.com'
  });
  
  const [editedProfile, setEditedProfile] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    catchphrase: "",
    rating: 1200,
    rank: "Beginner",
    country: "🇰🇪",
    chessComUsername: "",
    lichessUsername: "",
    preferredPlatform: "chess.com" as 'chess.com' | 'lichess.org'
  });
  const [currentRating, setCurrentRating] = useState(1200);
  const [ratingStats, setRatingStats] = useState(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [userStats, setUserStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch profile data for the specific user
  const fetchUserProfile = async (targetUsername: string) => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/profile/${targetUsername}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setProfileUser(userData);
        // Update current rating from backend data
        if (userData.current_rating) {
          setCurrentRating(userData.current_rating);
        }
        // Fetch additional data for this user
        fetchUserStats(targetUsername);
        fetchUserRecentMatches(targetUsername);
      } else {
        console.error('User profile API error:', response.status);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error", 
        description: "Failed to load user profile",
        variant: "destructive"
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch statistics for any user
  const fetchUserStats = async (targetUsername: string) => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/profile/${targetUsername}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
      } else {
        console.error('User stats API error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch recent matches for any user
  const fetchUserRecentMatches = async (targetUsername: string) => {
    setLoadingMatches(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/profile/${targetUsername}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentMatches(data.matches || []);
      } else {
        console.error('User matches API error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Determine which user data to use
  const displayUser = username ? profileUser : user;
  
  const chessProfile = profileUser?.chessProfile;
  const chessStats = profileUser?.chessStats;
  const chessGames = profileUser?.chessGames;

  // Fetch current rating from chess platform
  const fetchCurrentRating = async () => {
    if (!user) {
      return;
    }
    if (username && username !== user.username) {
      return;
    }
    
    setLoadingRating(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/auth/current-rating', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentRating(data.rating);
        setRatingStats(data.stats);
      } else {
        console.error('Rating API error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching current rating:', error);
    } finally {
      setLoadingRating(false);
    }
  };

  // Fetch recent matches from chess platform for any user
  const fetchRecentMatches = async (targetUsername?: string) => {
    const fetchUsername = targetUsername || user?.username;
    if (!fetchUsername) {
      return;
    }
    
    setLoadingMatches(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = targetUsername 
        ? `/api/users/profile/${targetUsername}/matches`
        : '/api/auth/recent-matches';
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentMatches(data.matches || []);
        if (data.stats) {
          setRatingStats(data.stats);
        }
      } else {
        console.error('Recent matches API error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching recent matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (username) {
      // Viewing another user's profile
      fetchUserProfile(username);
    } else if (user) {
      // Viewing own profile
      setProfileUser(user);
      fetchCurrentRating();
      fetchRecentMatches();
      fetchUserStats(user.username);
    }
  }, [user, username]);

  // Use fetched rating, with fallback logic
  let rating = currentRating;
  if (displayUser?.current_rating) {
    rating = displayUser.current_rating;
  } else if (displayUser?.rating) {
    rating = displayUser.rating;
  }

  // Use fetched stats (prioritize userStats over ratingStats)
  let stats = userStats.totalGames > 0 ? userStats : {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0
  };
  
  // If we have ratingStats (for current user) and no userStats, use ratingStats
  if (stats.totalGames === 0 && ratingStats) {
    stats.wins = ratingStats.wins || 0;
    stats.losses = ratingStats.losses || 0;
    stats.draws = ratingStats.draws || 0;
    stats.totalGames = ratingStats.totalGames || stats.wins + stats.losses + stats.draws;
    stats.winRate = ratingStats.winRate || (stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0);
  }
  
  let matchHistory: any[] = recentMatches;

  const handleSave = () => {
        // Validate that at least one chess platform username is provided
    if (!editedProfile.chessComUsername && !editedProfile.lichessUsername) {
      toast({
        title: "Chess platform required",
        description: "Please provide at least one chess platform username.",
        variant: "destructive",
      });
      return;
    }

    // Validate that preferred platform has a username
    const preferredUsername = editedProfile.preferredPlatform === 'chess.com' 
      ? editedProfile.chessComUsername 
      : editedProfile.lichessUsername;
    
    if (!preferredUsername) {
      toast({
        title: "Preferred platform username required",
        description: `Please provide a username for your preferred platform (${editedProfile.preferredPlatform}).`,
        variant: "destructive",
      });
      return;
    }
    updateProfile(editedProfile);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setEditedProfile(user || editedProfile);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleSettingsSave = () => {
    // Validate that the preferred platform has a username
    const preferredUsername = settingsProfile.preferredPlatform === 'chess.com' 
      ? user?.chessComUsername 
      : user?.lichessUsername;
    
    if (!preferredUsername) {
      toast({
        title: "Platform username required",
        description: `Please set your ${settingsProfile.preferredPlatform} username in your profile first.`,
        variant: "destructive",
      });
      return;
    }

    updateProfile({ ...user, preferredPlatform: settingsProfile.preferredPlatform });
    setShowSettings(false);
    toast({
      title: "Settings updated",
      description: "Your preferred platform has been updated.",
    });
  };

  const handleSettingsChange = (field: string, value: string) => {
    setSettingsProfile({ ...settingsProfile, [field]: value });
  };
    const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  if (!user) {
    return null;
  }

  if (loadingProfile) {
    return (
      <div className="chess-background min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (username && !profileUser) {
    return (
      <div className="chess-background min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">User not found</div>
        </div>
      </div>
    );
  }

  // Only allow editing if viewing own profile
  const canEdit = !username || user?.username === username;

  return (
    <div className="chess-background min-h-screen bg-background text-foreground">
      <Header 
        title="Profile" 
        showMenu 
      />
      
      <div className="p-4">
        {/* Profile Header */}
        <div className="chess-card p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-xl font-bold">
                {displayUser?.name?.split(' ').map(n => n[0]).join('') || displayUser?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{displayUser?.name || displayUser?.username}</h2>
                <p className="text-muted-foreground">@{displayUser?.username}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{displayUser?.country || "🌍"}</span>
                  <span className="bg-muted px-2 py-1 rounded text-sm">{displayUser?.rank || "Player"}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="chess-button-secondary"
                    >
                      <Settings size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="chess-card border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="preferredPlatform" className="text-foreground">Preferred Platform</Label>
                        <Select
                          value={settingsProfile.preferredPlatform}
                          onValueChange={(value) => handleSettingsChange('preferredPlatform', value)}
                        >
                          <SelectTrigger className="mt-1 chess-button-secondary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="chess-card border">
                            <SelectItem value="chess.com" className="text-foreground hover:bg-muted">Chess.com</SelectItem>
                            <SelectItem value="lichess.org" className="text-foreground hover:bg-muted">Lichess</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowSettings(false)}
                          className="chess-button-secondary"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSettingsSave} className="chess-button-primary">
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                size="sm"
                className="chess-button-secondary"
                disabled={!canEdit}
              >
                <Edit2 size={16} className="mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>
          
          <div className="text-center chess-card p-4 mb-4">
            <div className="text-3xl font-bold text-foreground">
              {loadingRating && (!username || username === user?.username) ? '...' : rating}
            </div>
            <div className="text-sm text-muted-foreground">Current Rating</div>
          </div>

          {isEditing && canEdit ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-1 chess-button-secondary"
                />
              </div>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editedProfile.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="mt-1 chess-button-secondary"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editedProfile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-1 chess-button-secondary"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editedProfile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-1 chess-button-secondary"
                />
              </div>
              
              <div>
                <Label htmlFor="catchphrase">Catchphrase</Label>
                <Input
                  id="catchphrase"
                  value={editedProfile.catchphrase}
                  onChange={(e) => handleChange('catchphrase', e.target.value)}
                  className="mt-1 chess-button-secondary"
                  placeholder="Add a catchy phrase..."
                />
              </div>
              
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="font-semibold">Chess Platforms</h4>
                
                <div>
                  <Label htmlFor="preferredPlatform">Preferred Platform</Label>
                  <select
                    id="preferredPlatform"
                    value={editedProfile.preferredPlatform}
                    onChange={(e) => handleChange('preferredPlatform', e.target.value)}
                    className="mt-1 w-full chess-button-secondary rounded-md px-3 py-2"
                  >
                    <option value="chess.com">Chess.com</option>
                    <option value="lichess.org">Lichess.org</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="chessComUsername">
                    Chess.com Username {editedProfile.preferredPlatform === 'chess.com' && '*'}
                  </Label>
                  <Input
                    id="chessComUsername"
                    value={editedProfile.chessComUsername || ''}
                    onChange={(e) => handleChange('chessComUsername', e.target.value)}
                    className="mt-1 chess-button-secondary"
                    placeholder="Your Chess.com username"
                  />
                </div>

                <div>
                  <Label htmlFor="lichessUsername">
                    Lichess.org Username {editedProfile.preferredPlatform === 'lichess.org' && '*'}
                  </Label>
                  <Input
                    id="lichessUsername"
                    value={editedProfile.lichessUsername || ''}
                    onChange={(e) => handleChange('lichessUsername', e.target.value)}
                    className="mt-1 chess-button-secondary"
                    placeholder="Your Lichess.org username"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex-1 chess-button-primary">
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1 chess-button-secondary">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-center italic text-muted-foreground">"{displayUser?.slogan || displayUser?.catchphrase || 'Ready to play!'}"</p>
              <div className="text-sm text-muted-foreground space-y-1">
                {(displayUser?.chess_com_username || displayUser?.lichess_username) && (
                  <div className="mt-2 p-2 chess-card rounded">
                    <p className="font-medium text-foreground">Chess Platforms:</p>
                    {displayUser?.chess_com_username && (
                      <p>♘ Chess.com: @{displayUser.chess_com_username} {displayUser.preferred_platform === 'chess.com' && '(preferred)'}</p>
                    )}
                    {displayUser?.lichess_username && (
                      <p>♞ Lichess.org: @{displayUser.lichess_username} {displayUser.preferred_platform === 'lichess.org' && '(preferred)'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Only show for current user */}
        {canEdit && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link 
              to="/wallet"
              className="chess-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Wallet size={20} className="text-foreground" />
                <div>
                  <p className="font-semibold">Wallet</p>
                  <p className="text-sm text-muted-foreground">View balance</p>
                </div>
              </div>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="chess-card p-4 hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <LogOut size={20} className="text-foreground" />
                <div>
                  <p className="font-semibold">Logout</p>
                  <p className="text-sm text-muted-foreground">Sign out</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="chess-card p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Target size={20} className="mr-2" />
            Statistics
          </h3>
          {loadingStats ? (
            <div className="text-center py-4 text-muted-foreground">Loading statistics...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.totalGames}</div>
                <div className="text-sm text-muted-foreground">Total Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.winRate}%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.wins}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stats.losses}</div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="chess-card p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar size={20} className="mr-2" />
            Recent Matches
          </h3>
          <div className="space-y-3">
            {loadingMatches ? (
              <div className="text-center py-4 text-muted-foreground">Loading recent matches...</div>
            ) : matchHistory.length > 0 ? (
              matchHistory.map((match, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      match.result === 'Win' ? 'bg-foreground' : 
                      match.result === 'Loss' ? 'bg-muted-foreground' : 'bg-foreground opacity-70'
                    }`}></div>
                    <div>
                      <p className="font-medium">{match.opponent}</p>
                      <p className="text-sm text-muted-foreground">{match.date}</p>
                      {match.opponentRating && (
                        <p className="text-xs text-muted-foreground">Opponent: {match.opponentRating}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${
                      match.result === 'Win' ? 'text-foreground' : 
                      match.result === 'Loss' ? 'text-muted-foreground' : 'text-foreground opacity-70'
                    }`}>
                      {match.result}
                    </span>
                    <p className="text-sm text-muted-foreground">{match.ratingChange || match.rating}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No recent matches found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
