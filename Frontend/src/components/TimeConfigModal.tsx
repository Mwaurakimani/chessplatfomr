import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Timer, CalendarDays, Settings } from 'lucide-react';

interface TimeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (timeConfig: TimeConfig) => void;
  playerName: string;
  platform: 'chess.com' | 'lichess.org';
}

export interface TimeConfig {
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Daily' | 'Custom';
  timeMinutes: number;
  incrementSeconds: number;
  displayName: string;
}

const TimeConfigModal: React.FC<TimeConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  playerName,
  platform,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Blitz');
  const [selectedTimeControl, setSelectedTimeControl] = useState<string>('');
  const [customTime, setCustomTime] = useState<number>(10);
  const [customIncrement, setCustomIncrement] = useState<number>(0);

  // Define time control options for each category
  const timeControls = {
    Bullet: [
      { value: '1+0', display: '1 minute', time: 1, increment: 0 },
      { value: '1+1', display: '1+1', time: 1, increment: 1 },
      { value: '2+1', display: '2+1', time: 2, increment: 1 },
    ],
    Blitz: [
      { value: '3+0', display: '3 minutes', time: 3, increment: 0 },
      { value: '3+2', display: '3+2', time: 3, increment: 2 },
      { value: '5+0', display: '5 minutes', time: 5, increment: 0 },
      { value: '5+3', display: '5+3', time: 5, increment: 3 },
    ],
    Rapid: [
      { value: '10+0', display: '10 minutes', time: 10, increment: 0 },
      { value: '10+5', display: '10+5', time: 10, increment: 5 },
      { value: '15+10', display: '15+10', time: 15, increment: 10 },
      { value: '30+0', display: '30 minutes', time: 30, increment: 0 },
    ],
    Daily: [
      { value: '1d', display: '1 day per move', time: 1440, increment: 0 },
      { value: '3d', display: '3 days per move', time: 4320, increment: 0 },
      { value: '7d', display: '1 week per move', time: 10080, increment: 0 },
    ],
  };

  // Set default time control when category changes
  useEffect(() => {
    if (selectedCategory !== 'Custom' && timeControls[selectedCategory as keyof typeof timeControls]) {
      const defaultControl = timeControls[selectedCategory as keyof typeof timeControls][0];
      setSelectedTimeControl(defaultControl.value);
    }
  }, [selectedCategory]);

  // Set initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('Blitz');
      setSelectedTimeControl('5+3');
      setCustomTime(10);
      setCustomIncrement(0);
    }
  }, [isOpen]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bullet': return <Zap size={16} className="text-orange-500" />;
      case 'Blitz': return <Timer size={16} className="text-blue-500" />;
      case 'Rapid': return <Clock size={16} className="text-green-500" />;
      case 'Daily': return <CalendarDays size={16} className="text-purple-500" />;
      case 'Custom': return <Settings size={16} className="text-gray-500" />;
      default: return <Clock size={16} />;
    }
  };

  const getCurrentTimeControl = (): TimeConfig => {
    if (selectedCategory === 'Custom') {
      return {
        category: 'Custom',
        timeMinutes: customTime,
        incrementSeconds: customIncrement,
        displayName: `${customTime}+${customIncrement}`,
      };
    } else {
      const categoryControls = timeControls[selectedCategory as keyof typeof timeControls];
      const selectedControl = categoryControls.find(c => c.value === selectedTimeControl);
      if (selectedControl) {
        return {
          category: selectedCategory as TimeConfig['category'],
          timeMinutes: selectedControl.time,
          incrementSeconds: selectedControl.increment,
          displayName: selectedControl.display,
        };
      }
    }

    // Fallback
    return {
      category: 'Blitz',
      timeMinutes: 5,
      incrementSeconds: 3,
      displayName: '5+3',
    };
  };

  const handleConfirm = () => {
    const timeConfig = getCurrentTimeControl();
    onConfirm(timeConfig);
  };

  const currentTimeControl = getCurrentTimeControl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Challenge {playerName}
          </DialogTitle>
          <DialogDescription>
            Choose your preferred time control for this match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Category Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(selectedCategory)}
                    <span>{selectedCategory}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bullet">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-orange-500" />
                    <span>Bullet</span>
                  </div>
                </SelectItem>
                <SelectItem value="Blitz">
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-blue-500" />
                    <span>Blitz</span>
                  </div>
                </SelectItem>
                <SelectItem value="Rapid">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-green-500" />
                    <span>Rapid</span>
                  </div>
                </SelectItem>
                <SelectItem value="Daily">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-purple-500" />
                    <span>Daily</span>
                  </div>
                </SelectItem>
                <SelectItem value="Custom">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-gray-500" />
                    <span>Custom</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Control Selector */}
          {selectedCategory !== 'Custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Control</label>
              <Select value={selectedTimeControl} onValueChange={setSelectedTimeControl}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time control" />
                </SelectTrigger>
                <SelectContent>
                  {timeControls[selectedCategory as keyof typeof timeControls]?.map((control) => (
                    <SelectItem key={control.value} value={control.value}>
                      {control.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Time Controls */}
          {selectedCategory === 'Custom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time (minutes)</label>
                  <Select value={customTime.toString()} onValueChange={(value) => setCustomTime(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map((time) => (
                        <SelectItem key={time} value={time.toString()}>
                          {time} min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Increment (seconds)</label>
                  <Select value={customIncrement.toString()} onValueChange={(value) => setCustomIncrement(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 5, 10, 15, 20, 30].map((inc) => (
                        <SelectItem key={inc} value={inc.toString()}>
                          {inc} sec
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(currentTimeControl.category)}
                <span className="font-medium">{currentTimeControl.category}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{currentTimeControl.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {currentTimeControl.timeMinutes < 60 
                    ? `${currentTimeControl.timeMinutes}m` 
                    : `${Math.floor(currentTimeControl.timeMinutes / 60)}h ${currentTimeControl.timeMinutes % 60}m`
                  } + {currentTimeControl.incrementSeconds}s
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Platform: <span className="font-medium">{platform === 'chess.com' ? 'Chess.com' : 'Lichess.org'}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="border-muted-foreground/20 hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 text-white border-0"
          >
            Send Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeConfigModal;
