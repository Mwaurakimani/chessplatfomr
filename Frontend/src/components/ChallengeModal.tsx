
import React from 'react';
import { useChallenge } from './contexts/ChallengeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ChallengeModal: React.FC = () => {
  const { incomingChallenge, acceptChallenge, declineChallenge, setIncomingChallenge } = useChallenge();

  if (!incomingChallenge) {
    return null;
  }

  return (
    <Dialog open={!!incomingChallenge} onOpenChange={() => setIncomingChallenge(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You have been challenged!</DialogTitle>
          <DialogDescription>
            {incomingChallenge.from.name} has challenged you to a match.
          </DialogDescription>
        </DialogHeader>
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
