import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onOpenProfile: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onOpenProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-sm font-medium text-white">Dashboard</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-600">
              <div className="text-sm font-medium text-white">
                {profile?.name || 'User'}
              </div>
              <div className="text-xs text-gray-400">
                {user.email}
              </div>
            </div>
            <div className="py-1">
              {profile && profile.role === 'admin' && (
                <a
                  href="/#/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Command Center
                </a>
              )}
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Profile Settings
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;