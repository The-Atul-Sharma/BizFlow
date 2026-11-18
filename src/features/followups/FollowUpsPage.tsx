import { useState, useMemo } from 'react';
import {
  PhoneCall,
  Search,
  Plus,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Clock,
  AlertCircle,
  Building2,
  Edit2,
  Trash2,
  Filter,
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
import { followUpService } from '@/services/api';
import { formatDate } from '@/utils/format';
import { PriorityBadge } from '@/components/shared/Badges';
import type { FollowUp, Priority, FollowUpStatus } from '@/types';
import { toast } from 'sonner';

export default function FollowUpsPage() {
  const { followUps, customers, staff } = useCRMData();
  const todayStr = new Date().toISOString().split('T')[0];

  const [tabFilter, setTabFilter] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [search, setSearch] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('all');

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [completionOutcome, setCompletionOutcome] = useState('Discussion Completed');
  const [completionNotes, setCompletionNotes] = useState('');

  // Counts
  const todayItems = followUps.filter(
    (f) => f.scheduledDate === todayStr && f.status === 'Pending',
  );
  const overdueItems = followUps.filter(
    (f) => f.scheduledDate < todayStr && f.status === 'Pending',
  );
  const upcomingItems = followUps.filter(
    (f) => f.scheduledDate > todayStr && f.status === 'Pending',
  );
  const completedItems = followUps.filter((f) => f.status === 'Completed');

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      // Tab filter
      if (tabFilter === 'today' && (f.scheduledDate !== todayStr || f.status !== 'Pending')) {
        return false;
      }
      if (tabFilter === 'overdue' && (f.scheduledDate >= todayStr || f.status !== 'Pending')) {
        return false;
      }
      if (tabFilter === 'upcoming' && (f.scheduledDate <= todayStr || f.status !== 'Pending')) {
        return false;
      }
      if (tabFilter === 'completed' && f.status !== 'Completed') {
        return false;
      }

      // Search
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        f.firmName.toLowerCase().includes(q) ||
        f.contactPerson.toLowerCase().includes(q) ||
        f.mobile.includes(q) ||
        f.title.toLowerCase().includes(q);

      // Staff
      const matchStaff = assignedFilter === 'all' || f.assignedPersonId === assignedFilter;

      return matchSearch && matchStaff;
    });
  }, [followUps, tabFilter, search, assignedFilter, todayStr]);

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowUp) return;
    followUpService.complete(completingFollowUp.id, completionOutcome, completionNotes);
    toast.success('Follow-up marked as completed!');
    setCompletingFollowUp(null);
    setCompletionNotes('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this follow-up entry?')) {
      followUpService.delete(id);
      toast.success('Follow-up deleted');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups & Schedules"
        description="Daily communication pipeline for quotations, payment collections, and service visits."
        badge={
          <span className="rounded-full bg-rose-500 text-white px-2.5 py-0.5 text-xs font-semibold">
            {todayItems.length} Due Today
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => setIsAddEditDialogOpen(true)}
            className="gap-1.5 shadow-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Schedule Follow-up
          </Button>
        }
      />

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTabFilter('today')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'today'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Today's Calls ({todayItems.length})
        </button>

        <button
          onClick={() => setTabFilter('overdue')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'overdue'
              ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
              : 'bg-card text-rose-600 hover:bg-rose-500/10'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Overdue ({overdueItems.length})
        </button>

        <button
          onClick={() => setTabFilter('upcoming')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'upcoming'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Upcoming ({upcomingItems.length})
        </button>

        <button
          onClick={() => setTabFilter('completed')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-card text-emerald-600 hover:bg-emerald-500/10'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed ({completedItems.length})
        </button>
      </div>

      {/* Search & Staff Filter */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by customer, title, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Follow-up Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredFollowUps.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl bg-card">
            No follow-ups found for this category.
          </div>
        ) : (
          filteredFollowUps.map((f) => (
            <Card
              key={f.id}
              className="p-4 space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {f.type}
                  </span>
                  <PriorityBadge priority={f.priority} />
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  <div className="text-xs text-primary font-medium mt-0.5">{f.firmName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {f.contactPerson} · {f.mobile}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-2 text-xs text-foreground/90">
                  {f.notes}
                </div>

                {f.outcome && (
                  <div className="text-xs text-emerald-600 bg-emerald-500/10 p-2 rounded">
                    <strong>Outcome:</strong> {f.outcome}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>
                    Date: <strong className="text-foreground">{formatDate(f.scheduledDate)}</strong>{' '}
                    {f.scheduledTime && `(${f.scheduledTime})`}
                  </span>
                  <span>
                    By: <strong className="text-foreground">{f.assignedPersonName}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 gap-1">
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${f.mobile.replace(/\s+/g, '')}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-muted/60 text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                      title="Call"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${f.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${f.contactPerson}, regarding ${f.title} at ${f.firmName} - BizFlow`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(f.id)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {f.status === 'Pending' ? (
                    <Button
                      size="sm"
                      onClick={() => setCompletingFollowUp(f)}
                      className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Completed
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Complete Follow-up Dialog */}
      <Dialog open={!!completingFollowUp} onOpenChange={() => setCompletingFollowUp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Complete Follow-up Call / Visit
            </DialogTitle>
          </DialogHeader>

          {completingFollowUp && (
            <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-2.5 text-xs">
                <span className="font-semibold text-foreground">{completingFollowUp.firmName}</span>
                <p className="text-muted-foreground mt-0.5">{completingFollowUp.title}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Outcome of Discussion *</Label>
                <Select value={completionOutcome} onValueChange={setCompletionOutcome}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quotation Approved / Purchase Order Expected">
                      Quotation Approved / PO Expected
                    </SelectItem>
                    <SelectItem value="Follow-up Requested Next Week">
                      Follow-up Requested Next Week
                    </SelectItem>
                    <SelectItem value="Payment Promised via RTGS/Cheque">
                      Payment Promised via RTGS/Cheque
                    </SelectItem>
                    <SelectItem value="Machine Issue Resolved On-site">
                      Machine Issue Resolved On-site
                    </SelectItem>
                    <SelectItem value="Price Negotiation in Progress">
                      Price Negotiation in Progress
                    </SelectItem>
                    <SelectItem value="Client Postponed Purchase">
                      Client Postponed Purchase
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Discussion Summary / Notes</Label>
                <Input
                  placeholder="Key points agreed during call or site visit..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletingFollowUp(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Save Outcome
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Follow-up Dialog */}
      <AddFollowUpDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        customers={customers}
        staff={staff}
      />
    </div>
  );
}

function AddFollowUpDialog({
  open,
  onOpenChange,
  customers,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: any[];
  staff: any[];
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<any>('Sales');
  const [customerId, setCustomerId] = useState('');
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [scheduledTime, setScheduledTime] = useState('11:00 AM');
  const [assignedPersonId, setAssignedPersonId] = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [notes, setNotes] = useState('');

  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setFirmName(c.firmName);
      setContactPerson(c.contactPerson);
      setMobile(c.mobile);
      if (c.assignedSalesPersonId) setAssignedPersonId(c.assignedSalesPersonId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !firmName.trim() || !mobile.trim()) {
      toast.error('Please enter Title, Firm Name and Mobile');
      return;
    }

    const assignedStaff = staff.find((s) => s.id === assignedPersonId);

    followUpService.create({
      title: title.trim(),
      type,
      customerId: customerId || undefined,
      firmName: firmName.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      scheduledDate,
      scheduledTime,
      assignedPersonId: assignedPersonId || staff[0]?.id || '',
      assignedPersonName: assignedStaff?.name ?? 'Sales Team',
      status: 'Pending',
      priority,
      notes: notes.trim(),
    });

    toast.success('Follow-up scheduled!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-primary" />
            Schedule New Follow-up
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Follow-up Title *</Label>
            <Input
              placeholder="e.g. Discuss Quotation QUO-2026-101 and delivery terms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales Call</SelectItem>
                  <SelectItem value="Quotation Review">Quotation Review</SelectItem>
                  <SelectItem value="Payment Collection">Payment Collection</SelectItem>
                  <SelectItem value="Service">Service / Tech Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Select Customer</Label>
              <Select value={customerId} onValueChange={handleSelectCustomer}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Existing customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Firm Name *</Label>
              <Input
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contact Person</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile *</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Time</Label>
              <Input
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-9 text-xs"
              />
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

          <div className="space-y-1">
            <Label className="text-xs">Assigned Person</Label>
            <Select value={assignedPersonId} onValueChange={setAssignedPersonId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Assign executive" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Agenda / Notes</Label>
            <Input
              placeholder="Discussion goal, quotation terms, customer concerns..."
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
              Schedule Follow-up
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
