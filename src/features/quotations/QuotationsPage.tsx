import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
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
import { useCRMData } from '@/hooks/useCRMData';
import { quotationService, settingsService } from '@/services/api';
import { formatINR, formatDate } from '@/utils/format';
import { QuotationStatusBadge } from '@/components/shared/Badges';
import type { Quotation, QuotationStatus, QuotationItem } from '@/types';
import { toast } from 'sonner';

export default function QuotationsPage() {
  const [searchParams] = useSearchParams();
  const { quotations, customers, staff } = useCRMData();
  const orgSettings = settingsService.get();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(
    searchParams.get('new') === '1',
  );
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const query = search.toLowerCase();
      const matchSearch =
        !search ||
        q.quotationNumber.toLowerCase().includes(query) ||
        q.firmName.toLowerCase().includes(query) ||
        q.contactPerson.toLowerCase().includes(query) ||
        q.gstin.toLowerCase().includes(query);

      const matchStatus = statusFilter === 'all' || q.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [quotations, search, statusFilter]);

  const pendingQuotes = quotations.filter((q) => q.status === 'Pending');
  const pendingValue = pendingQuotes.reduce((s, q) => s + q.grandTotal, 0);
  const acceptedValue = quotations
    .filter((q) => q.status === 'Accepted')
    .reduce((s, q) => s + q.grandTotal, 0);

  const handleStatusUpdate = (id: string, status: QuotationStatus) => {
    quotationService.updateStatus(id, status);
    toast.success(`Quotation marked as ${status}`);
    if (selectedQuotation && selectedQuotation.id === id) {
      setSelectedQuotation({ ...selectedQuotation, status });
    }
  };

  const handleDelete = (id: string, num: string) => {
    if (confirm(`Delete quotation ${num}?`)) {
      quotationService.delete(id);
      toast.success('Quotation deleted');
      if (selectedQuotation?.id === id) setSelectedQuotation(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations Management"
        description="Official equipment estimates, GST breakdown, and approval status tracking for garages and OEM facilities."
        badge={
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {pendingQuotes.length} Pending ({formatINR(pendingValue)})
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingQuotation(null);
              setIsAddEditDialogOpen(true);
            }}
            className="gap-1.5 shadow-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create Quotation
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 border-amber-500/20 bg-amber-500/5">
          <div className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">
            Pending Approval
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{pendingQuotes.length}</div>
          <div className="text-[11px] text-muted-foreground">{formatINR(pendingValue)}</div>
        </Card>
        <Card className="p-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Accepted & Converted
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {quotations.filter((q) => q.status === 'Accepted').length}
          </div>
          <div className="text-[11px] text-muted-foreground">{formatINR(acceptedValue)}</div>
        </Card>
        <Card className="p-3 border-rose-500/20 bg-rose-500/5">
          <div className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
            Rejected
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {quotations.filter((q) => q.status === 'Rejected').length}
          </div>
          <div className="text-[11px] text-muted-foreground">Competitor / budget</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Quotations
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">{quotations.length}</div>
          <div className="text-[11px] text-muted-foreground">All generated proposals</div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search quotation no, customer, contact, GSTIN..."
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
              <SelectItem value="Pending">Pending Decision</SelectItem>
              <SelectItem value="Accepted">Accepted / Won</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Mobile Quotations Cards */}
      <div className="space-y-3 md:hidden">
        {filteredQuotations.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No quotations matching your filter.
          </Card>
        ) : (
          filteredQuotations.map((q) => (
            <Card
              key={q.id}
              className="p-3.5 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  {q.quotationNumber}
                </span>
                <QuotationStatusBadge status={q.status} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground">{q.firmName}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {q.contactPerson} · {q.mobile}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  GST: {q.gstin || 'Unregistered'}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2 text-xs text-foreground/90 line-clamp-2">
                {q.items.map((i) => i.description).join(', ')}
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <div>
                  <div className="font-bold text-sm tabular-nums text-foreground">
                    {formatINR(q.grandTotal)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Valid till {formatDate(q.validUntil)}
                  </div>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedQuotation(q)}
                    className="h-8 text-xs gap-1 px-2.5"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingQuotation(q);
                      setIsAddEditDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(q.id, q.quotationNumber)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Quotations Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-3">Quotation No</th>
                <th className="p-3">Firm Name & GSTIN</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Items Summary</th>
                <th className="p-3 font-semibold text-right">Grand Total (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Valid Until</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredQuotations.map((q) => {
                const rep = staff.find((s) => s.id === q.assignedSalesPersonId);
                return (
                  <tr
                    key={q.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-primary">{q.quotationNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{q.firmName}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        GST: {q.gstin || 'Unregistered'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{q.contactPerson}</div>
                      <div className="text-[11px] text-muted-foreground">{q.mobile}</div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">
                      {q.items.map((i) => i.description).join(', ')}
                    </td>
                    <td className="p-3 text-right font-bold text-sm tabular-nums text-foreground">
                      {formatINR(q.grandTotal)}
                    </td>
                    <td className="p-3">
                      <QuotationStatusBadge status={q.status} />
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(q.validUntil)}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedQuotation(q)}
                          className="h-7 w-7 p-0 cursor-pointer"
                          title="View / Print"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingQuotation(q);
                            setIsAddEditDialogOpen(true);
                          }}
                          className="h-7 w-7 p-0"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(q.id, q.quotationNumber)}
                          className="h-7 w-7 p-0 text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Printable Quotation View Dialog */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[88dvh] sm:max-h-[90vh] overflow-y-auto">
          {selectedQuotation && (
            <div className="space-y-5">
              {/* Header and Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 pr-8 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-base font-bold text-primary">
                    {selectedQuotation.quotationNumber}
                  </span>
                  <QuotationStatusBadge status={selectedQuotation.status} />
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedQuotation.status}
                    onValueChange={(val: any) => handleStatusUpdate(selectedQuotation.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs w-32 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 h-8 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print PDF
                  </Button>
                </div>
              </div>

              {/* Quotation Document Content */}
              <div className="space-y-4 sm:space-y-5 text-xs text-foreground sm:p-2">
                {/* Company Branding */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-primary">
                      {orgSettings?.companyName || 'BizFlow'}
                    </h2>
                    {orgSettings?.tagline && (
                      <p className="text-muted-foreground mt-0.5">{orgSettings.tagline}</p>
                    )}
                    {(orgSettings?.gstin || orgSettings?.phone) && (
                      <p className="text-muted-foreground mt-0.5">
                        {orgSettings.gstin ? (
                          <>
                            GSTIN: <strong>{orgSettings.gstin}</strong>
                          </>
                        ) : null}
                        {orgSettings.gstin && orgSettings.phone ? ' · ' : null}
                        {orgSettings.phone ? `Tel: ${orgSettings.phone}` : null}
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs sm:text-sm font-bold uppercase text-foreground">
                      COMMERCIAL QUOTATION
                    </div>
                    <div className="font-mono text-xs font-bold text-primary mt-0.5 sm:mt-1">
                      {selectedQuotation.quotationNumber}
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      Date: {formatDate(selectedQuotation.createdAt)}
                    </div>
                    <div className="text-muted-foreground">
                      Valid Until: {formatDate(selectedQuotation.validUntil)}
                    </div>
                  </div>
                </div>

                {/* Buyer / Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border p-3 rounded-lg bg-muted/20">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Quotation To:
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-1">
                      {selectedQuotation.firmName}
                    </h3>
                    <p className="text-muted-foreground">Attn: {selectedQuotation.contactPerson}</p>
                    <p className="text-muted-foreground">Mobile: {selectedQuotation.mobile}</p>
                  </div>
                  <div className="sm:text-right border-t pt-2.5 sm:border-t-0 sm:pt-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tax & GST Details:
                    </span>
                    <p className="font-mono font-bold text-foreground mt-1">
                      GSTIN: {selectedQuotation.gstin || 'Unregistered'}
                    </p>
                    <p className="text-muted-foreground">Place of Supply: Inter-state / Intra-state</p>
                  </div>
                </div>

                {/* Mobile Items Cards */}
                <div className="space-y-2 sm:hidden print:hidden">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Items ({selectedQuotation.items.length})
                  </div>
                  {selectedQuotation.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-lg border bg-muted/20 p-3 space-y-1.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground leading-snug">
                          {idx + 1}. {item.description}
                        </span>
                        <span className="font-bold tabular-nums text-foreground shrink-0">
                          {formatINR(item.total)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>HSN: <strong className="font-mono text-foreground">{item.hsnCode}</strong></span>
                        <span>
                          {item.qty} × {formatINR(item.unitPrice)} (+{item.taxPercent}% GST)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop & Print Items Table */}
                <div className="hidden sm:block print:block overflow-x-auto">
                  <table className="w-full border-collapse border text-xs">
                    <thead className="bg-muted/50 uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="border p-2 text-center w-10">#</th>
                        <th className="border p-2 text-left">Item Description</th>
                        <th className="border p-2 text-center w-20">HSN</th>
                        <th className="border p-2 text-center w-14">Qty</th>
                        <th className="border p-2 text-right w-24">Rate (₹)</th>
                        <th className="border p-2 text-center w-16">GST %</th>
                        <th className="border p-2 text-right w-28">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="border p-2 text-center text-muted-foreground">{idx + 1}</td>
                          <td className="border p-2 font-medium">{item.description}</td>
                          <td className="border p-2 text-center font-mono">{item.hsnCode}</td>
                          <td className="border p-2 text-center">{item.qty}</td>
                          <td className="border p-2 text-right tabular-nums">
                            {formatINR(item.unitPrice)}
                          </td>
                          <td className="border p-2 text-center">{item.taxPercent}%</td>
                          <td className="border p-2 text-right font-bold tabular-nums">
                            {formatINR(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations & Totals */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal (Excl. Tax):</span>
                      <span className="tabular-nums font-medium text-foreground">
                        {formatINR(selectedQuotation.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST (CGST 9% + SGST 9%):</span>
                      <span className="tabular-nums font-medium text-foreground">
                        {formatINR(selectedQuotation.taxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-sm text-foreground">
                      <span>Grand Total:</span>
                      <span className="tabular-nums text-primary">
                        {formatINR(selectedQuotation.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms and Notes */}
                {selectedQuotation.notes && (
                  <div className="border-t pt-3 space-y-1">
                    <span className="font-semibold text-foreground">Terms & Conditions:</span>
                    <p className="text-muted-foreground leading-relaxed">{selectedQuotation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Quotation Dialog */}
      <AddEditQuotationDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        initialData={editingQuotation}
        customers={customers}
        staff={staff}
      />
    </div>
  );
}

// ----------------------------------------------------
// CREATE / EDIT QUOTATION DIALOG
// ----------------------------------------------------
function AddEditQuotationDialog({
  open,
  onOpenChange,
  initialData,
  customers,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Quotation | null;
  customers: any[];
  staff: any[];
}) {
  const [customerId, setCustomerId] = useState('');
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstin, setGstin] = useState('');
  const [assignedSalesPersonId, setAssignedSalesPersonId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('Pending');
  const [notes, setNotes] = useState('Payment: 30% advance with PO, 70% against delivery. Delivery: 7-10 working days.');

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 'qi-1',
      description: 'AutoAlign 3D Precision Wheel Aligner Machine',
      hsnCode: '8458',
      qty: 1,
      unitPrice: 380000,
      taxPercent: 18,
      total: 448400,
    },
  ]);

  useMemo(() => {
    if (initialData) {
      setCustomerId(initialData.customerId);
      setFirmName(initialData.firmName);
      setContactPerson(initialData.contactPerson);
      setMobile(initialData.mobile);
      setGstin(initialData.gstin);
      setAssignedSalesPersonId(initialData.assignedSalesPersonId);
      setValidUntil(initialData.validUntil);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setItems(initialData.items || []);
    } else {
      const defaultCust = customers[0];
      setCustomerId(defaultCust?.id || '');
      setFirmName(defaultCust?.firmName || '');
      setContactPerson(defaultCust?.contactPerson || '');
      setMobile(defaultCust?.mobile || '');
      setGstin(defaultCust?.gstin || '');
      setAssignedSalesPersonId(staff[0]?.id || '');
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidUntil(d.toISOString().split('T')[0]);
      setStatus('Pending');
      setNotes('Payment: 30% advance with PO, 70% against delivery.');
      setItems([
        {
          id: `qi-${Date.now()}`,
          description: '',
          hsnCode: '',
          qty: 1,
          unitPrice: 0,
          taxPercent: 18,
          total: 0,
        },
      ]);
    }
  }, [initialData, open]);

  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setFirmName(c.firmName);
      setContactPerson(c.contactPerson);
      setMobile(c.mobile);
      setGstin(c.gstin);
      if (c.assignedSalesPersonId) setAssignedSalesPersonId(c.assignedSalesPersonId);
    }
  };

  const handleItemChange = (idx: number, field: keyof QuotationItem, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };

    const qty = Number(updated[idx].qty) || 1;
    const price = Number(updated[idx].unitPrice) || 0;
    const tax = Number(updated[idx].taxPercent) || 18;
    const sub = qty * price;
    updated[idx].total = Math.round(sub + (sub * tax) / 100);

    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `qi-${Date.now()}`,
        description: '',
        hsnCode: '8479',
        qty: 1,
        unitPrice: 0,
        taxPercent: 18,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.qty) * Number(i.unitPrice)), 0);
  const grandTotal = items.reduce((s, i) => s + Number(i.total), 0);
  const taxAmount = grandTotal - subtotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || items.length === 0) {
      toast.error('Please enter customer firm name and at least 1 item');
      return;
    }

    const payload = {
      customerId: customerId || `cust-${Date.now()}`,
      firmName: firmName.trim(),
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      gstin: gstin.trim(),
      status,
      items,
      subtotal,
      taxAmount,
      grandTotal,
      assignedSalesPersonId: assignedSalesPersonId || '',
      validUntil,
      notes: notes.trim() || undefined,
    };

    if (initialData) {
      quotationService.update(initialData.id, payload);
      toast.success('Quotation updated');
    } else {
      quotationService.create(payload);
      toast.success('Quotation created successfully!');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {initialData ? 'Edit Quotation' : 'Create New Quotation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Select Customer Account *</Label>
              <Select value={customerId} onValueChange={handleSelectCustomer}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firmName} ({c.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Firm / Company Name *</Label>
              <Input
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contact Person</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile Number</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Customer GSTIN</Label>
              <Input
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Quotation Line Items
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-end rounded-lg border p-2.5 bg-muted/20 text-xs"
                >
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Description *</Label>
                    <Input
                      placeholder="e.g. 3D Wheel Aligner"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">HSN Code</Label>
                    <Input
                      placeholder="8458"
                      value={item.hsnCode}
                      onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value, 10))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Price (₹)</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value))}
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground block text-right">
                      Amount (₹)
                    </Label>
                    <div className="flex h-8 items-center justify-end rounded-md border bg-muted/50 px-2 font-bold text-xs tabular-nums text-foreground whitespace-nowrap">
                      {formatINR(item.total)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-2 text-xs">
              <div className="w-56 space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-foreground">{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-foreground border-t pt-1">
                  <span>Grand Total:</span>
                  <span className="text-primary">{formatINR(grandTotal)}</span>
                </div>
              </div>
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
              {initialData ? 'Update Quotation' : 'Save Quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
