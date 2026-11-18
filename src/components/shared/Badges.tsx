import { Flame, Sun, Snowflake, CheckCircle2, XCircle } from 'lucide-react';
import type { CustomerCategory, LeadStatus, Priority, QuotationStatus, ComplaintStatus } from '@/types';
import { cn } from '@/lib/utils';

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const configs: Record<LeadStatus, { label: string; class: string; icon: typeof Flame }> = {
    hot: {
      label: 'Hot Lead',
      class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: Flame,
    },
    warm: {
      label: 'Warm Lead',
      class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Sun,
    },
    cold: {
      label: 'Cold Lead',
      class: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      icon: Snowflake,
    },
    converted: {
      label: 'Converted',
      class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
    },
    lost: {
      label: 'Lost',
      class: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
      icon: XCircle,
    },
  };

  const config = configs[status] || configs.warm;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        config.class,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function CustomerCategoryBadge({ category }: { category: CustomerCategory }) {
  const styles: Record<CustomerCategory, string> = {
    Workshop: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'Tyre Shop': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    Fitters: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    OEM: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    Dealer: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Other: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
        styles[category] || 'bg-muted text-muted-foreground border-border',
      )}
    >
      {category}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    Low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    High: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold',
    Critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        styles[priority] || styles.Medium,
      )}
    >
      {priority}
    </span>
  );
}

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const styles: Record<QuotationStatus, string> = {
    Draft: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Accepted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Rejected: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    Expired: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        styles[status] || styles.Draft,
      )}
    >
      {status}
    </span>
  );
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const styles: Record<ComplaintStatus, string> = {
    Open: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    'Awaiting Parts': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Resolved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Closed: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        styles[status] || styles.Open,
      )}
    >
      {status}
    </span>
  );
}
