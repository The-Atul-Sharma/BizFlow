import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarContent } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useCRMData } from '@/hooks/useCRMData';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { isInstallable, installApp } = usePWAInstall();
  const { currentUser, logout } = useAuth();
  const { followUps, complaints } = useCRMData();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFollowUpsCount = followUps.filter(
    (f) => f.scheduledDate <= todayStr && f.status === 'Pending',
  ).length;
  const openComplaintsCount = complaints.filter(
    (c) => c.status === 'Open' || c.status === 'In Progress',
  ).length;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'BF';

  return (
    <div className="app-shell flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">BizFlow Navigation Menu</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b bg-card/90 backdrop-blur-md px-3 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Brand Title */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 lg:hidden cursor-pointer"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-xs">
                <img
                  src="/bizflow-logo.png"
                  alt="BizFlow"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                BizFlow
              </span>
            </div>

            <div className="hidden sm:block lg:ml-0 ml-2">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="sm:hidden">
              <GlobalSearch />
            </div>

            {/* PWA Install Button */}
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                className="h-8 gap-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/25 hover:bg-primary/20 px-2.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </Button>
            )}

            {/* Dark / Light Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings Quick Icon (Desktop/Tablet) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              aria-label="Settings"
              title="Settings & Access"
              className="hidden sm:inline-flex h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-0.5 flex items-center gap-2 sm:pl-2 sm:border-l hover:opacity-85 transition-opacity text-left cursor-pointer focus:outline-none"
                  title="Account & Sign out"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-foreground leading-none">
                      {currentUser?.name ?? 'User'}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {currentUser?.role ?? ''} · @{currentUser?.username ?? ''}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{currentUser?.name ?? 'User'}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {currentUser?.role} · @{currentUser?.username}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings & Access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main
          ref={mainRef}
          className="app-main flex-1 overflow-y-auto pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0"
        >
          <div className="mx-auto max-w-[1600px] p-3 sm:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
          <div className="flex h-15 items-center justify-around px-1">
            {[
              { to: '/', label: 'Home', icon: LayoutDashboard, end: true, badge: 0 },
              { to: '/enquiries', label: 'Leads', icon: Target, end: false, badge: 0 },
              { to: '/customers', label: 'Customers', icon: Users, end: false, badge: 0 },
              {
                to: '/follow-ups',
                label: 'Follow-ups',
                icon: PhoneCall,
                end: false,
                badge: todayFollowUpsCount,
              },
              {
                to: '/complaints',
                label: 'Service',
                icon: Wrench,
                end: false,
                badge: openComplaintsCount,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={({ isActive }) =>
                    `relative flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                          isActive ? 'bg-primary/12' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.badge > 0 && (
                          <span className="absolute -top-0.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 leading-none">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
