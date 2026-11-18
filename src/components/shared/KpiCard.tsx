import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'default';
  onClick?: () => void;
  className?: string;
}

export function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'default',
  onClick,
  className,
}: KpiCardProps) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    default: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-3.5 sm:p-4 transition-all duration-200 border shadow-xs active:scale-[0.99]',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/40 sm:hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
        <div className={cn('rounded-lg p-1.5 sm:p-2 border shrink-0', toneClasses[tone])}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {subtext && (
          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground truncate">{subtext}</p>
        )}
      </div>
    </Card>
  );
}
