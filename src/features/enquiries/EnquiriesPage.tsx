import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Target,
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Flame,
  Sun,
  Snowflake,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCRMData } from '@/hooks/useCRMData';
import { enquiryService } from '@/services/api';
import { formatINR, formatDate } from '@/utils/format';
import { exportEnquiriesToExcel } from '@/utils/exportExcel';
import {
  LeadStatusBadge,
  CustomerCategoryBadge,
  PriorityBadge,
} from '@/components/shared/Badges';
import type { Enquiry, LeadStatus, Priority, CustomerCategory } from '@/types';
import { toast } from 'sonner';

export default function EnquiriesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enquiries, customers, staff } = useCRMData();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(
    searchParams.get('new') === '1',
  );
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);

  const baseFilteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        e.enquiryNumber.toLowerCase().includes(q) ||
        e.firmName.toLowerCase().includes(q) ||
        e.contactPerson.toLowerCase().includes(q) ||
        e.mobile.includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.requirement.toLowerCase().includes(q);

      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchSales = salesPersonFilter === 'all' || e.assignedSalesPersonId === salesPersonFilter;
      const matchPriority = priorityFilter === 'all' || e.priority === priorityFilter;

      return matchSearch && matchCat && matchSales && matchPriority;
    });
  }, [enquiries, search, categoryFilter, salesPersonFilter, priorityFilter]);

  const filteredEnquiries = useMemo(() => {
    if (statusFilter === 'all') return baseFilteredEnquiries;
    return baseFilteredEnquiries.filter((e) => e.leadStatus === statusFilter);
  }, [baseFilteredEnquiries, statusFilter]);

  const handleOpenAdd = () => {
    setEditingEnquiry(null);
    setIsAddEditDialogOpen(true);
  };

  const handleOpenEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setIsAddEditDialogOpen(true);
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Delete enquiry ${num}?`)) {
      enquiryService.delete(id);
      toast.success('Enquiry deleted');
    }
  };

  const handleStatusChange = (id: string, status: LeadStatus) => {
    enquiryService.updateStatus(id, status);
    toast.success(`Moved to ${status.toUpperCase()}`);
  };

  const salesStaff = staff.filter((s) => s.role === 'Sales' || s.role === 'Admin');

  // Pipeline columns definition
  const columns: {
    status: LeadStatus;
    title: string;
    icon: typeof Flame;
    color: string;
    bg: string;
  }[] = [
    {
      status: 'hot',
      title: 'Hot Leads',
      icon: Flame,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'border-rose-500/20 bg-rose-500/5',
    },
    {
      status: 'warm',
      title: 'Warm Leads',
      icon: Sun,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'border-amber-500/20 bg-amber-500/5',
    },
    {
      status: 'cold',
      title: 'Cold Leads',
      icon: Snowflake,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'border-sky-500/20 bg-sky-500/5',
    },
    {
      status: 'converted',
      title: 'Converted (Won)',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'border-emerald-500/20 bg-emerald-500/5',
    },
    {
      status: 'lost',
      title: 'Lost Deals',
      icon: XCircle,
      color: 'text-zinc-600 dark:text-zinc-400',
      bg: 'border-zinc-500/20 bg-zinc-500/5',
    },
  ];

  const totalValue = filteredEnquiries.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiries & Lead Pipeline"
        description="Track lead conversions from initial interest to quotation and closing across all customer segments."
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {filteredEnquiries.length} Leads ({formatINR(totalValue)})
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex rounded-lg border bg-muted p-0.5 shrink-0">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-7 text-xs px-2.5 gap-1"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Pipeline
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-7 text-xs px-2.5 gap-1"
              >
                <List className="h-3.5 w-3.5" />
                Table
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportEnquiriesToExcel(filteredEnquiries)}
              className="gap-1.5 shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export
            </Button>

            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="gap-1.5 font-semibold shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Enquiry
            </Button>
          </div>
        }
      />

      {/* Filter Row */}
      <Card className="p-3">
        <div
          className={`grid grid-cols-1 gap-2.5 sm:grid-cols-2 ${
            viewMode === 'table' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'
          }`}
        >
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search enquiries, requirement, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Workshop">Workshop</SelectItem>
              <SelectItem value="Tyre Shop">Tyre Shop</SelectItem>
              <SelectItem value="Fitters">Fitters</SelectItem>
              <SelectItem value="OEM">OEM Facility</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === 'table' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="All Lead Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lead Status</SelectItem>
                <SelectItem value="hot">Hot Lead</SelectItem>
                <SelectItem value="warm">Warm Lead</SelectItem>
                <SelectItem value="cold">Cold Lead</SelectItem>
                <SelectItem value="converted">Converted (Won)</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="All Sales Executives" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sales Executives</SelectItem>
              {salesStaff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color-coded Lead Status Filter Pills in Table View */}
        {viewMode === 'table' && (
          <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              All Leads ({baseFilteredEnquiries.length})
            </button>
            {columns.map((col) => {
              const Icon = col.icon;
              const count = baseFilteredEnquiries.filter((e) => e.leadStatus === col.status).length;
              const activeStyles: Record<LeadStatus, string> = {
                hot: 'bg-rose-600 text-white border-rose-600 shadow-xs',
                warm: 'bg-amber-500 text-white border-amber-500 shadow-xs',
                cold: 'bg-sky-600 text-white border-sky-600 shadow-xs',
                converted: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
                lost: 'bg-zinc-600 text-white border-zinc-600 shadow-xs',
              };
              const inactiveStyles: Record<LeadStatus, string> = {
                hot: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
                warm: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
                cold: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
                converted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
                lost: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20',
              };
              const isActive = statusFilter === col.status;

              return (
                <button
                  key={col.status}
                  onClick={() => setStatusFilter(isActive ? 'all' : col.status)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                    isActive ? activeStyles[col.status] : inactiveStyles[col.status]
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{col.title}</span>
                  <span className="opacity-85">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* VIEW: KANBAN PIPELINE */}
      {viewMode === 'kanban' ? (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-1 px-1 no-scrollbar md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-3.5 items-start">
          {columns.map((col) => {
            const items = baseFilteredEnquiries.filter((e) => e.leadStatus === col.status);
            const colTotal = items.reduce((s, e) => s + e.estimatedValue, 0);
            const Icon = col.icon;

            return (
              <div
                key={col.status}
                className={`snap-center shrink-0 w-[85vw] max-w-[340px] md:w-auto md:max-w-none rounded-xl border p-3 flex flex-col gap-3 min-h-[420px] md:min-h-[500px] ${col.bg}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${col.color}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {col.title}
                    </span>
                  </div>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold border">
                    {items.length}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
                  <span>Pipe Value:</span>
                  <span className="text-foreground">{formatINR(colTotal)}</span>
                </div>

                {/* Cards in Column */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      No leads
                    </div>
                  ) : (
                    items.map((item) => {
                      const rep = staff.find((s) => s.id === item.assignedSalesPersonId);
                      return (
                        <Card
                          key={item.id}
                          className="p-3 space-y-2 border bg-card shadow-xs hover:shadow-md transition-all hover:border-primary/40"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-primary">
                              {item.enquiryNumber}
                            </span>
                            <PriorityBadge priority={item.priority} />
                          </div>

                          <div>
                            <h4 className="font-semibold text-xs text-foreground leading-snug">
                              {item.firmName}
                            </h4>
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between mt-0.5">
                              <span>{item.city}, {item.district}</span>
                              <CustomerCategoryBadge category={item.category} />
                            </div>
                          </div>

                          <div className="text-xs font-medium text-foreground/90 bg-muted/50 p-2 rounded line-clamp-2">
                            {item.requirement}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t text-xs">
                            <span className="font-bold tabular-nums text-foreground">
                              {formatINR(item.estimatedValue)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Rep: <strong className="text-foreground">{rep?.name?.split(' ')[0]}</strong>
                            </span>
                          </div>

                          {/* Quick Follow-up Date */}
                          {item.nextFollowUpDate && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3 text-rose-500" />
                              <span>Next: {formatDate(item.nextFollowUpDate)}</span>
                            </div>
                          )}

                          {/* Card Actions */}
                          <div className="flex items-center justify-between pt-1 border-t gap-1">
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${item.mobile.replace(/\s+/g, '')}`}
                                className="inline-flex h-6 w-6 items-center justify-center rounded border bg-muted/60 text-muted-foreground hover:bg-primary hover:text-white"
                                title="Call"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                              <a
                                href={`https://wa.me/${item.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  `Hello ${item.contactPerson}, regarding your requirement at ${item.firmName} - BizFlow`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-6 w-6 items-center justify-center rounded border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                title="WhatsApp"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </a>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded border bg-muted/60 text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Move Pipeline Dropdown */}
                            <Select
                              value={item.leadStatus}
                              onValueChange={(val: any) => handleStatusChange(item.id, val)}
                            >
                              <SelectTrigger className="h-6 w-20 text-[10px] px-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hot">Hot</SelectItem>
                                <SelectItem value="warm">Warm</SelectItem>
                                <SelectItem value="cold">Cold</SelectItem>
                                <SelectItem value="converted">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW: TABLE */
        <>
          {/* Mobile Enquiry Cards */}
          <div className="space-y-3 md:hidden">
            {filteredEnquiries.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                No enquiries found matching the selected filters.
              </Card>
            ) : (
              filteredEnquiries.map((e) => {
                const rep = staff.find((s) => s.id === e.assignedSalesPersonId);
                return (
                  <Card key={e.id} className="p-3.5 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {e.enquiryNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={e.priority} />
                        <LeadStatusBadge status={e.leadStatus} />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground">{e.firmName}</h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                        <span>
                          {e.contactPerson} · {e.city}
                        </span>
                        <CustomerCategoryBadge category={e.category} />
                      </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-2 text-xs text-foreground/90">
                      {e.requirement}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sm tabular-nums text-foreground">
                        {formatINR(e.estimatedValue)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Rep: <strong className="text-foreground">{rep?.name ?? '—'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${e.mobile.replace(/\s+/g, '')}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-muted/50 text-foreground"
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${e.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello ${e.contactPerson}, regarding your requirement at ${e.firmName} - BizFlow`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(e)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(e.id, e.enquiryNumber)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Select
                        value={e.leadStatus}
                        onValueChange={(val: any) => handleStatusChange(e.id, val)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3">Enquiry No</th>
                  <th className="p-3">Firm Name & Location</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">Est. Value (₹)</th>
                  <th className="p-3">Lead Status</th>
                  <th className="p-3">Sales Person</th>
                  <th className="p-3">Next Action</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No enquiries found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((e) => {
                  const rep = staff.find((s) => s.id === e.assignedSalesPersonId);
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{e.enquiryNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{e.firmName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {e.contactPerson} · {e.mobile} ({e.city}, {e.district})
                        </div>
                      </td>
                      <td className="p-3">
                        <CustomerCategoryBadge category={e.category} />
                      </td>
                      <td className="p-3 max-w-[220px]">
                        <p className="truncate font-medium text-foreground">{e.requirement}</p>
                        <span className="text-[10px] text-muted-foreground">Source: {e.source}</span>
                      </td>
                      <td className="p-3 font-bold tabular-nums text-foreground">
                        {formatINR(e.estimatedValue)}
                      </td>
                      <td className="p-3">
                        <LeadStatusBadge status={e.leadStatus} />
                      </td>
                      <td className="p-3 font-medium text-foreground">{rep?.name ?? '—'}</td>
                      <td className="p-3">
                        {e.nextFollowUpDate ? (
                          <div className="text-[11px] text-muted-foreground">
                            {formatDate(e.nextFollowUpDate)}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(e)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(e.id, e.enquiryNumber)}
                            className="h-7 w-7 p-0 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
          </Card>
        </>
      )}

      {/* Add / Edit Enquiry Modal */}
      <AddEditEnquiryDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        initialData={editingEnquiry}
        customers={customers}
        staff={salesStaff}
      />
    </div>
  );
}

// ----------------------------------------------------
// ADD / EDIT ENQUIRY DIALOG
// ----------------------------------------------------
function AddEditEnquiryDialog({
  open,
  onOpenChange,
  initialData,
  customers,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Enquiry | null;
  customers: any[];
  staff: any[];
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState<CustomerCategory>('Workshop');
  const [requirement, setRequirement] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('hot');
  const [priority, setPriority] = useState<Priority>('High');
  const [assignedSalesPersonId, setAssignedSalesPersonId] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [source, setSource] = useState<any>('Direct Visit');
  const [notes, setNotes] = useState('');

  useMemo(() => {
    if (initialData) {
      setSelectedCustomerId(initialData.customerId || '');
      setFirmName(initialData.firmName);
      setContactPerson(initialData.contactPerson);
      setMobile(initialData.mobile);
      setCity(initialData.city);
      setDistrict(initialData.district);
      setCategory(initialData.category);
      setRequirement(initialData.requirement);
      setEstimatedValue(initialData.estimatedValue.toString());
      setLeadStatus(initialData.leadStatus);
      setPriority(initialData.priority);
      setAssignedSalesPersonId(initialData.assignedSalesPersonId);
      setNextFollowUpDate(initialData.nextFollowUpDate);
      setSource(initialData.source);
      setNotes(initialData.notes || '');
    } else {
      setSelectedCustomerId('');
      setFirmName('');
      setContactPerson('');
      setMobile('');
      setCity('');
      setDistrict('');
      setCategory('Workshop');
      setRequirement('');
      setEstimatedValue('350000');
      setLeadStatus('hot');
      setPriority('High');
      setAssignedSalesPersonId(staff[0]?.id || 'st-1');
      setNextFollowUpDate(new Date().toISOString().split('T')[0]);
      setSource('Direct Visit');
      setNotes('');
    }
  }, [initialData, open]);

  // When selecting existing customer, autofill details
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    const c = customers.find((cust) => cust.id === custId);
    if (c) {
      setFirmName(c.firmName);
      setContactPerson(c.contactPerson);
      setMobile(c.mobile);
      setCity(c.city);
      setDistrict(c.district);
      setCategory(c.category);
      if (c.assignedSalesPersonId) setAssignedSalesPersonId(c.assignedSalesPersonId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !requirement.trim() || !mobile.trim()) {
      toast.error('Please enter Firm Name, Mobile and Requirement');
      return;
    }

    const payload = {
      customerId: selectedCustomerId || undefined,
      firmName: firmName.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      district: district.trim(),
      category,
      requirement: requirement.trim(),
      estimatedValue: parseFloat(estimatedValue) || 0,
      leadStatus,
      priority,
      assignedSalesPersonId: assignedSalesPersonId || staff[0]?.id || 'st-1',
      nextFollowUpDate,
      source,
      notes: notes.trim() || undefined,
    };

    if (initialData) {
      enquiryService.update(initialData.id, payload);
      toast.success('Enquiry updated');
    } else {
      enquiryService.create(payload);
      toast.success('New enquiry logged and follow-up scheduled!');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {initialData ? 'Edit Enquiry' : 'Log New Enquiry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pick existing customer optional */}
          {!initialData && (
            <div className="space-y-1">
              <Label className="text-xs">Link Existing Customer (Optional)</Label>
              <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Or select from registered customers..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- New Customer / Unlisted --</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firmName} ({c.city}, {c.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Firm & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Firm / Workshop Name *</Label>
              <Input
                placeholder="e.g. Apex Auto Tech"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category *</Label>
              <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Tyre Shop">Tyre Shop</SelectItem>
                  <SelectItem value="Fitters">Fitters</SelectItem>
                  <SelectItem value="OEM">OEM Facility</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Person, Mobile, City, District */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contact Person</Label>
              <Input
                placeholder="Name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile Number *</Label>
              <Input
                placeholder="+91..."
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City *</Label>
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">District *</Label>
              <Input
                placeholder="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Requirement & Estimated Value */}
          <div className="space-y-1">
            <Label className="text-xs">Equipment / Machinery Requirement *</Label>
            <Input
              placeholder="e.g. 3D Wheel Aligner + 4.0T Scissor Lift"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Estimated Value (₹)</Label>
              <Input
                type="number"
                placeholder="e.g. 450000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="h-9 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lead Status *</Label>
              <Select value={leadStatus} onValueChange={(val: any) => setLeadStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot Lead</SelectItem>
                  <SelectItem value="warm">Warm Lead</SelectItem>
                  <SelectItem value="cold">Cold Lead</SelectItem>
                  <SelectItem value="converted">Converted (Won)</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Assign Sales Rep *</Label>
              <Select
                value={assignedSalesPersonId}
                onValueChange={setAssignedSalesPersonId}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Next Follow-up Date</Label>
              <Input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Lead Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct Visit">Direct Visit</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Exhibition">Exhibition</SelectItem>
                  <SelectItem value="OEM Referral">OEM Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Discussion Notes</Label>
            <Input
              placeholder="Customer requirements, workshop foundation status, competitor price..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-semibold shadow-xs">
              {initialData ? 'Update Enquiry' : 'Save & Schedule Follow-up'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
