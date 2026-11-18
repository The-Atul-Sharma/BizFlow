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
}

export function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'default',
  onClick,
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
        'p-4 transition-all duration-200 border shadow-xs',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={cn('rounded-lg p-2 border', toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {subtext && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{subtext}</p>
        )}
      </div>
    </Card>
  );
}
