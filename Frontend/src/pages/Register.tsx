
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/contexts/AuthContext';
import Header from '@/components/Header';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    username: '',
    chessComUsername: '',
    lichessUsername: '',
    preferredPlatform: 'chess.com' as 'chess.com' | 'lichess.org'
  });

  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

        // Validate that at least one chess platform username is provided
    if (!formData.chessComUsername && !formData.lichessUsername) {
      toast({
        title: "Chess platform required",
        description: "Please provide at least one chess platform username.",
        variant: "destructive",
      });
      return;
    }

    // Validate that preferred platform has a username
    const preferredUsername = formData.preferredPlatform === 'chess.com' 
      ? formData.chessComUsername 
      : formData.lichessUsername;
    
    if (!preferredUsername) {
      toast({
        title: "Preferred platform username required",
        description: `Please provide a username for your preferred platform (${formData.preferredPlatform}).`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await signup({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        phone: formData.phone,
        name: formData.username,
        chessComUsername: formData.chessComUsername || undefined,
        lichessUsername: formData.lichessUsername || undefined,
        preferredPlatform: formData.preferredPlatform
      });

      if (success) {
        toast({
          title: "Welcome to Chess Master!",
          description: "Your account has been created successfully.",
        });
        navigate('/play');
      } else {
        toast({
          title: "Registration failed",
          description: "Unable to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Header title="Create Account" showBack />
      
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Join the Game</h2>
          <p className="text-gray-400">Create your chess account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
              placeholder="Choose a username"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
              placeholder="+254 700 000 000"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="space-y-4 border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold">Chess Platforms</h3>
            
            <div>
              <Label htmlFor="preferredPlatform">Preferred Platform *</Label>
              <select
                id="preferredPlatform"
                name="preferredPlatform"
                value={formData.preferredPlatform}
                onChange={handleChange}
                className="mt-1 w-full bg-[#1a1a1a] border-gray-700 text-white rounded-md px-3 py-2"
                required
              >
                <option value="chess.com">Chess.com</option>
                <option value="lichess.org">Lichess.org</option>
              </select>
            </div>

            <div>
              <Label htmlFor="chessComUsername">
                Chess.com Username {formData.preferredPlatform === 'chess.com' && '*'}
              </Label>
              <Input
                id="chessComUsername"
                name="chessComUsername"
                type="text"
                value={formData.chessComUsername}
                onChange={handleChange}
                className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="Your Chess.com username"
                required={formData.preferredPlatform === 'chess.com'}
              />
            </div>

            <div>
              <Label htmlFor="lichessUsername">
                Lichess.org Username {formData.preferredPlatform === 'lichess.org' && '*'}
              </Label>
              <Input
                id="lichessUsername"
                name="lichessUsername"
                type="text"
                value={formData.lichessUsername}
                onChange={handleChange}
                className="mt-1 bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="Your Lichess.org username"
                required={formData.preferredPlatform === 'lichess.org'}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
