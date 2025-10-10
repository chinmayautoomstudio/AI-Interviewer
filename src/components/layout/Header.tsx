import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  Shield, 
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  Play
} from 'lucide-react';
import Button from '../ui/Button';
import { useLayout } from '../../contexts/LayoutContext';
import { useNotifications } from '../../contexts/NotificationContext';

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
  const { sidebarOpen, toggleSidebar } = useLayout();
  const { notifications, unreadCount, markAsRead, isConnected } = useNotifications();
  
  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Refs for dropdowns
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_started':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'interview_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'interview_failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'interview_started':
        return 'Interview Started';
      case 'interview_completed':
        return 'Interview Completed';
      case 'interview_failed':
        return 'Interview Failed';
      default:
        return 'Notification';
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'interview_started':
        return `${notification.candidateName} has started their interview for ${notification.jobTitle}`;
      case 'interview_completed':
        const score = notification.metadata?.score ? ` (Score: ${notification.metadata.score}/10)` : '';
        return `${notification.candidateName} has completed their interview for ${notification.jobTitle}${score}`;
      case 'interview_failed':
        return `${notification.candidateName}'s interview for ${notification.jobTitle} has failed`;
      default:
        return 'New notification received';
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const handleSettingsClick = (action: string) => {
    setSettingsOpen(false);
    switch (action) {
      case 'profile':
        navigate('/settings');
        break;
      case 'security':
        navigate('/settings/two-factor');
        break;
      case 'help':
        navigate('/help');
        break;
      case 'privacy':
        navigate('/privacy-policy');
        break;
      case 'terms':
        navigate('/terms-and-conditions');
        break;
      case 'disclaimer':
        navigate('/disclaimer');
        break;
      case 'logout':
        onLogout?.();
        break;
    }
  };

  const handleProfileClick = (action: string) => {
    setProfileOpen(false);
    switch (action) {
      case 'edit':
        navigate('/settings');
        break;
      case 'view':
        // Could navigate to a profile view page
        break;
    }
  };

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
              AI HR Saathi
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
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-400 hover:text-ai-orange transition-colors"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isConnected ? 'Real-time notifications are active' : 'Connecting to notifications...'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {getNotificationTitle(notification.type)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {getNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatNotificationTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-sm text-ai-teal hover:text-ai-orange font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2 text-gray-400 hover:text-ai-orange transition-colors"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Settings Dropdown */}
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <button
                    onClick={() => handleSettingsClick('profile')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => handleSettingsClick('security')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Security & 2FA</span>
                  </button>
                  <button
                    onClick={() => handleSettingsClick('help')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => handleSettingsClick('privacy')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Privacy Policy</span>
                  </button>
                  <button
                    onClick={() => handleSettingsClick('terms')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Terms & Conditions</span>
                  </button>
                  <button
                    onClick={() => handleSettingsClick('disclaimer')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Disclaimer</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => handleSettingsClick('logout')}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 sm:space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                {/* User info - Hidden on small mobile */}
                <div className="hidden sm:block text-right">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-none">{user.name}</p>
                  <p className="text-xs text-ai-teal">{user.role}</p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-ai-teal/10 rounded-full flex items-center justify-center border border-ai-teal/20">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-ai-teal" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-ai-teal/10 rounded-full flex items-center justify-center border border-ai-teal/20 flex-shrink-0">
                        <User className="h-5 w-5 text-ai-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate" title={user.email}>{user.email}</p>
                        <p className="text-xs text-ai-teal capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => handleProfileClick('view')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
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