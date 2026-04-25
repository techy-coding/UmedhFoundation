import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'public' | 'donor' | 'volunteer' | 'staff' | 'admin' | 'beneficiary';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userEmail: string;
  isAuthenticated: boolean;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('userRole');
    return (savedRole as UserRole) || 'public';
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');

  useEffect(() => {
    const syncFromStorage = () => {
      setRole((localStorage.getItem('userRole') as UserRole) || 'public');
      setUserName(localStorage.getItem('userName') || '');
      setUserEmail(localStorage.getItem('userEmail') || '');
    };

    window.addEventListener('storage', syncFromStorage);
    syncFromStorage();

    return () => window.removeEventListener('storage', syncFromStorage);
  }, [role]);

  useEffect(() => {
    if (role === 'public') {
      localStorage.removeItem('userRole');
      return;
    }

    localStorage.setItem('userRole', role);
  }, [role]);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPicture');
    setRole('public');
    setUserName('');
    setUserEmail('');
  };

  return (
    <RoleContext.Provider value={{ role, setRole, userName, userEmail, isAuthenticated: Boolean(userEmail && role !== 'public'), logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within RoleProvider');
  return context;
}

// Role-based menu configuration
export const roleMenus: Record<UserRole, Array<{ icon: string; label: string; path: string }>> = {
  public: [],
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
    { icon: 'Settings', label: 'settings', path: '/dashboard/admin-settings' },
  ],
  beneficiary: [
    { icon: 'Home', label: 'dashboard', path: '/dashboard' },
    { icon: 'HandHeart', label: 'my support', path: '/dashboard/my-support' },
    { icon: 'MessageCircle', label: 'requests', path: '/dashboard/my-requests' },
    { icon: 'Bell', label: 'announcements', path: '/dashboard/announcements' },
  ],
};

// Role permissions
export const rolePermissions = {
  donor: {
    canCreate: ['donations', 'sponsorships', 'wishlist-items'],
    canRead: ['reports', 'campaigns', 'impact', 'profile'],
    canUpdate: ['profile', 'payment-methods'],
    canDelete: ['recurring-donations'],
  },
  volunteer: {
    canCreate: ['event-registrations'],
    canRead: ['tasks', 'events', 'profile'],
    canUpdate: ['task-status', 'profile'],
    canDelete: ['event-registrations'],
  },
  staff: {
    canCreate: ['needs', 'beneficiaries', 'reports', 'events', 'wishlist-items'],
    canRead: ['all-data'],
    canUpdate: ['needs', 'beneficiaries', 'reports', 'wishlist-items'],
    canDelete: ['needs-limited'],
  },
  admin: {
    canCreate: ['users', 'campaigns', 'all', 'wishlist-items'],
    canRead: ['everything'],
    canUpdate: ['everything'],
    canDelete: ['users', 'campaigns', 'most-items', 'wishlist-items'],
  },
  beneficiary: {
    canCreate: ['support-requests'],
    canRead: ['support-info', 'announcements'],
    canUpdate: ['profile'],
    canDelete: ['own-requests'],
  },
  public: {
    canCreate: ['account', 'donations'],
    canRead: ['public-content'],
    canUpdate: [],
    canDelete: [],
  },
};
