import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface MatchResultReporterProps {
  challengeId: number;
  opponentName: string;
  platform: string;
  userId: number;
  onResultReported?: () => void;
}

export const MatchResultReporter: React.FC<MatchResultReporterProps> = ({
  challengeId,
  opponentName,
  platform,
  userId,
  onResultReported
}) => {
  const [gameUrl, setGameUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportResult = async (result: 'win' | 'loss' | 'draw') => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/match-results/report-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          result,
          gameUrl: gameUrl.trim() || null,
          reporterId: userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Match Result Reported! 🎉",
          description: `Your ${result} against ${opponentName} has been recorded.${data.verified ? ' Game URL verified!' : ''}`,
        });
        
        if (onResultReported) {
          onResultReported();
        }
      } else {
        throw new Error(data.error || 'Failed to report result');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Failed to report match result',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Report Match Result</h3>
      <p className="text-muted-foreground mb-4">
        Played against <span className="font-medium">{opponentName}</span> on{' '}
        <span className="font-medium">{platform}</span>?
      </p>

      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => reportResult('win')}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            🏆 I Won!
          </button>
          <button
            onClick={() => reportResult('loss')}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
          >
            😔 I Lost
          </button>
          <button
            onClick={() => reportResult('draw')}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
          >
            🤝 Draw
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="gameUrl" className="text-sm font-medium">
            Game URL (optional - for verification)
          </label>
          <input
            id="gameUrl"
            type="url"
            placeholder="Paste your game URL here..."
            value={gameUrl}
            onChange={(e) => setGameUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Adding a game URL helps verify the result and may provide additional benefits.
          </p>
        </div>

        {isSubmitting && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>Reporting result...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchResultReporter;
