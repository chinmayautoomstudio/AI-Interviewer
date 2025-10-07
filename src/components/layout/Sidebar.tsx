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
  TestTube
} from 'lucide-react';

interface SidebarProps {
  currentPath?: string;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  return (
    <aside className="w-64 bg-white border-r border-ai-teal/20 min-h-screen shadow-sm">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            const Icon = item.icon;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
                  ${isActive 
                    ? 'bg-ai-teal/10 text-ai-teal border-r-2 border-ai-teal shadow-sm' 
                    : 'text-gray-600 hover:bg-ai-cream hover:text-ai-teal'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-ai-teal' : 'text-gray-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
