import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Users, Megaphone, Shield, ChevronLeft, ChevronRight, TrendingUp, Baby, Gift, FileText, Calendar, Star, PieChart, UserCog, CheckSquare, Award, MessageCircle, Bell, HandHeart, Briefcase, Settings as SettingsIcon, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';
import { motion } from 'motion/react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const iconMap: Record<string, any> = {
  Home, Heart, Users, Megaphone, Shield, TrendingUp, Baby, Gift, FileText, Calendar,
  Star, PieChart, UserCog, CheckSquare, Award, MessageCircle, Bell, HandHeart,
  Briefcase, Settings: SettingsIcon, CheckCircle,
};

// Role-based menu configurations
const roleMenus: Record<string, Array<{ icon: string; label: string; path: string }>> = {
  donor: [
    { icon: 'Home', label: 'dashboard', path: '/dashboard' },
    { icon: 'Heart', label: 'donate', path: '/dashboard/donate' },
    { icon: 'Baby', label: 'sponsorship', path: '/dashboard/sponsorship' },
    { icon: 'Gift', label: 'wishlist', path: '/dashboard/wishlist' },
    { icon: 'FileText', label: 'reports', path: '/dashboard/reports' },
    { icon: 'TrendingUp', label: 'impact', path: '/dashboard/impact' },
  ],
  volunteer: [
    { icon: 'Home', label: 'dashboard', path: '/dashboard' },
    { icon: 'Calendar', label: 'events', path: '/dashboard/events' },
    { icon: 'Award', label: 'achievements', path: '/dashboard/achievements' },
  ],
  staff: [
    { icon: 'Home', label: 'dashboard', path: '/dashboard' },
    { icon: 'Gift', label: 'needs', path: '/dashboard/wishlist' },
    { icon: 'Settings', label: 'manage needs', path: '/dashboard/wishlist-manage' },
    { icon: 'Calendar', label: 'events', path: '/dashboard/events' },
    { icon: 'CheckSquare', label: 'tasks', path: '/dashboard/tasks' },
    { icon: 'FileText', label: 'reports', path: '/dashboard/reports' },
    { icon: 'UserCog', label: 'beneficiaries', path: '/dashboard/beneficiaries' },
  ],
  admin: [
    { icon: 'Home', label: 'dashboard', path: '/dashboard' },
    { icon: 'Users', label: 'users', path: '/dashboard/admin' },
    { icon: 'Megaphone', label: 'campaigns', path: '/dashboard/campaigns' },
    { icon: 'CheckCircle', label: 'approvals', path: '/dashboard/approvals' },
    { icon: 'Gift', label: 'wishlist', path: '/dashboard/wishlist' },
    { icon: 'Settings', label: 'manage needs', path: '/dashboard/wishlist-manage' },
    { icon: 'TrendingUp', label: 'impact', path: '/dashboard/impact' },
    { icon: 'UserCog', label: 'beneficiaries', path: '/dashboard/beneficiaries' },
    { icon: 'PieChart', label: 'transparency', path: '/dashboard/transparency' },
    { icon: 'Star', label: 'success stories', path: '/dashboard/stories' },
  ],
  beneficiary: [
    { icon: 'Home', label: 'dashboard', path: '/dashboard' },
    { icon: 'HandHeart', label: 'my support', path: '/dashboard/my-support' },
    { icon: 'MessageCircle', label: 'requests', path: '/dashboard/my-requests' },
    { icon: 'Bell', label: 'announcements', path: '/dashboard/announcements' },
  ],
  public: [
    { icon: 'Home', label: 'home', path: '/' },
  ],
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const { role } = useRole();

  const menuItems = roleMenus[role] || roleMenus.donor;
  const openSupport = () => {
    window.dispatchEvent(
      new CustomEvent('umedh-open-support', {
        detail: { prompt: 'Contact support' },
      })
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-sidebar border-r border-sidebar-border flex flex-col relative h-full"
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-semibold text-lg text-sidebar-foreground">Umedh</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <nav className="flex-1 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = iconMap[item.icon];

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-3 px-4 py-3 my-1 rounded-xl cursor-pointer transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg shadow-primary/30'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium capitalize text-sm"
                  >
                    {t(item.label)}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-sidebar-foreground mb-2">Need Help?</p>
            <p className="text-xs text-muted-foreground mb-3">Contact our support team</p>
            <button
              onClick={openSupport}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Get Support
            </button>
          </div>
        ) : (
          <button
            onClick={openSupport}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10"
          >
            <span className="text-xl">?</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
