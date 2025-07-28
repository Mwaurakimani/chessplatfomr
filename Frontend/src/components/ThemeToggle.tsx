import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-12 h-6 bg-muted rounded-full border border-border transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Toggle slider */}
      <div
        className={`absolute w-5 h-5 bg-primary rounded-full shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {theme === 'dark' ? (
          <Moon size={12} className="text-primary-foreground" />
        ) : (
          <Sun size={12} className="text-primary-foreground" />
        )}
      </div>
      
      {/* Background icons */}
      <div className="flex items-center justify-between w-full px-1 pointer-events-none">
        <Sun 
          size={14} 
          className={`transition-opacity duration-300 ${
            theme === 'light' ? 'opacity-0' : 'opacity-40'
          } text-muted-foreground`} 
        />
        <Moon 
          size={14} 
          className={`transition-opacity duration-300 ${
            theme === 'dark' ? 'opacity-0' : 'opacity-40'
          } text-muted-foreground`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
