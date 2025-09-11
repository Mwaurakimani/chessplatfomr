
import React, { useState } from 'react';
import { useChallenge } from './contexts/ChallengeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Zap, Timer, CalendarDays, Settings, DollarSign, Phone } from 'lucide-react';

const ChallengeModal: React.FC = () => {
  const { incomingChallenge, acceptChallenge, declineChallenge, setIncomingChallenge } = useChallenge();
  const [opponentPhoneNumber, setOpponentPhoneNumber] = useState<string>('');
  const [showPaymentInput, setShowPaymentInput] = useState<boolean>(false);

  if (!incomingChallenge) {
    return null;
  }

  const hasPayment = incomingChallenge.paymentDetails && incomingChallenge.paymentDetails.amount > 0;

  const handleAcceptClick = () => {
    if (hasPayment && !showPaymentInput) {
      setShowPaymentInput(true);
    } else {
      // Handle accept challenge with payment details if needed
      if (hasPayment) {
        acceptChallenge(opponentPhoneNumber);
      } else {
        acceptChallenge();
      }
      setShowPaymentInput(false);
      setOpponentPhoneNumber('');
    }
  };

  const handleDeclineClick = () => {
    declineChallenge();
    setShowPaymentInput(false);
    setOpponentPhoneNumber('');
  };

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

        {/* Payment Details */}
        {hasPayment && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-yellow-600" />
              <span className="font-medium text-yellow-800">Payment Challenge</span>
            </div>
            <div className="text-sm text-yellow-700">
              <div>• Amount: <strong>KES {incomingChallenge.paymentDetails?.amount}</strong></div>
              <div>• Both players deposit before the game</div>
              <div>• Winner takes the full amount ({(incomingChallenge.paymentDetails?.amount || 0) * 2} KES)</div>
              <div>• Draw = both players get refunded</div>
            </div>
          </div>
        )}

        {/* Phone Number Input for Payment Challenges */}
        {hasPayment && showPaymentInput && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-blue-500" />
              <span className="font-medium text-sm">Your Payment Details</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number (for M-Pesa)</label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={opponentPhoneNumber}
                onChange={(e) => setOpponentPhoneNumber(e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                This number will be used to request your deposit of KES {incomingChallenge.paymentDetails?.amount}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button 
            onClick={handleDeclineClick} 
            variant="destructive"
            className="finance-button-secondary border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
          >
            Decline
          </Button>
          {showPaymentInput ? (
            <Button 
              onClick={handleAcceptClick}
              disabled={!opponentPhoneNumber.trim()}
              className="finance-button-primary bg-green-600 hover:bg-green-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Accept
            </Button>
          ) : (
            <Button 
              onClick={handleAcceptClick}
              className="finance-button-primary bg-green-600 hover:bg-green-700 text-white border-0"
            >
              {hasPayment ? 'Accept & Setup Payment' : 'Accept Challenge'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeModal;
