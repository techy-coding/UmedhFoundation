import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ensureDefaultAdminUser } from './services/auth';

export default function App() {
  useEffect(() => {
    ensureDefaultAdminUser().catch((error) => {
      console.error('Failed to ensure default admin user:', error);
    });
  }, []);

  return <RouterProvider router={router} />;
}
