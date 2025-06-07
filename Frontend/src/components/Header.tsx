
import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeaderMenu from './HeaderMenu';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
}

const Header = ({ title, showBack = false, showMenu = false }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#212121]">
      <div className="flex items-center">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>
      
      {showMenu && (
        <HeaderMenu>
          <button className="p-1 hover:bg-gray-800 rounded transition-colors">
            <MoreVertical size={20} className="text-white" />
          </button>
        </HeaderMenu>
      )}
    </header>
  );
};

export default Header;
