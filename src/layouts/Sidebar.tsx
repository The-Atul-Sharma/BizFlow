import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  PhoneCall,
  Wrench,
  IndianRupee,
  UserCheck,
  Building2,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarProps) {
  const { enquiries, quotations, followUps, complaints, customers } = useCRMData();

  const todayStr = new Date().toISOString().split('T')[0];

  const newEnquiriesCount = enquiries.filter(
    (e) => e.leadStatus === 'hot' || e.leadStatus === 'warm',
  ).length;

  const pendingQuotesCount = quotations.filter((q) => q.status === 'Pending').length;

  const todayFollowUpsCount = followUps.filter(
    (f) => f.scheduledDate <= todayStr && f.status === 'Pending',
  ).length;

  const openComplaintsCount = complaints.filter(
    (c) => c.status === 'Open' || c.status === 'In Progress',
  ).length;

  const outstandingCustomersCount = customers.filter(
    (c) => (c.outstandingAmount || 0) > 0,
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/enquiries',
      label: 'Enquiries & Leads',
      icon: Target,
      badge: newEnquiriesCount > 0 ? newEnquiriesCount : null,
      badgeTone: 'bg-primary text-primary-foreground',
    },
    {
      to: '/customers',
      label: 'Customers Directory',
      icon: Users,
      badge: customers.length,
      badgeTone: 'bg-muted text-muted-foreground',
    },
    {
      to: '/quotations',
      label: 'Quotations',
      icon: FileText,
      badge: pendingQuotesCount > 0 ? pendingQuotesCount : null,
      badgeTone: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    {
      to: '/follow-ups',
      label: "Today's Follow-ups",
      icon: PhoneCall,
      badge: todayFollowUpsCount > 0 ? todayFollowUpsCount : null,
      badgeTone: 'bg-rose-500 text-white animate-pulse',
    },
    {
      to: '/complaints',
      label: 'Service Complaints',
      icon: Wrench,
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
      badgeTone: 'bg-orange-500 text-white',
    },
    {
      to: '/payments',
      label: 'Payments & Outstanding',
      icon: IndianRupee,
      badge: outstandingCustomersCount > 0 ? `${outstandingCustomersCount}` : null,
      badgeTone: 'bg-destructive/20 text-destructive',
    },
    {
      to: '/team',
      label: 'Sales & Service Team',
      icon: UserCheck,
      badge: null,
    },
    {
      to: '/settings',
      label: 'Settings & Access',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <div className="flex h-full flex-col bg-card border-r">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm">
          <img
            src="/bizflow-logo.png"
            alt="BizFlow"
            className="h-9 w-9 object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground">
            <span className="truncate">BizFlow</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              PWA
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground">
            Workshops · Tyres · OEM
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={cn(
                        'ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeTone || 'bg-muted text-muted-foreground',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Quick PWA Info Footer */}
      <div className="border-t p-3 bg-muted/40">
        <div className="rounded-lg border bg-card p-2.5 text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">Offline-ready PWA</p>
            <p className="text-[11px] truncate">Auto-sync & Instant cache</p>
          </div>
        </div>
      </div>
    </div>
  );
}
