import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { Toaster } from 'sonner';

export function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Outlet />
          <Toaster position="top-right" richColors />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
