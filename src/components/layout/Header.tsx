import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Settings } from 'lucide-react';
import Button from '../ui/Button';

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
  return (
    <header className="bg-white border-b border-ai-teal/20 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-ai-teal rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-xl font-semibold text-ai-teal">
              AI Interviewer
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium">
            Dashboard
          </button>
          <button onClick={() => navigate('/interviews')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium">
            Interviews
          </button>
          <button onClick={() => navigate('/candidates')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium">
            Candidates
          </button>
          <button onClick={() => navigate('/reports')} className="text-gray-600 hover:text-ai-teal transition-colors font-medium">
            Reports
          </button>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-ai-orange transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-ai-orange transition-colors">
            <Settings className="h-5 w-5" />
          </button>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-ai-teal">{user.role}</p>
              </div>
              <div className="w-8 h-8 bg-ai-teal/10 rounded-full flex items-center justify-center border border-ai-teal/20">
                <User className="h-4 w-4 text-ai-teal" />
              </div>
              {onLogout && (
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
