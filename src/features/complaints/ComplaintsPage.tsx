import { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  UserCheck,
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
import { complaintService } from '@/services/api';
import { formatDate, formatDateTime } from '@/utils/format';
import { exportComplaintsToExcel } from '@/utils/exportExcel';
import {
  PriorityBadge,
  ComplaintStatusBadge,
  CustomerCategoryBadge,
} from '@/components/shared/Badges';
import type { ServiceComplaint, ComplaintStatus, Priority, CustomerCategory } from '@/types';
import { toast } from 'sonner';

export default function ComplaintsPage() {
  const { complaints, customers, staff } = useCRMData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [engineerFilter, setEngineerFilter] = useState<string>('all');

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<ServiceComplaint | null>(null);

  const [resolvingComplaint, setResolvingComplaint] = useState<ServiceComplaint | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  const serviceEngineers = staff.filter((s) => s.role === 'Service' || s.role === 'Manager');

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        c.ticketNumber.toLowerCase().includes(q) ||
        c.firmName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.equipmentModel.toLowerCase().includes(q) ||
        c.issueDescription.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      const matchEngineer = engineerFilter === 'all' || c.assignedServicePersonId === engineerFilter;

      return matchSearch && matchStatus && matchPriority && matchEngineer;
    });
  }, [complaints, search, statusFilter, priorityFilter, engineerFilter]);

  const openTickets = complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress');
  const criticalTickets = complaints.filter(
    (c) => (c.status === 'Open' || c.status === 'In Progress') && c.priority === 'Critical',
  );
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    if (!resolutionRemarks.trim()) {
      toast.error('Please enter resolution remarks');
      return;
    }

    complaintService.resolve(resolvingComplaint.id, resolutionRemarks.trim());
    toast.success(`Complaint ${resolvingComplaint.ticketNumber} marked as Resolved!`);
    setResolvingComplaint(null);
    setResolutionRemarks('');
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Delete complaint ${num}?`)) {
      complaintService.delete(id);
      toast.success('Complaint ticket deleted');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Complaints & Breakdown Tickets"
        description="Field engineering requests, warranty maintenance, and diagnostic tickets for workshop equipment."
        badge={
          <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {openTickets.length} Active Tickets
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportComplaintsToExcel(filteredComplaints)}
              className="gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingComplaint(null);
                setIsAddEditDialogOpen(true);
              }}
              className="gap-1.5 shadow-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Log Complaint
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 border-rose-500/20 bg-rose-500/5">
          <div className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
            Critical SLA Breakdowns
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{criticalTickets.length}</div>
          <div className="text-[11px] text-muted-foreground">Requires on-site engineer &lt; 4 hrs</div>
        </Card>
        <Card className="p-3 border-amber-500/20 bg-amber-500/5">
          <div className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">
            In Progress & Awaiting Parts
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {complaints.filter((c) => c.status === 'In Progress' || c.status === 'Awaiting Parts').length}
          </div>
          <div className="text-[11px] text-muted-foreground">Parts dispatched / testing</div>
        </Card>
        <Card className="p-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Resolved Tickets
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{resolvedCount}</div>
          <div className="text-[11px] text-muted-foreground">Closed with customer sign-off</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Tickets Logged
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{complaints.length}</div>
          <div className="text-[11px] text-muted-foreground">Lifetime service ledger</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search ticket, machine model, firm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Awaiting Parts">Awaiting Parts</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={engineerFilter} onValueChange={setEngineerFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Engineers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engineers</SelectItem>
              {serviceEngineers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Complaints List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-3">Ticket No</th>
                <th className="p-3">Customer & Location</th>
                <th className="p-3">Category</th>
                <th className="p-3">Equipment & Issue</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Engineer</th>
                <th className="p-3">Reported On</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No complaints matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-rose-500">{c.ticketNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{c.firmName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.contactPerson} · {c.mobile} ({c.city})
                      </div>
                    </td>
                    <td className="p-3">
                      <CustomerCategoryBadge category={c.category} />
                    </td>
                    <td className="p-3 max-w-[240px]">
                      <div className="font-semibold text-foreground truncate">{c.equipmentModel}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {c.issueDescription}
                      </div>
                      {c.resolutionNotes && (
                        <div className="text-[10px] text-emerald-600 mt-0.5 font-medium truncate">
                          ✓ {c.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="p-3">
                      <ComplaintStatusBadge status={c.status} />
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {c.assignedServicePersonName}
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(c.reportedDate)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`tel:${c.mobile.replace(/\s+/g, '')}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border bg-muted/60 text-muted-foreground hover:bg-primary hover:text-white"
                          title="Call customer"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                        {c.status !== 'Resolved' && c.status !== 'Closed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setResolvingComplaint(c)}
                            className="h-7 text-[11px] gap-1 px-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Resolve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingComplaint(c);
                            setIsAddEditDialogOpen(true);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(c.id, c.ticketNumber)}
                          className="h-7 w-7 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resolve Complaint Dialog */}
      <Dialog open={!!resolvingComplaint} onOpenChange={() => setResolvingComplaint(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Resolve Service Complaint
            </DialogTitle>
          </DialogHeader>

          {resolvingComplaint && (
            <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span>{resolvingComplaint.ticketNumber}</span>
                  <PriorityBadge priority={resolvingComplaint.priority} />
                </div>
                <div className="font-semibold text-foreground">{resolvingComplaint.firmName}</div>
                <div className="text-muted-foreground">{resolvingComplaint.equipmentModel}</div>
                <div className="text-[11px] text-foreground bg-background p-2 rounded border mt-1">
                  {resolvingComplaint.issueDescription}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Resolution Work Done & Remarks *</Label>
                <textarea
                  rows={3}
                  placeholder="Explain actions taken (e.g. replaced optic sensor, adjusted hydraulic pressure, calibrated scale)..."
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolvingComplaint(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Confirm Resolution
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Complaint Dialog */}
      <AddEditComplaintDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        initialData={editingComplaint}
        customers={customers}
        engineers={serviceEngineers}
      />
    </div>
  );
}

function AddEditComplaintDialog({
  open,
  onOpenChange,
  initialData,
  customers,
  engineers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ServiceComplaint | null;
  customers: any[];
  engineers: any[];
}) {
  const [customerId, setCustomerId] = useState('');
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState<CustomerCategory>('Workshop');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [status, setStatus] = useState<ComplaintStatus>('Open');
  const [assignedServicePersonId, setAssignedServicePersonId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useMemo(() => {
    if (initialData) {
      setCustomerId(initialData.customerId);
      setFirmName(initialData.firmName);
      setContactPerson(initialData.contactPerson);
      setMobile(initialData.mobile);
      setCity(initialData.city);
      setDistrict(initialData.district);
      setCategory(initialData.category);
      setEquipmentModel(initialData.equipmentModel);
      setSerialNumber(initialData.serialNumber || '');
      setIssueDescription(initialData.issueDescription);
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setAssignedServicePersonId(initialData.assignedServicePersonId);
      setResolutionNotes(initialData.resolutionNotes || '');
    } else {
      const defaultCust = customers[0];
      setCustomerId(defaultCust?.id || '');
      setFirmName(defaultCust?.firmName || '');
      setContactPerson(defaultCust?.contactPerson || '');
      setMobile(defaultCust?.mobile || '');
      setCity(defaultCust?.city || '');
      setDistrict(defaultCust?.district || '');
      setCategory(defaultCust?.category || 'Workshop');
      setEquipmentModel('');
      setSerialNumber('');
      setIssueDescription('');
      setPriority('High');
      setStatus('Open');
      setAssignedServicePersonId(engineers[0]?.id || 'st-5');
      setResolutionNotes('');
    }
  }, [initialData, open]);

  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setFirmName(c.firmName);
      setContactPerson(c.contactPerson);
      setMobile(c.mobile);
      setCity(c.city);
      setDistrict(c.district);
      setCategory(c.category);
      if (c.assignedServicePersonId) setAssignedServicePersonId(c.assignedServicePersonId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !equipmentModel.trim() || !issueDescription.trim()) {
      toast.error('Please enter customer firm name, equipment model and issue details');
      return;
    }

    const assignedEngineer = engineers.find((s) => s.id === assignedServicePersonId);

    const payload = {
      customerId: customerId || `cust-${Date.now()}`,
      firmName: firmName.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      district: district.trim(),
      category,
      equipmentModel: equipmentModel.trim(),
      serialNumber: serialNumber.trim() || undefined,
      issueDescription: issueDescription.trim(),
      priority,
      status,
      assignedServicePersonId: assignedServicePersonId || engineers[0]?.id || 'st-5',
      assignedServicePersonName: assignedEngineer?.name ?? 'Service Engineer',
      reportedDate: initialData ? initialData.reportedDate : new Date().toISOString(),
      resolutionNotes: resolutionNotes.trim() || undefined,
    };

    if (initialData) {
      complaintService.update(initialData.id, payload);
      toast.success('Complaint ticket updated');
    } else {
      complaintService.create(payload);
      toast.success('Complaint ticket registered and assigned!');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            {initialData ? 'Edit Complaint Ticket' : 'Log New Service Breakdown Ticket'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Select Customer *</Label>
              <Select value={customerId} onValueChange={handleSelectCustomer}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose registered customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firmName} ({c.city}, {c.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Firm / Workshop Name *</Label>
              <Input
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Contact Person</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile Number *</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Machine and Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Equipment / Machine Model *</Label>
              <Input
                placeholder="e.g. HydroLift 4.0T Twin Post / 3D Aligner"
                value={equipmentModel}
                onChange={(e) => setEquipmentModel(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Machine Serial Number</Label>
              <Input
                placeholder="e.g. HL40-2025-0912"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Issue Description */}
          <div className="space-y-1">
            <Label className="text-xs">Issue / Breakdown Description *</Label>
            <textarea
              rows={3}
              placeholder="Describe the malfunction, error code, hydraulic leak, noise..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Priority, Status, Assigned Engineer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Priority *</Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical (Breakdown)</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Ticket Status *</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Awaiting Parts">Awaiting Parts</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assign Service Engineer *</Label>
              <Select
                value={assignedServicePersonId}
                onValueChange={setAssignedServicePersonId}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {initialData ? 'Update Ticket' : 'Register Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
