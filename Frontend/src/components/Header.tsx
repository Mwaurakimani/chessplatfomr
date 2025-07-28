
import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from './HeaderMenu';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
}

const Header = ({ title, showBack = false, showMenu = false }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        {showMenu && (
          <HeaderMenu>
            <button className="p-2 hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105">
              <MoreVertical size={20} className="text-foreground" />
            </button>
          </HeaderMenu>
        )}
      </div>
    </header>
  );
};

export default Header;
