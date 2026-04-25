import { Search, Bell, Sun, Moon, Globe, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { auth } from '../../lib/firebase';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { subscribeToNotifications, type NotificationRecord } from '../../services/notifications';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { role, userName, userEmail, logout } = useRole();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatar] = useState<string | null>(localStorage.getItem('userPicture'));
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    return subscribeToNotifications(
      setNotifications,
      role,
      userEmail,
      (error) => console.error('Failed to subscribe to notifications:', error)
    );
  }, [role, userEmail]);

  const recentNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  const formatRelativeTime = (dateString: string) => {
    const timestamp = new Date(dateString).getTime();
    const now = Date.now();
    const diffMinutes = Math.max(Math.floor((now - timestamp) / 60000), 0);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Failed to sign out from Firebase:', error);
      }
    }

    logout();
    navigate('/login');
  };

  const roleColors: Record<string, string> = {
    donor: 'from-[#FF6B35] to-[#FF8B35]',
    volunteer: 'from-[#6C5CE7] to-[#8C7CE7]',
    staff: 'from-[#FFD93D] to-[#FFE93D]',
    admin: 'from-[#4ECDC4] to-[#6EDDC4]',
    beneficiary: 'from-[#FF8B94] to-[#FFA894]',
    public: 'from-[#A0AEC0] to-[#CBD5E0]',
  };

  return (
    <nav className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns, donors, volunteers..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </motion.button>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Globe className="w-5 h-5" />
          </motion.button>
          {showLangMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-12 bg-card border border-border rounded-xl shadow-lg p-2 w-32 z-50"
            >
              {(['en', 'hi', 'mr'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors ${
                    language === lang ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {recentNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                {Math.min(recentNotifications.length, 9)}
              </span>
            )}
          </motion.button>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-12 bg-card border border-border rounded-xl shadow-lg w-80 z-50"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-auto">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
                ) : (
                  recentNotifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-border hover:bg-muted/50">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatRelativeTime(notif.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="h-8 w-px bg-border"></div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-muted/50 rounded-xl p-2 transition-colors"
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center text-white font-semibold">
                {userName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{userName}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full bg-gradient-to-r ${roleColors[role]} text-white`}>
                  {role}
                </span>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.button>

          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-14 bg-card border border-border rounded-xl shadow-lg w-56 z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    navigate('/dashboard/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/dashboard/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
}
