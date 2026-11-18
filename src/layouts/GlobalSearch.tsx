import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Target, Wrench, FileText, Settings } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCRMData } from '@/hooks/useCRMData';
import { formatINR } from '@/utils/format';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { customers, enquiries, quotations, complaints } = useCRMData();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-64"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="truncate">Search firm, city, ticket, mobile...</span>
        <kbd className="pointer-events-none ml-auto hidden rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search customers, enquiries, quotes, complaints..." />
        <CommandList className="max-h-96">
          <CommandEmpty>No matching records found.</CommandEmpty>

          <CommandGroup heading="Customers & Workshops">
            {customers.slice(0, 5).map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.firmName} ${c.city} ${c.district} ${c.mobile} ${c.category} ${c.gstin}`}
                onSelect={() => handleSelect(`/customers?id=${c.id}`)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="truncate">
                    <span className="font-medium text-foreground">{c.firmName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.city}, {c.district} · {c.category}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-destructive shrink-0">
                  {c.outstandingAmount > 0 ? formatINR(c.outstandingAmount) : 'Clear'}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Enquiries & Leads">
            {enquiries.slice(0, 5).map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.enquiryNumber} ${e.firmName} ${e.requirement} ${e.city}`}
                onSelect={() => handleSelect(`/enquiries?id=${e.id}`)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium">{e.enquiryNumber}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{e.firmName}</span>
                  </div>
                </div>
                <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-muted">
                  {e.leadStatus}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quotations">
            {quotations.slice(0, 4).map((q) => (
              <CommandItem
                key={q.id}
                value={`${q.quotationNumber} ${q.firmName}`}
                onSelect={() => handleSelect(`/quotations?id=${q.id}`)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium">{q.quotationNumber}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{q.firmName}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold">{formatINR(q.grandTotal)}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Service Complaints">
            {complaints.slice(0, 4).map((cmp) => (
              <CommandItem
                key={cmp.id}
                value={`${cmp.ticketNumber} ${cmp.firmName} ${cmp.equipmentModel}`}
                onSelect={() => handleSelect(`/complaints?id=${cmp.id}`)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="h-4 w-4 text-rose-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium">{cmp.ticketNumber}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{cmp.equipmentModel}</span>
                  </div>
                </div>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600">
                  {cmp.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="System & Configuration">
            <CommandItem
              value="settings user access password credentials permissions organization"
              onSelect={() => handleSelect('/settings')}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary shrink-0" />
                <span>Settings & User Access Control (Passwords, Roles, GST)</span>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
