
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
        <DialogFooter>
          <Button onClick={declineChallenge} variant="destructive">Decline</Button>
          <Button onClick={acceptChallenge}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeModal;
