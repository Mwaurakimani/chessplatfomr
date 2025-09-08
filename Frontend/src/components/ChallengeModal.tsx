
import React from 'react';
import { useChallenge } from './contexts/ChallengeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Timer, CalendarDays, Settings } from 'lucide-react';

const ChallengeModal: React.FC = () => {
  const { incomingChallenge, acceptChallenge, declineChallenge, setIncomingChallenge } = useChallenge();

  if (!incomingChallenge) {
    return null;
  }

  const getCategoryIcon = (timeControl: string) => {
    if (!timeControl) return <Clock size={16} />;
    
    const [minutes] = timeControl.split('+').map(Number);
    
    if (minutes <= 3) return <Zap size={16} className="text-orange-500" />;
    if (minutes <= 10) return <Timer size={16} className="text-blue-500" />;
    if (minutes <= 30) return <Clock size={16} className="text-green-500" />;
    if (minutes >= 1440) return <CalendarDays size={16} className="text-purple-500" />;
    return <Clock size={16} className="text-gray-500" />;
  };

  const getTimeControlDisplay = () => {
    if (incomingChallenge.timeConfig) {
      return incomingChallenge.timeConfig.displayName;
    }
    return incomingChallenge.time_control || '10+0';
  };

  const getPlatformDisplay = () => {
    return incomingChallenge.platform === 'chess.com' ? 'Chess.com' : 'Lichess.org';
  };

  return (
    <Dialog open={!!incomingChallenge} onOpenChange={() => setIncomingChallenge(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You have been challenged!</DialogTitle>
          <DialogDescription>
            {incomingChallenge.from.name} has challenged you to a match.
          </DialogDescription>
        </DialogHeader>
        
        {/* Challenge Details */}
        <div className="bg-muted/50 rounded-lg p-3 border my-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(incomingChallenge.time_control)}
              <span className="font-medium">Time Control</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{getTimeControlDisplay()}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Platform: <span className="font-medium">{getPlatformDisplay()}</span>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            onClick={declineChallenge} 
            variant="destructive"
            className="finance-button-secondary border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
          >
            Decline
          </Button>
          <Button 
            onClick={acceptChallenge}
            className="finance-button-primary bg-green-600 hover:bg-green-700 text-white border-0"
          >
            Accept Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeModal;
