
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Users, Trophy, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <Crown size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Chess Master</h1>
          <p className="text-xl text-gray-400 mb-8">
            Challenge players worldwide and master the game of kings
          </p>
          
          <div className="space-y-3 max-w-sm mx-auto">
            <Link to="/register" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
            <Users size={32} className="mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold mb-2">Play Online</h3>
            <p className="text-gray-400">Challenge players from around the world in real-time matches</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
            <Trophy size={32} className="mx-auto mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold mb-2">Compete & Win</h3>
            <p className="text-gray-400">Participate in tournaments and climb the leaderboards</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
            <Zap size={32} className="mx-auto mb-4 text-green-400" />
            <h3 className="text-lg font-semibold mb-2">Fast Matches</h3>
            <p className="text-gray-400">Quick games with various time controls to fit your schedule</p>
          </div>
        </div>

        {/* Quick Access for Demo
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Quick Demo Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to="/play">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                Players List
              </Button>
            </Link>
            <Link to="/requests">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                Game Requests
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                Profile Page
              </Button>
            </Link>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Index;
