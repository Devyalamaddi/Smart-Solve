import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, HelpCircle, MessageSquare, User } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: HelpCircle, label: 'Questions', path: '/questions' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(path)
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;