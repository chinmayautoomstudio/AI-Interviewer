import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  Settings,
  Bot,
  TestTube,
  X
} from 'lucide-react';
import { useLayout } from '../../contexts/LayoutContext';

interface SidebarProps {
  currentPath?: string;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, isMobile } = useLayout();
  const currentPath = location.pathname;
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Open Role - JD', href: '/job-descriptions', icon: FileText },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'Interviewer', href: '/interviews', icon: Calendar },
    { name: 'AI Agents', href: '/ai-agents', icon: Bot },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Test', href: '/admin-interview-test', icon: TestTube },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-64 bg-white border-r border-ai-teal/20 min-h-screen shadow-sm
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-ai-teal/20">
          <h2 className="text-lg font-semibold text-ai-teal">Menu</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-600 hover:text-ai-teal transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          <nav className="space-y-1 sm:space-y-2">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 sm:py-3 rounded-lg text-sm font-medium transition-colors w-full text-left
                    ${isActive 
                      ? 'bg-ai-teal/10 text-ai-teal border-r-2 border-ai-teal shadow-sm' 
                      : 'text-gray-600 hover:bg-ai-cream hover:text-ai-teal'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-ai-teal' : 'text-gray-500'}`} />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
