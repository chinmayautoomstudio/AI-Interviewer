import React, { useState } from 'react';
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
  X,
  BookOpen,
  ClipboardList,
  Brain,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Link
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Open Role - JD', href: '/job-descriptions', icon: FileText },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'Interviewer', href: '/interviews', icon: Calendar },
    { name: 'Exams', href: '/exams', icon: BookOpen, submenu: [
      { name: 'Exam Dashboard', href: '/exams/dashboard', icon: LayoutDashboard },
      { name: 'Question Bank', href: '/exams/questions', icon: Brain },
      { name: 'Question Assignment', href: '/exams/assignments', icon: Link },
      { name: 'Topic Management', href: '/exams/topics', icon: ClipboardList },
      { name: 'Exam Sessions', href: '/exams/sessions', icon: Calendar },
      { name: 'Exam Results', href: '/exams/results', icon: TrendingUp },
      { name: 'Exam Analytics', href: '/exams/analytics', icon: BarChart3 }
    ]},
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

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isSubmenuExpanded = (menuName: string) => {
    return expandedMenus.includes(menuName);
  };

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(item => currentPath === item.href);
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
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isSubmenuItemActive = hasSubmenu ? isSubmenuActive(item.submenu) : false;
              const isExpanded = hasSubmenu ? isSubmenuExpanded(item.name) : false;
              const Icon = item.icon;
              
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        toggleSubmenu(item.name);
                      } else {
                        handleNavigation(item.href);
                      }
                    }}
                    className={`
                      flex items-center justify-between px-3 py-2 sm:py-3 rounded-lg text-sm font-medium transition-colors w-full text-left
                      ${(isActive || isSubmenuItemActive)
                        ? 'bg-ai-teal/10 text-ai-teal border-r-2 border-ai-teal shadow-sm' 
                        : 'text-gray-600 hover:bg-ai-cream hover:text-ai-teal'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${(isActive || isSubmenuItemActive) ? 'text-ai-teal' : 'text-gray-500'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {hasSubmenu && (
                      isExpanded ? 
                        <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {hasSubmenu && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const isSubActive = currentPath === subItem.href;
                        const SubIcon = subItem.icon;
                        
                        return (
                          <button
                            key={subItem.name}
                            onClick={() => handleNavigation(subItem.href)}
                            className={`
                              flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
                              ${isSubActive 
                                ? 'bg-ai-teal/10 text-ai-teal border-r-2 border-ai-teal shadow-sm' 
                                : 'text-gray-600 hover:bg-ai-cream hover:text-ai-teal'
                              }
                            `}
                          >
                            <SubIcon className={`h-4 w-4 flex-shrink-0 ${isSubActive ? 'text-ai-teal' : 'text-gray-500'}`} />
                            <span className="truncate">{subItem.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
