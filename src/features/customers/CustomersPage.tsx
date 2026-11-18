import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  Building2,
  MapPin,
  FileText,
  IndianRupee,
  CheckCircle2,
  Edit2,
  Trash2,
  UserCheck,
  Eye,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCRMData } from '@/hooks/useCRMData';
import { customerService, paymentService } from '@/services/api';
import { formatINR, formatDate } from '@/utils/format';
import { exportCustomersToExcel } from '@/utils/exportExcel';
import {
  LeadStatusBadge,
  CustomerCategoryBadge,
  PriorityBadge,
  ComplaintStatusBadge,
} from '@/components/shared/Badges';
import type { Customer, CustomerCategory, LeadStatus } from '@/types';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, staff, enquiries, quotations, complaints, payments } = useCRMData();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('all');
  const [hasOutstandingOnly, setHasOutstandingOnly] = useState(false);

  // Selected customer for detail drawer or edit dialog
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    searchParams.get('id'),
  );
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(
    searchParams.get('new') === '1',
  );
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Record payment dialog state
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NEFT/RTGS' | 'Cash' | 'Cheque'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        c.firmName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q);

      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || c.leadStatus === statusFilter;
      const matchSales = salesPersonFilter === 'all' || c.assignedSalesPersonId === salesPersonFilter;
      const matchOutstanding = !hasOutstandingOnly || (c.outstandingAmount || 0) > 0;

      return (
        matchSearch &&
        matchCategory &&
        matchStatus &&
        matchSales &&
        matchOutstanding
      );
    });
  }, [
    customers,
    search,
    categoryFilter,
    statusFilter,
    salesPersonFilter,
    hasOutstandingOnly,
  ]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Counts
  const workshopsCount = customers.filter((c) => c.category === 'Workshop').length;
  const tyreShopsCount = customers.filter((c) => c.category === 'Tyre Shop').length;
  const fittersCount = customers.filter((c) => c.category === 'Fitters').length;
  const oemCount = customers.filter((c) => c.category === 'OEM').length;
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsAddEditDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddEditDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      customerService.delete(id);
      toast.success('Customer deleted successfully');
      if (selectedCustomerId === id) setSelectedCustomerId(null);
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    paymentService.recordPayment({
      customerId: paymentCustomer.id,
      firmName: paymentCustomer.firmName,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode,
      referenceNo: paymentRef || undefined,
      collectedById: paymentCustomer.assignedSalesPersonId || '',
    });

    toast.success(`Payment of ${formatINR(amount)} recorded successfully!`);
    setPaymentCustomer(null);
    setPaymentAmount('');
    setPaymentRef('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers Directory"
        description="Comprehensive accounts ledger covering Workshops, Tyre Shops, Fitters and OEMs with GST & outstanding tracking."
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {customers.length} Accounts
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCustomersToExcel(filteredCustomers)}
              className="gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export Excel
            </Button>
            <Button size="sm" onClick={handleOpenAdd} className="gap-1.5 shadow-xs font-semibold">
              <Plus className="h-4 w-4" />
              New Customer
            </Button>
          </>
        }
      />

      {/* Customer Category Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3 border-blue-500/20 bg-blue-500/5">
          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Workshops
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{workshopsCount}</div>
          <div className="text-[11px] text-muted-foreground">Multi-brand garages</div>
        </Card>
        <Card className="p-3 border-purple-500/20 bg-purple-500/5">
          <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Tyre Shops
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{tyreShopsCount}</div>
          <div className="text-[11px] text-muted-foreground">Alignment & wheel hubs</div>
        </Card>
        <Card className="p-3 border-teal-500/20 bg-teal-500/5">
          <div className="text-[11px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Fitters
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{fittersCount}</div>
          <div className="text-[11px] text-muted-foreground">Hydraulic & pneumatic</div>
        </Card>
        <Card className="p-3 border-indigo-500/20 bg-indigo-500/5">
          <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            OEM Facilities
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{oemCount}</div>
          <div className="text-[11px] text-muted-foreground">Authorized OEM centers</div>
        </Card>
        <Card className="p-3 border-destructive/20 bg-destructive/5 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-destructive uppercase tracking-wider">
            Total Outstanding
          </div>
          <div className="text-xl font-bold mt-1 text-destructive tabular-nums">
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-[11px] text-muted-foreground">Customer pending dues</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search firm, mobile, city, district, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs">
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

          {/* Lead Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Lead Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasOutstandingOnly}
                onChange={(e) => setHasOutstandingOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span className="font-medium text-foreground">With Outstanding Balance Only</span>
            </label>
          </div>

          <div className="text-muted-foreground">
            Showing <strong className="text-foreground">{filteredCustomers.length}</strong> of{' '}
            {customers.length} accounts
          </div>
        </div>
      </Card>

      {/* Mobile Customer Cards View */}
      <div className="space-y-3 md:hidden">
        {filteredCustomers.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No customers found matching the search criteria.
          </Card>
        ) : (
          filteredCustomers.map((c) => {
            const salesRep = staff.find((s) => s.id === c.assignedSalesPersonId);
            const serviceRep = staff.find((s) => s.id === c.assignedServicePersonId);
            const pct =
              c.creditLimit > 0
                ? Math.min(100, Math.round((c.outstandingAmount / c.creditLimit) * 100))
                : 0;

            return (
              <Card
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className="p-3.5 space-y-3 active:bg-muted/30 transition-colors cursor-pointer shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground leading-snug">
                      {c.firmName}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {c.city}, {c.district}
                      </span>
                    </div>
                  </div>
                  <LeadStatusBadge status={c.leadStatus} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <CustomerCategoryBadge category={c.category} />
                  <span className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    GST: {c.gstin || 'Unregistered'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-2.5 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Contact</div>
                    <div className="font-semibold text-foreground truncate">{c.contactPerson}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{c.mobile}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted-foreground">Outstanding</div>
                    <div
                      className={`font-bold text-sm tabular-nums ${
                        c.outstandingAmount > 0 ? 'text-destructive' : 'text-emerald-600'
                      }`}
                    >
                      {formatINR(c.outstandingAmount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Limit {formatINR(c.creditLimit)} ({pct}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Sales: <strong className="text-foreground">{salesRep?.name?.split(' ')[0] ?? '—'}</strong>
                  </span>
                  <span>
                    Service: <strong className="text-foreground">{serviceRep?.name?.split(' ')[0] ?? '—'}</strong>
                  </span>
                </div>

                <div
                  className="flex items-center justify-between gap-2 pt-2 border-t"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${c.mobile.replace(/\s+/g, '')}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border bg-muted/50 px-2.5 text-xs font-medium text-foreground active:bg-primary active:text-white"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${c.contactPerson}, regarding ${c.firmName} - BizFlow`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-600"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    {c.outstandingAmount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaymentCustomer(c)}
                        className="h-8 text-xs gap-1 px-2.5 border-emerald-500/30 text-emerald-600"
                      >
                        <IndianRupee className="h-3.5 w-3.5" /> Pay
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(c)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(c.id, c.firmName)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Customers Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-3">Firm Name & Location</th>
                <th className="p-3">Category</th>
                <th className="p-3">Contact Person & Mobile</th>
                <th className="p-3">GSTIN Details</th>
                <th className="p-3">Lead Status</th>
                <th className="p-3">Sales / Service Rep</th>
                <th className="p-3 text-right">Outstanding (₹)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const salesRep = staff.find((s) => s.id === c.assignedSalesPersonId);
                  const serviceRep = staff.find((s) => s.id === c.assignedServicePersonId);
                  const isHighOutstanding = c.outstandingAmount > (c.creditLimit * 0.8);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomerId(c.id)}
                    >
                      <td className="p-3">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          {c.firmName}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>
                            {c.city}, {c.district} ({c.state})
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <CustomerCategoryBadge category={c.category} />
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{c.contactPerson}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {c.mobile}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-xs font-medium text-foreground">
                          {c.gstin || 'Unregistered'}
                        </div>
                        <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold">
                          {c.gstStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <LeadStatusBadge status={c.leadStatus} />
                      </td>
                      <td className="p-3">
                        <div className="text-[11px]">
                          <span className="text-muted-foreground">Sales:</span>{' '}
                          <strong className="text-foreground">{salesRep?.name ?? '—'}</strong>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          <span>Tech:</span>{' '}
                          <strong className="text-foreground">{serviceRep?.name ?? '—'}</strong>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className={`font-bold tabular-nums text-sm ${
                            c.outstandingAmount > 0 ? 'text-destructive' : 'text-emerald-600'
                          }`}
                        >
                          {formatINR(c.outstandingAmount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Limit: {formatINR(c.creditLimit)}
                        </div>
                        {isHighOutstanding && (
                          <span className="text-[9px] uppercase font-bold text-rose-500">
                            High Due
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`tel:${c.mobile.replace(/\s+/g, '')}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border bg-muted/60 text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                            title="Call customer"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                          <a
                            href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${c.contactPerson}, regarding ${c.firmName} - BizFlow`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                          {c.outstandingAmount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPaymentCustomer(c)}
                              className="h-7 text-[11px] gap-1 px-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                              title="Record payment"
                            >
                              <IndianRupee className="h-3 w-3" />
                              Pay
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                            className="h-7 w-7 p-0"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(c.id, c.firmName)}
                            className="h-7 w-7 p-0 text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Detail Drawer */}
      <CustomerDetailSheet
        customer={selectedCustomer}
        onClose={() => setSelectedCustomerId(null)}
        onEdit={(c) => {
          setSelectedCustomerId(null);
          handleOpenEdit(c);
        }}
        onRecordPayment={(c) => setPaymentCustomer(c)}
        staff={staff}
        enquiries={enquiries.filter((e) => e.customerId === selectedCustomer?.id)}
        quotations={quotations.filter((q) => q.customerId === selectedCustomer?.id)}
        complaints={complaints.filter((cmp) => cmp.customerId === selectedCustomer?.id)}
        payments={payments.filter((p) => p.customerId === selectedCustomer?.id)}
      />

      {/* Add / Edit Customer Modal */}
      <AddEditCustomerDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        initialData={editingCustomer}
        staff={staff}
      />

      {/* Quick Record Payment Dialog */}
      <Dialog open={!!paymentCustomer} onOpenChange={() => setPaymentCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              Record Payment Receipt
            </DialogTitle>
          </DialogHeader>

          {paymentCustomer && (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div className="font-semibold text-sm text-foreground">
                  {paymentCustomer.firmName}
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Outstanding:</span>
                  <span className="font-bold text-destructive">
                    {formatINR(paymentCustomer.outstandingAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GSTIN:</span>
                  <span className="font-mono">{paymentCustomer.gstin}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pay-amt" className="text-xs">
                  Received Amount (₹) *
                </Label>
                <Input
                  id="pay-amt"
                  type="number"
                  placeholder="e.g. 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Payment Mode</Label>
                  <Select
                    value={paymentMode}
                    onValueChange={(val: any) => setPaymentMode(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI / QR</SelectItem>
                      <SelectItem value="NEFT/RTGS">NEFT / RTGS</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pay-ref" className="text-xs">
                    UTR / Cheque / Ref No
                  </Label>
                  <Input
                    id="pay-ref"
                    placeholder="e.g. UTR-998214"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentCustomer(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Save Receipt & Clear Due
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----------------------------------------------------
// CUSTOMER DETAIL SLIDEOUT SHEET
// ----------------------------------------------------
function CustomerDetailSheet({
  customer,
  onClose,
  onEdit,
  onRecordPayment,
  staff,
  enquiries,
  quotations,
  complaints,
  payments,
}: {
  customer?: Customer;
  onClose: () => void;
  onEdit: (c: Customer) => void;
  onRecordPayment: (c: Customer) => void;
  staff: any[];
  enquiries: any[];
  quotations: any[];
  complaints: any[];
  payments: any[];
}) {
  if (!customer) return null;

  const salesRep = staff.find((s) => s.id === customer.assignedSalesPersonId);
  const serviceRep = staff.find((s) => s.id === customer.assignedServicePersonId);

  const handleUpdateStatus = (status: LeadStatus) => {
    customerService.update(customer.id, { leadStatus: status });
    toast.success(`Lead status updated to ${status.toUpperCase()}`);
  };

  return (
    <Sheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
        <SheetHeader className="p-5 border-b sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between gap-2">
            <CustomerCategoryBadge category={customer.category} />
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => onEdit(customer)} className="h-8 text-xs gap-1">
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                onClick={() => onRecordPayment(customer)}
                className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <IndianRupee className="h-3.5 w-3.5" /> Pay
              </Button>
            </div>
          </div>
          <SheetTitle className="text-lg font-bold text-foreground text-left mt-2">
            {customer.firmName}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground text-left">
            <span className="font-semibold text-foreground">{customer.contactPerson}</span>
            <span>·</span>
            <span>{customer.mobile}</span>
            <span>·</span>
            <span>
              {customer.city}, {customer.district}
            </span>
          </div>
        </SheetHeader>

        <div className="p-5 space-y-6">
          {/* Outstanding Balance Banner */}
          <div className="rounded-xl border p-4 bg-muted/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Outstanding Due
              </div>
              <div className="text-2xl font-bold tabular-nums text-destructive mt-0.5">
                {formatINR(customer.outstandingAmount)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Credit Limit: {formatINR(customer.creditLimit)} · Terms: {customer.paymentTermsDays} Days
              </div>
            </div>
            <LeadStatusBadge status={customer.leadStatus} />
          </div>

          {/* Quick Lead Status Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Update Lead Status
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {(['hot', 'warm', 'cold', 'converted', 'lost'] as LeadStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase transition-colors ${
                    customer.leadStatus === st
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* GST Details Card */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                GSTIN & Tax Details
              </h4>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600">
                {customer.gstStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">GSTIN Number:</span>
                <p className="font-mono font-bold text-foreground mt-0.5">
                  {customer.gstin || 'Not Provided'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <p className="font-semibold text-foreground mt-0.5">{customer.category}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Billing / Workshop Address:</span>
                <p className="text-foreground mt-0.5">
                  {customer.address}, {customer.city}, {customer.district}, {customer.state} -{' '}
                  {customer.pincode}
                </p>
              </div>
            </div>
          </Card>

          {/* Assignment Details */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b pb-2">
              Assigned Personnel
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Sales Executive:</span>
                <p className="font-semibold text-foreground mt-0.5">{salesRep?.name ?? 'Not Assigned'}</p>
                <p className="text-[11px] text-muted-foreground">{salesRep?.mobile}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Service Engineer:</span>
                <p className="font-semibold text-foreground mt-0.5">{serviceRep?.name ?? 'Not Assigned'}</p>
                <p className="text-[11px] text-muted-foreground">{serviceRep?.mobile}</p>
              </div>
            </div>
          </Card>

          {/* Customer History Tabs: Enquiries, Quotes, Service, Payments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Account History & Activity
            </h4>

            {/* Enquiries */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Enquiries ({enquiries.length})</span>
              {enquiries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No enquiries logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {enquiries.map((e) => (
                    <div key={e.id} className="rounded-lg border p-2.5 text-xs bg-card space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-primary">{e.enquiryNumber}</span>
                        <LeadStatusBadge status={e.leadStatus} />
                      </div>
                      <p className="text-foreground font-medium">{e.requirement}</p>
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>Est: {formatINR(e.estimatedValue)}</span>
                        <span>{formatDate(e.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quotations */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-foreground">Quotations ({quotations.length})</span>
              {quotations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No quotations generated yet.</p>
              ) : (
                <div className="space-y-2">
                  {quotations.map((q) => (
                    <div key={q.id} className="rounded-lg border p-2.5 text-xs bg-card space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold">{q.quotationNumber}</span>
                        <span className="font-bold text-foreground">{formatINR(q.grandTotal)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>Status: {q.status}</span>
                        <span>Valid: {formatDate(q.validUntil)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Complaints */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-foreground">Service Complaints ({complaints.length})</span>
              {complaints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No complaints on record.</p>
              ) : (
                <div className="space-y-2">
                  {complaints.map((c) => (
                    <div key={c.id} className="rounded-lg border p-2.5 text-xs bg-card space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-rose-500">{c.ticketNumber}</span>
                        <ComplaintStatusBadge status={c.status} />
                      </div>
                      <p className="text-foreground">{c.equipmentModel}: {c.issueDescription}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Receipts */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-foreground">Payment Receipts ({payments.length})</span>
              {payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payment records yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="rounded-lg border p-2.5 text-xs bg-card flex justify-between items-center">
                      <div>
                        <div className="font-mono font-bold text-emerald-600">{p.receiptNumber}</div>
                        <div className="text-[11px] text-muted-foreground">{p.paymentMode} · {formatDate(p.paymentDate)}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-foreground">{formatINR(p.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ----------------------------------------------------
// ADD / EDIT CUSTOMER DIALOG
// ----------------------------------------------------
function AddEditCustomerDialog({
  open,
  onOpenChange,
  initialData,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Customer | null;
  staff: any[];
}) {
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<CustomerCategory>('Workshop');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [gstStatus, setGstStatus] = useState<'Active' | 'Pending' | 'Unregistered'>('Active');
  const [assignedSalesPersonId, setAssignedSalesPersonId] = useState('');
  const [assignedServicePersonId, setAssignedServicePersonId] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('warm');
  const [outstandingAmount, setOutstandingAmount] = useState('0');
  const [creditLimit, setCreditLimit] = useState('300000');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [notes, setNotes] = useState('');

  // Sync when initialData changes
  useMemo(() => {
    if (initialData) {
      setFirmName(initialData.firmName);
      setContactPerson(initialData.contactPerson);
      setMobile(initialData.mobile);
      setAlternateMobile(initialData.alternateMobile || '');
      setEmail(initialData.email || '');
      setCategory(initialData.category);
      setAddress(initialData.address);
      setCity(initialData.city);
      setDistrict(initialData.district);
      setState(initialData.state);
      setPincode(initialData.pincode);
      setGstin(initialData.gstin);
      setGstStatus(initialData.gstStatus);
      setAssignedSalesPersonId(initialData.assignedSalesPersonId);
      setAssignedServicePersonId(initialData.assignedServicePersonId);
      setLeadStatus(initialData.leadStatus);
      setOutstandingAmount(initialData.outstandingAmount.toString());
      setCreditLimit(initialData.creditLimit.toString());
      setPaymentTermsDays(initialData.paymentTermsDays.toString());
      setNotes(initialData.notes || '');
    } else {
      setFirmName('');
      setContactPerson('');
      setMobile('');
      setAlternateMobile('');
      setEmail('');
      setCategory('Workshop');
      setAddress('');
      setCity('');
      setDistrict('');
      setState('Maharashtra');
      setPincode('');
      setGstin('');
      setGstStatus('Active');
      setAssignedSalesPersonId('');
      setAssignedServicePersonId('');
      setLeadStatus('warm');
      setOutstandingAmount('0');
      setCreditLimit('300000');
      setPaymentTermsDays('30');
      setNotes('');
    }
  }, [initialData, open]);

  const salesStaff = staff.filter((s) => s.role === 'Sales' || s.role === 'Admin');
  const serviceStaff = staff.filter((s) => s.role === 'Service');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !contactPerson.trim() || !mobile.trim()) {
      toast.error('Please enter Firm Name, Contact Person and Mobile');
      return;
    }

    const payload = {
      firmName: firmName.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      alternateMobile: alternateMobile.trim() || undefined,
      email: email.trim() || undefined,
      category,
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      gstin: gstin.trim().toUpperCase(),
      gstStatus,
      assignedSalesPersonId: assignedSalesPersonId || salesStaff[0]?.id || '',
      assignedServicePersonId: assignedServicePersonId || serviceStaff[0]?.id || '',
      leadStatus,
      outstandingAmount: parseFloat(outstandingAmount) || 0,
      creditLimit: parseFloat(creditLimit) || 0,
      paymentTermsDays: parseInt(paymentTermsDays, 10) || 30,
      notes: notes.trim() || undefined,
    };

    if (initialData) {
      customerService.update(initialData.id, payload);
      toast.success('Customer updated successfully!');
    } else {
      customerService.create(payload);
      toast.success('New customer account created!');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {initialData ? 'Edit Customer Details' : 'Add New Customer Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Firm & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Firm / Garage / Shop Name *</Label>
              <Input
                placeholder="e.g. Apex Auto Tech Workshop"
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

          {/* Contact Person & Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contact Person *</Label>
              <Input
                placeholder="e.g. Gurpreet Singh"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile Number *</Label>
              <Input
                placeholder="e.g. +91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. owner@workshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Address & Location */}
          <div className="space-y-1">
            <Label className="text-xs">Workshop / Shop Address</Label>
            <Input
              placeholder="e.g. Plot 15, Transport Nagar, Phase 2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">City *</Label>
              <Input
                placeholder="e.g. Pune"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">District *</Label>
              <Input
                placeholder="e.g. Pune"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Input
                placeholder="e.g. Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pincode</Label>
              <Input
                placeholder="e.g. 411028"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* GST Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
            <div className="space-y-1">
              <Label className="text-xs">GSTIN (15 Digits)</Label>
              <Input
                placeholder="e.g. 27AAACS1234F1Z8"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">GST Registration Status</Label>
              <Select value={gstStatus} onValueChange={(val: any) => setGstStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active Registered</SelectItem>
                  <SelectItem value="Pending">Pending Verification</SelectItem>
                  <SelectItem value="Unregistered">Unregistered / Composition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sales & Service Personnel Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Assigned Sales Rep *</Label>
              <Select
                value={assignedSalesPersonId}
                onValueChange={setAssignedSalesPersonId}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Sales Rep" />
                </SelectTrigger>
                <SelectContent>
                  {salesStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Assigned Service Tech *</Label>
              <Select
                value={assignedServicePersonId}
                onValueChange={setAssignedServicePersonId}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Service Tech" />
                </SelectTrigger>
                <SelectContent>
                  {serviceStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (Engineer)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="converted">Converted Client</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Outstanding & Credit Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Outstanding Balance (₹)</Label>
              <Input
                type="number"
                value={outstandingAmount}
                onChange={(e) => setOutstandingAmount(e.target.value)}
                className="h-9 text-xs tabular-nums text-destructive font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Credit Limit (₹)</Label>
              <Input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="h-9 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Terms (Days)</Label>
              <Input
                type="number"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(e.target.value)}
                className="h-9 text-xs"
              />
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
              {initialData ? 'Update Customer' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
