import { useState, useMemo } from 'react';
import {
  IndianRupee,
  Search,
  Plus,
  ArrowDownRight,
  CreditCard,
  Building2,
  FileCheck,
  AlertTriangle,
  Receipt,
  Phone,
  MessageSquare,
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
import { paymentService } from '@/services/api';
import { formatINR, formatDate } from '@/utils/format';
import { CustomerCategoryBadge } from '@/components/shared/Badges';
import type { Customer, PaymentReceipt, PaymentMode } from '@/types';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const { customers, payments, staff } = useCRMData();

  const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Calculations
  const totalOutstanding = customers.reduce((s, c) => s + (c.outstandingAmount || 0), 0);
  const customersWithDues = customers.filter((c) => (c.outstandingAmount || 0) > 0);
  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          c.firmName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.gstin.toLowerCase().includes(q);

        const matchCat = categoryFilter === 'all' || c.category === categoryFilter;

        return matchSearch && matchCat;
      })
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);
  }, [customers, search, categoryFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase();
      return (
        !search ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.firmName.toLowerCase().includes(q) ||
        p.paymentMode.toLowerCase().includes(q) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q))
      );
    });
  }, [payments, search]);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const receipt = paymentService.recordPayment({
      customerId: paymentCustomer.id,
      firmName: paymentCustomer.firmName,
      invoiceNumber: invoiceNumber.trim() || undefined,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode,
      referenceNo: paymentRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      collectedById: paymentCustomer.assignedSalesPersonId || 'st-1',
    });

    toast.success(
      `Payment receipt ${receipt.receiptNumber} generated! ${formatINR(amount)} credited.`,
    );
    setPaymentCustomer(null);
    setPaymentAmount('');
    setPaymentRef('');
    setPaymentNotes('');
    setInvoiceNumber('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outstanding & Payment Collections"
        description="Monitor customer credit limits, overdue payments, and record collection receipts."
        badge={
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            {formatINR(totalOutstanding)} Due
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => setPaymentCustomer(customersWithDues[0] || customers[0])}
            className="gap-1.5 shadow-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Record Payment Receipt
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 border-destructive/20 bg-destructive/5">
          <div className="text-[11px] font-medium text-destructive uppercase tracking-wider">
            Total Outstanding Balance
          </div>
          <div className="text-xl font-bold mt-1 text-destructive tabular-nums">
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Across {customersWithDues.length} workshop accounts
          </div>
        </Card>
        <Card className="p-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Total Collections Logged
          </div>
          <div className="text-xl font-bold mt-1 text-foreground tabular-nums">
            {formatINR(totalCollected)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {payments.length} receipts generated
          </div>
        </Card>
        <Card className="p-3 border-amber-500/20 bg-amber-500/5">
          <div className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">
            Accounts with Overdue
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {customersWithDues.length}
          </div>
          <div className="text-[11px] text-muted-foreground">Payment pending follow-up</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Average Payment Terms
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">30 Days</div>
          <div className="text-[11px] text-muted-foreground">Standard credit cycle</div>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`flex items-center gap-2 border-b-2 px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'outstanding'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Customer Outstanding Ledger ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Payment Receipts History ({payments.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === 'outstanding'
                  ? 'Search customer, city, GSTIN...'
                  : 'Search receipt no, customer, UTR...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {activeTab === 'outstanding' && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Tyre Shop">Tyre Shop</SelectItem>
                <SelectItem value="Fitters">Fitters</SelectItem>
                <SelectItem value="OEM">OEM Facility</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* TAB 1: OUTSTANDING LEDGER */}
      {activeTab === 'outstanding' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3">Customer Firm</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Contact & Mobile</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Credit Terms</th>
                  <th className="p-3 text-right">Credit Limit (₹)</th>
                  <th className="p-3 text-right font-semibold text-destructive">
                    Outstanding (₹)
                  </th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCustomers.map((c) => {
                  const isExceeded = c.outstandingAmount > c.creditLimit;
                  const percentUsed =
                    c.creditLimit > 0
                      ? Math.min(100, Math.round((c.outstandingAmount / c.creditLimit) * 100))
                      : 0;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{c.firmName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.city}, {c.district}
                        </div>
                      </td>
                      <td className="p-3">
                        <CustomerCategoryBadge category={c.category} />
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{c.contactPerson}</div>
                        <div className="text-[11px] text-muted-foreground">{c.mobile}</div>
                      </td>
                      <td className="p-3 font-mono text-xs">{c.gstin || 'Unregistered'}</td>
                      <td className="p-3 text-muted-foreground">{c.paymentTermsDays} Days</td>
                      <td className="p-3 text-right font-medium tabular-nums text-foreground">
                        {formatINR(c.creditLimit)}
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className={`font-bold tabular-nums text-sm ${
                            c.outstandingAmount > 0 ? 'text-destructive' : 'text-emerald-600'
                          }`}
                        >
                          {formatINR(c.outstandingAmount)}
                        </div>
                        {c.outstandingAmount > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            {percentUsed}% limit used
                          </div>
                        )}
                        {isExceeded && (
                          <span className="text-[9px] font-bold text-rose-500 uppercase">
                            Limit Exceeded!
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Reminder: Outstanding balance of ${formatINR(c.outstandingAmount)} is pending for ${c.firmName}. Kindly arrange payment.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                          <Button
                            size="sm"
                            onClick={() => setPaymentCustomer(c)}
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            <IndianRupee className="h-3 w-3" />
                            Collect
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
      ) : (
        /* TAB 2: RECEIPT HISTORY */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Customer Firm</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Reference / UTR No</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3 text-right font-bold">Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-600">
                      {p.receiptNumber}
                    </td>
                    <td className="p-3 font-semibold text-foreground">{p.firmName}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                    <td className="p-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {p.referenceNo || '—'}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {p.invoiceNumber || 'On Account'}
                    </td>
                    <td className="p-3 text-right font-bold text-sm text-emerald-600 tabular-nums">
                      {formatINR(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={!!paymentCustomer} onOpenChange={() => setPaymentCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              Record Payment Receipt
            </DialogTitle>
          </DialogHeader>

          {paymentCustomer && (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 pt-2">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div className="font-semibold text-sm text-foreground">
                  {paymentCustomer.firmName}
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Outstanding Due:</span>
                  <span className="font-bold text-destructive">
                    {formatINR(paymentCustomer.outstandingAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GSTIN:</span>
                  <span className="font-mono">{paymentCustomer.gstin || 'Unregistered'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Amount Received (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="h-9 text-xs tabular-nums text-foreground font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Payment Mode *</Label>
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
                  <Label className="text-xs">UTR / Cheque Ref No</Label>
                  <Input
                    placeholder="e.g. UTR-908124"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Against Invoice No (Optional)</Label>
                <Input
                  placeholder="e.g. INV-2026-104 or leave blank for On Account"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Receipt Remarks</Label>
                <Input
                  placeholder="Part payment / full clearance..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="h-9 text-xs"
                />
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
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Record Receipt & Clear Dues
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
