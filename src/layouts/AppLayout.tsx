import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Mail, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Brain, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '../lib/utils';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/newsletters', label: 'Newsletters', icon: <Mail size={20} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and mobile menu button */}
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden p-1 rounded-md text-slate-700 hover:bg-slate-100" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <NavLink to="/" className="flex items-center gap-2 text-xl font-semibold text-blue-800">
              <Brain size={28} className="text-blue-700" />
              <span>Nigest</span>
            </NavLink>
          </div>

          {/* User profile */}
          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                  <span className="text-blue-800 font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="font-medium text-slate-800 truncate max-w-[150px]">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </div>
              </div>
              <ChevronDown size={16} className="text-slate-500" />
            </button>

            {/* User dropdown menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              >
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-slate-800">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-slate-100"
                    role="menuitem"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-grow flex">
        {/* Sidebar for desktop */}
        <aside 
          className={cn(
            "fixed inset-0 z-20 transform transition-transform duration-300 ease-in-out bg-white md:relative md:translate-x-0 md:w-64 md:block md:shadow-sm", 
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col border-r">
            <div className="py-6 px-4 md:hidden flex items-center justify-between border-b">
              <div className="flex items-center gap-2 text-xl font-semibold text-blue-800">
                <Brain size={24} />
                <span>Nigest</span>
              </div>
              <button 
                onClick={toggleMobileMenu} 
                className="p-1 rounded-md text-slate-700 hover:bg-slate-100"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    )
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:pl-0 h-[calc(100vh-4rem)] overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          ></div>
        )}
      </div>
    </div>
  );
};

export default AppLayout;