import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/contexts/AuthContext';
import Header from '@/components/Header';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginSuccess = await login(formData.email, formData.password);
      if (loginSuccess) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate('/play');
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground finance-container">
      <Header title="Welcome Back" showBack />
      
      <div className="p-6">
        <div className="text-center mb-8 finance-fade-in">
          <h2 className="text-3xl mb-2 finance-heading">Sign In</h2>
          <p className="finance-subheading">Continue your chequemate journey</p>
        </div>

        <div className="finance-card finance-fade-in">
          <form onSubmit={handleSubmit} className="finance-stack">
            <div>
              <Label htmlFor="email" className="finance-body">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 finance-input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="finance-body">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 finance-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="finance-flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full finance-button-primary"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center finance-fade-in">
          <p className="finance-body">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
