
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Users, Trophy, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground finance-container">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 finance-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Crown size={32} className="text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl mb-4 finance-heading">chequemate</h1>
          <p className="text-xl mb-8 finance-subheading">
            <em>"Checkmate, Cha-ching"</em>
          </p>
          
          <div className="finance-stack max-w-sm mx-auto">
            <Link to="/register" className="block">
              <Button className="w-full finance-button-primary py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button className="w-full finance-button-secondary py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="finance-grid grid-cols-1 md:grid-cols-3 mb-12">
          <div className="finance-card text-center">
            <Users size={32} className="mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2 finance-subheading">Play Online</h3>
            <p className="finance-body">Challenge players from around the world in real-time matches</p>
          </div>
          
          <div className="finance-card text-center">
            <Trophy size={32} className="mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2 finance-subheading">Compete & Win</h3>
            <p className="finance-body">Participate in tournaments and climb the leaderboards</p>
          </div>
          
          <div className="finance-card text-center">
            <Zap size={32} className="mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2 finance-subheading">Fast Matches</h3>
            <p className="finance-body">Quick games with various time controls to fit your schedule</p>
          </div>
        </div>

        {/* Quick Access for Demo
        <div className="finance-card">
          <h3 className="text-lg font-semibold mb-4 text-center finance-subheading">Quick Demo Access</h3>
          <div className="finance-grid grid-cols-1 md:grid-cols-3">
            <Link to="/play">
              <Button className="w-full finance-button-secondary">
                Players List
              </Button>
            </Link>
            <Link to="/requests">
              <Button className="w-full finance-button-secondary">
                Game Requests
              </Button>
            </Link>
            <Link to="/profile">
              <Button className="w-full finance-button-secondary">
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
