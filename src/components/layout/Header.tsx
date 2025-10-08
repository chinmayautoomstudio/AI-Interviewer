import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Settings, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { useLayout } from '../../contexts/LayoutContext';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar, isMobile } = useLayout();
  
  return (
    <header className="bg-white border-b border-ai-teal/20 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and Logo */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-600 hover:text-ai-teal transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-ai-teal rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs sm:text-sm">AI</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-ai-teal">
              AI Interviewer
            </h1>
          </div>
        </div>

        {/* Navigation - Hidden on mobile, shown on desktop */}
        <nav className="hidden xl:flex items-center space-x-6 lg:space-x-8">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium text-sm lg:text-base">
            Dashboard
          </button>
          <button onClick={() => navigate('/interviews')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium text-sm lg:text-base">
            Interviews
          </button>
          <button onClick={() => navigate('/candidates')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium text-sm lg:text-base">
            Candidates
          </button>
          <button onClick={() => navigate('/reports')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium text-sm lg:text-base">
            Reports
          </button>
          <button onClick={() => navigate('/help')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium text-sm lg:text-base">
            Help
          </button>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications - Hidden on small mobile */}
          <button className="hidden sm:block p-2 text-gray-400 hover:text-ai-orange transition-colors">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Settings - Hidden on small mobile */}
          <button className="hidden sm:block p-2 text-gray-400 hover:text-ai-orange transition-colors">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* User info - Hidden on small mobile */}
              <div className="hidden sm:block text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-none">{user.name}</p>
                <p className="text-xs text-ai-teal">{user.role}</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-ai-teal/10 rounded-full flex items-center justify-center border border-ai-teal/20">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-ai-teal" />
              </div>
              {onLogout && (
                <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
              <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
