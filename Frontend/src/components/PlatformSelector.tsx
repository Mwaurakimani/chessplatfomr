
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlatformSelectorProps {
  chessComUsername?: string;
  lichessUsername?: string;
  currentPlatform: 'chess.com' | 'lichess.org';
  onPlatformChange: (platform: 'chess.com' | 'lichess.org') => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  chessComUsername,
  lichessUsername,
  currentPlatform,
  onPlatformChange
}) => {
  const availablePlatforms = [];
  
  if (chessComUsername) {
    availablePlatforms.push({ name: 'Chess.com', value: 'chess.com' as const, username: chessComUsername });
  }
  
  if (lichessUsername) {
    availablePlatforms.push({ name: 'Lichess.org', value: 'lichess.org' as const, username: lichessUsername });
  }

  // If only one platform is available, don't show the dropdown
  if (availablePlatforms.length <= 1) {
    return null;
  }

  const currentPlatformData = availablePlatforms.find(p => p.value === currentPlatform);

  return (
    <div className="flex items-center space-x-2">
      <div className="chess-card rounded-lg px-3 py-2 border border-border">
        <span className="text-sm text-muted-foreground">Playing on:</span>
        <span className="ml-2 font-semibold text-foreground">{currentPlatformData?.name}</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Plus size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#1a1a1a] border-gray-700 text-white">
          {availablePlatforms.map((platform) => (
            <DropdownMenuItem
              key={platform.value}
              onClick={() => onPlatformChange(platform.value)}
              className={`hover:bg-gray-700 cursor-pointer ${
                currentPlatform === platform.value ? 'bg-gray-600' : ''
              }`}
            >
              <div>
                <div className="font-medium">{platform.name}</div>
                <div className="text-sm text-gray-400">@{platform.username}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PlatformSelector;