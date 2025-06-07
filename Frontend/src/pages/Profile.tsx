import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Edit2, Trophy, Target, Calendar, Wallet, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState(user || {
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

  const matchHistory = [
    { opponent: "Alex Chen", result: "Win", date: "2024-01-15", rating: "+12" },
    { opponent: "Sarah Kumar", result: "Loss", date: "2024-01-14", rating: "-8" },
    { opponent: "Diego Martinez", result: "Win", date: "2024-01-13", rating: "+15" }
  ];

  const stats = {
    totalGames: 156,
    wins: 98,
    losses: 45,
    draws: 13,
    winRate: 63
  };

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

  return (
    <div className="bg-[#141414] text-white min-h-screen">
      <Header 
        title="Profile" 
        showMenu 
      />
      
      <div className="p-4">
        {/* Profile Header */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-gray-400">@{user.username}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{user.country}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded text-sm">{user.rank}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Edit2 size={16} className="mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          <div className="text-center bg-gray-700 rounded-lg p-4 mb-4">
            <div className="text-3xl font-bold text-blue-400">{user.rating}</div>
            <div className="text-sm text-gray-400">Current Rating</div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editedProfile.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editedProfile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editedProfile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="catchphrase">Catchphrase</Label>
                <Input
                  id="catchphrase"
                  value={editedProfile.catchphrase}
                  onChange={(e) => handleChange('catchphrase', e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="Add a catchy phrase..."
                />
              </div>
              
              <div className="space-y-4 border-t border-gray-600 pt-4">
                <h4 className="font-semibold">Chess Platforms</h4>
                
                <div>
                  <Label htmlFor="preferredPlatform">Preferred Platform</Label>
                  <select
                    id="preferredPlatform"
                    value={editedProfile.preferredPlatform}
                    onChange={(e) => handleChange('preferredPlatform', e.target.value)}
                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
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
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
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
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    placeholder="Your Lichess.org username"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-center italic text-gray-300">"{user.catchphrase}"</p>
              <div className="text-sm text-gray-400 space-y-1">
                {(user.chessComUsername || user.lichessUsername) && (
                  <div className="mt-2 p-2 bg-gray-700 rounded">
                    <p className="font-medium text-gray-300">Chess Platforms:</p>
                    {user.chessComUsername && (
                      <p>♘ Chess.com: @{user.chessComUsername} {user.preferredPlatform === 'chess.com' && '(preferred)'}</p>
                    )}
                    {user.lichessUsername && (
                      <p>♞ Lichess.org: @{user.lichessUsername} {user.preferredPlatform === 'lichess.org' && '(preferred)'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link 
            to="/wallet"
            className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Wallet size={20} className="text-green-400" />
              <div>
                <p className="font-semibold">Wallet</p>
                <p className="text-sm text-gray-400">View balance</p>
              </div>
            </div>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-gray-750 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <LogOut size={20} className="text-red-400" />
              <div>
                <p className="font-semibold">Logout</p>
                <p className="text-sm text-gray-400">Sign out</p>
              </div>
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Target size={20} className="mr-2" />
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalGames}</div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
              <div className="text-sm text-gray-400">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
              <div className="text-sm text-gray-400">Losses</div>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar size={20} className="mr-2" />
            Recent Matches
          </h3>
          <div className="space-y-3">
            {matchHistory.map((match, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    match.result === 'Win' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <div>
                    <p className="font-medium">{match.opponent}</p>
                    <p className="text-sm text-gray-400">{match.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${
                    match.result === 'Win' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {match.result}
                  </span>
                  <p className="text-sm text-gray-400">{match.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
