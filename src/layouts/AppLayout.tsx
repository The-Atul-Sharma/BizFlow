import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Sun,
  Download,
  LayoutDashboard,
  Target,
  Users,
  PhoneCall,
  Wrench,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { resetDatabase } from '@/services/db';
import { toast } from 'sonner';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { isInstallable, installApp } = usePWAInstall();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleResetData = () => {
    if (confirm('Reset CRM database back to default initial demo data?')) {
      resetDatabase();
      toast.success('Database reset to initial demo state!');
    }
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">CRM Navigation Menu</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card/80 backdrop-blur-md px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="sm:hidden">
              <GlobalSearch />
            </div>

            {/* PWA Install Button */}
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="gap-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/25 hover:bg-primary/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </Button>
            )}

            {/* Reset Demo Data Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetData}
              title="Reset Demo Data"
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Dark / Light Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings Quick Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              aria-label="Settings"
              title="Settings & Access"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* User Profile Avatar */}
            <button
              onClick={() => navigate('/settings')}
              className="ml-1 flex items-center gap-2 pl-2 border-l hover:opacity-85 transition-opacity text-left cursor-pointer"
              title="Click to view Settings & Profile"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {currentUser?.name
                  ? currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'AS'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground leading-none">
                  {currentUser?.name || 'Atul Sharma'}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {currentUser?.role || 'Admin'} · @{currentUser?.username || 'atul'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="app-main flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="mx-auto max-w-[1600px] p-3 sm:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t bg-card/95 backdrop-blur-md lg:hidden">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="mt-1">Dashboard</span>
          </NavLink>
          <NavLink
            to="/enquiries"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`
            }
          >
            <Target className="h-4 w-4" />
            <span className="mt-1">Leads</span>
          </NavLink>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`
            }
          >
            <Users className="h-4 w-4" />
            <span className="mt-1">Customers</span>
          </NavLink>
          <NavLink
            to="/follow-ups"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`
            }
          >
            <PhoneCall className="h-4 w-4" />
            <span className="mt-1">Follow-ups</span>
          </NavLink>
          <NavLink
            to="/complaints"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`
            }
          >
            <Wrench className="h-4 w-4" />
            <span className="mt-1">Service</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
