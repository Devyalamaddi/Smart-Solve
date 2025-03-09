import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-semibold text-gray-900">Smart Solve</span>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;