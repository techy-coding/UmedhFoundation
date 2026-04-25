import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../dashboard/Sidebar';
import { Navbar } from '../dashboard/Navbar';
import { Chatbot } from '../common/Chatbot';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { RoleProvider } from '../../context/RoleContext';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

const allowedRoutesByRole: Record<string, string[]> = {
  donor: [
    '/dashboard',
    '/dashboard/donate',
    '/dashboard/sponsorship',
    '/dashboard/wishlist',
    '/dashboard/reports',
    '/dashboard/impact',
    '/dashboard/my-donations',
    '/dashboard/my-sponsorships',
    '/dashboard/profile',
  ],
  volunteer: ['/dashboard', '/dashboard/events', '/dashboard/achievements', '/dashboard/profile'],
  staff: [
    '/dashboard', 
    '/dashboard/campaigns', 
    '/dashboard/campaigns-manage', 
    '/dashboard/wishlist', 
    '/dashboard/wishlist-manage', 
    '/dashboard/events', 
    '/dashboard/events-manage', 
    '/dashboard/tasks',
    '/dashboard/beneficiaries', 
    '/dashboard/beneficiaries-old',
    '/dashboard/profile'
  ],
  admin: [
    '/dashboard',
    '/dashboard/admin',
    '/dashboard/campaigns',
    '/dashboard/campaigns-manage',
    '/dashboard/approvals',
    '/dashboard/impact',
    '/dashboard/beneficiaries',
    '/dashboard/beneficiaries-old',
    '/dashboard/transparency',
    '/dashboard/stories',
    '/dashboard/users-manage',
    '/dashboard/events-manage',
    '/dashboard/wishlist',
    '/dashboard/wishlist-manage',
    '/dashboard/donations-manage',
    '/dashboard/support-requests',
    '/dashboard/profile',
  ],
  beneficiary: ['/dashboard', '/dashboard/profile'],
};

function isRouteAllowed(role: string, pathname: string) {
  const allowedRoutes = allowedRoutesByRole[role] || [];
  
  // Check exact matches and sub-routes
  return allowedRoutes.some((route) => {
    if (route === '/dashboard') {
      return pathname === route;
    }
    
    // Check for exact match or if it's a sub-route
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'staff':
      return '/dashboard/beneficiaries';
    case 'volunteer':
      return '/dashboard';
    case 'donor':
      return '/dashboard';
    case 'beneficiary':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedEmail = localStorage.getItem('userEmail');

    if (!savedUser || !savedEmail) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    const savedRole = localStorage.getItem('userRole') || 'public';
    
    // Check if the current route is allowed for this role
    if (!isRouteAllowed(savedRole, location.pathname)) {
      // Redirect to the appropriate default route for their role
      const defaultRoute = getDefaultRouteForRole(savedRole);
      navigate(defaultRoute, { replace: true });
      return;
    }
  }, [location.pathname, navigate]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <RoleProvider>
          <div className="min-h-screen bg-background flex">
            <div className="fixed left-0 top-0 h-screen z-40">
              <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            </div>
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[80px]' : 'ml-[256px]'}`}>
              <div className="sticky top-0 z-30">
                <Navbar />
              </div>
              <main className="flex-1 p-6 overflow-auto">
                <Outlet />
              </main>
            </div>
            <Chatbot />
            <Toaster position="top-right" richColors />
          </div>
        </RoleProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
