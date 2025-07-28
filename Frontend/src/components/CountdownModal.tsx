import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { AlertCircle, ExternalLink, Clock, Settings } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { getTimeClass } from '@/lib/timeUtils';

interface CountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    id: string;
    challenger: {
      username: string;
      preferred_platform: string;
    };
    opponent: {
      username: string;
      preferred_platform: string;
    };
    platform: string;
    time_control: string;
    rules: string;
  };
  onGoNow: () => void;
  onPostpone: () => void;
  isChallenger: boolean;
}

export const CountdownModal: React.FC<CountdownModalProps> = ({
  isOpen,
  onClose,
  challenge,
  onGoNow,
  onPostpone,
  isChallenger
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15);
  const [isCompatible, setIsCompatible] = useState(true);
  const [compatibilityMessage, setCompatibilityMessage] = useState('');
  const [needsPlatformSetup, setNeedsPlatformSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCountdown(15);
      checkPlatformCompatibility();
    }
  }, [isOpen, challenge]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleAutoStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const checkPlatformCompatibility = () => {
    const challengerPlatform = challenge.challenger.preferred_platform;
    const opponentPlatform = challenge.opponent.preferred_platform;
    
    // Check if either user hasn't set their preferred platform
    if (!challengerPlatform || !opponentPlatform) {
      setIsCompatible(false);
      setNeedsPlatformSetup(true);
      const missingUsers = [];
      if (!challengerPlatform) missingUsers.push(challenge.challenger.username);
      if (!opponentPlatform) missingUsers.push(challenge.opponent.username);
      
      setCompatibilityMessage(
        `${missingUsers.join(' and ')} ${missingUsers.length === 1 ? 'has' : 'have'} not set a preferred platform. Please set your preferred platform in your profile to continue.`
      );
      return;
    }
    
    setNeedsPlatformSetup(false);
    
    if (challengerPlatform === opponentPlatform) {
      setIsCompatible(true);
      setCompatibilityMessage('');
    } else {
      setIsCompatible(false);
      setCompatibilityMessage(
        `Platform mismatch: ${challenge.challenger.username} prefers ${challengerPlatform}, 
         but ${challenge.opponent.username} prefers ${opponentPlatform}. 
         The game will be played on ${challenge.platform}.`
      );
    }
  };

  const handleAutoStart = () => {
    if (isCompatible) {
      onGoNow();
    } else {
      onPostpone();
    }
  };

  const handleGoNow = () => {
    if (isCompatible) {
      onGoNow();
    }
  };

  const handleGoToProfile = () => {
    onClose();
    navigate('/profile');
  };

  const getRedirectUrl = () => {
    const platform = challenge.platform;
    const opponent = isChallenger ? challenge.opponent.username : challenge.challenger.username;
    
    if (platform === 'chess.com') {
      // Use the proper chess.com challenge URL that pre-loads the opponent
      return `https://www.chess.com/play/online/new?opponent=${opponent.toLowerCase()}`;
    } else if (platform === 'lichess.org') {
      // For lichess, use the direct challenge URL with opponent pre-loaded
      return `https://lichess.org/?user=${opponent.toLowerCase()}#friend`;
    }
    // Fallback to platform homepage with correct format
    const correctedPlatform = platform.replace('.com', '');
    return `https://www.${correctedPlatform}.com`;
  };

  const progressPercentage = ((15 - countdown) / 15) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isChallenger ? 'Challenge Accepted!' : 'Get Ready to Play!'}
          </DialogTitle>
          <DialogDescription>
            {isChallenger 
              ? `${challenge.opponent.username} accepted your challenge! Both players will be redirected to ${challenge.platform} automatically.`
              : `Get ready to play your chess match on ${challenge.platform}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Compatibility Check */}
          {!isCompatible && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {compatibilityMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Match Details */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Opponent:</span>
              <span>{isChallenger ? challenge.opponent.username : challenge.challenger.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Platform:</span>
              <span className="capitalize">{challenge.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Time Control:</span>
              <span>{challenge.time_control}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Rules:</span>
              <span className="capitalize">{challenge.rules}</span>
            </div>
          </div>

          {/* Countdown Display */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-primary">
              {countdown}
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {isCompatible 
                ? (isChallenger 
                    ? `Your opponent is ready! Redirecting to ${challenge.platform} in ${countdown} seconds...`
                    : `Redirecting to ${challenge.platform} in ${countdown} seconds...`
                  )
                : 'Challenge will be cancelled due to platform incompatibility'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {needsPlatformSetup ? (
              <>
                <Button
                  onClick={handleGoToProfile}
                  className="flex-1"
                  variant="default"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Set Platform
                </Button>
                <Button
                  onClick={onPostpone}
                  variant="outline"
                  className="flex-1"
                >
                  Postpone
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleGoNow}
                  disabled={!isCompatible}
                  className="flex-1"
                  variant="default"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isChallenger ? 'Join Game Now!' : 'Go Now'}
                </Button>
                <Button
                  onClick={onPostpone}
                  variant="outline"
                  className="flex-1"
                >
                  Postpone
                </Button>
              </>
            )}
          </div>

          {/* Platform Info */}
          {isCompatible && (
            <div className="text-xs text-muted-foreground text-center">
              You'll be redirected to {challenge.platform} to play your match
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
