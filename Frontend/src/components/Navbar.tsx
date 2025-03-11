import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, Home, LogOut, Map, LayoutDashboard, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
if (user) {
  try {
    const userData = JSON.parse(user);
    setIsAuthenticated(true);
    setUserName(userData.name || '');
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('user'); // Remove invalid data to prevent future errors
  }
}


  }, []);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      setShowProfileMenu(!showProfileMenu);
    } else {
      navigate('/auth');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserName('');
    setShowProfileMenu(false);
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/flood-map', icon: <Map size={20} />, label: 'Flood Map' },
    { path: '/alerts', icon: <AlertTriangle size={20} />, label: 'Alerts' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-md border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-2">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive(link.path)
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                {link.icon}
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side - Auth Button */}
          <div className="relative">
            <button
              onClick={handleAuthClick}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isAuthenticated
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <User size={20} />
              <span>{isAuthenticated ? userName : 'Sign up'}</span>
            </button>

            {/* Profile Dropdown */}
            {isAuthenticated && showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800 shadow-lg py-1 border border-blue-500/20">
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition-colors flex items-center space-x-2"
                >
                  <SettingsIcon size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
        } overflow-hidden bg-slate-800`}>
          <div className="px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive(link.path)
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                {link.icon}
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
