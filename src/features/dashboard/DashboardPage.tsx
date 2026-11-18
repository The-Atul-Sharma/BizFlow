import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Target,
  FileText,
  IndianRupee,
  PhoneCall,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  MessageSquare,
  Phone,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCRMData } from '@/hooks/useCRMData';
import { formatINR, formatCompactINR } from '@/utils/format';
import {
  PipelineBarChart,
  CategoryPieChart,
  OutstandingBarChart,
} from './DashboardCharts';
import {
  LeadStatusBadge,
  CustomerCategoryBadge,
  PriorityBadge,
  ComplaintStatusBadge,
} from '@/components/shared/Badges';
import { followUpService } from '@/services/api';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { customers, enquiries, quotations, followUps, complaints, staff } = useCRMData();
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. New Enquiries KPI
  const activeEnquiries = enquiries.filter(
    (e) => e.leadStatus === 'hot' || e.leadStatus === 'warm' || e.leadStatus === 'cold',
  );
  const totalPipelineValue = activeEnquiries.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  const hotLeadsCount = enquiries.filter((e) => e.leadStatus === 'hot').length;

  // 2. Pending Quotations KPI
  const pendingQuotations = quotations.filter((q) => q.status === 'Pending');
  const pendingQuotationsValue = pendingQuotations.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);

  // 3. Pending Payments KPI
  const totalOutstanding = customers.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);
  const customersWithDues = customers.filter((c) => (c.outstandingAmount || 0) > 0);

  // 4. Today's Follow-ups KPI
  const todayFollowUps = followUps.filter((f) => f.scheduledDate <= todayStr);
  const todayPendingFollowUps = todayFollowUps.filter((f) => f.status === 'Pending');
  const todayCompletedFollowUps = todayFollowUps.filter((f) => f.status === 'Completed');

  // 5. Service Complaints KPI
  const openComplaints = complaints.filter(
    (c) => c.status === 'Open' || c.status === 'In Progress' || c.status === 'Awaiting Parts',
  );
  const criticalComplaints = complaints.filter(
    (c) => (c.status === 'Open' || c.status === 'In Progress') && c.priority === 'Critical',
  );

  // Pipeline Chart Data
  const pipelineData = [
    {
      name: 'Hot',
      count: enquiries.filter((e) => e.leadStatus === 'hot').length,
      value: enquiries.filter((e) => e.leadStatus === 'hot').reduce((s, e) => s + e.estimatedValue, 0),
      color: '#f43f5e',
    },
    {
      name: 'Warm',
      count: enquiries.filter((e) => e.leadStatus === 'warm').length,
      value: enquiries.filter((e) => e.leadStatus === 'warm').reduce((s, e) => s + e.estimatedValue, 0),
      color: '#f59e0b',
    },
    {
      name: 'Cold',
      count: enquiries.filter((e) => e.leadStatus === 'cold').length,
      value: enquiries.filter((e) => e.leadStatus === 'cold').reduce((s, e) => s + e.estimatedValue, 0),
      color: '#0284c7',
    },
    {
      name: 'Converted',
      count: enquiries.filter((e) => e.leadStatus === 'converted').length,
      value: enquiries.filter((e) => e.leadStatus === 'converted').reduce((s, e) => s + e.estimatedValue, 0),
      color: '#10b981',
    },
    {
      name: 'Lost',
      count: enquiries.filter((e) => e.leadStatus === 'lost').length,
      value: enquiries.filter((e) => e.leadStatus === 'lost').reduce((s, e) => s + e.estimatedValue, 0),
      color: '#71717a',
    },
  ];

  // Category Distribution Data
  const categoriesList = ['Workshop', 'Tyre Shop', 'Fitters', 'OEM', 'Other'] as const;
  const categoryColors = {
    Workshop: '#3b82f6',
    'Tyre Shop': '#a855f7',
    Fitters: '#14b8a6',
    OEM: '#6366f1',
    Other: '#64748b',
  };

  const categoryData = categoriesList
    .map((cat) => {
      const matched = customers.filter((c) => c.category === cat);
      return {
        name: cat,
        count: matched.length,
        outstanding: matched.reduce((s, c) => s + (c.outstandingAmount || 0), 0),
        color: categoryColors[cat],
      };
    })
    .filter((item) => item.name !== 'Other' || item.count > 0);

  // Top Outstanding Customers Data
  const topOutstanding = [...customers]
    .filter((c) => (c.outstandingAmount || 0) > 0)
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
    .slice(0, 5)
    .map((c) => ({
      name: c.firmName,
      outstanding: c.outstandingAmount,
      creditLimit: c.creditLimit,
    }));

  const handleCompleteFollowUp = (id: string) => {
    followUpService.complete(id, 'Follow-up completed via Dashboard');
    toast.success('Follow-up marked as completed!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Dashboard"
        description="Live operational command center for enquiries, quotes, customer accounts, and field service."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/enquiries?new=1')}
              className="gap-1.5 shadow-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Enquiry
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/customers?new=1')}
              className="gap-1.5 font-semibold"
            >
              <Building2 className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        }
      />

      {/* Attention Section */}
      <AttentionBanner
        todayPendingCount={todayPendingFollowUps.length}
        criticalComplaintsCount={criticalComplaints.length}
        pendingQuotesCount={pendingQuotations.length}
        pendingQuotesValue={pendingQuotationsValue}
        totalOutstanding={totalOutstanding}
        customersWithDuesCount={customersWithDues.length}
      />

      {/* 5 Core Feature KPI Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key Performance Metrics
          </h2>
          <span className="text-xs text-muted-foreground">Auto-updates in real time</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* 1. New Enquiries */}
          <KpiCard
            label="New Enquiries"
            value={enquiries.length}
            subtext={`${hotLeadsCount} Hot · ${formatCompactINR(totalPipelineValue)} pipe`}
            icon={Target}
            tone="primary"
            onClick={() => navigate('/enquiries')}
          />

          {/* 2. Pending Quotations */}
          <KpiCard
            label="Pending Quotes"
            value={pendingQuotations.length}
            subtext={formatINR(pendingQuotationsValue)}
            icon={FileText}
            tone="warning"
            onClick={() => navigate('/quotations')}
          />

          {/* 3. Pending Payments */}
          <KpiCard
            label="Pending Payments"
            value={formatCompactINR(totalOutstanding)}
            subtext={`${customersWithDues.length} accounts overdue`}
            icon={IndianRupee}
            tone="destructive"
            onClick={() => navigate('/payments')}
          />

          {/* 4. Today's Follow-ups */}
          <KpiCard
            label="Today's Follow-ups"
            value={todayPendingFollowUps.length}
            subtext={`${todayCompletedFollowUps.length} completed today`}
            icon={PhoneCall}
            tone="destructive"
            onClick={() => navigate('/follow-ups')}
          />

          {/* 5. Service Complaints */}
          <KpiCard
            label="Service Complaints"
            value={openComplaints.length}
            subtext={`${criticalComplaints.length} critical SLA priority`}
            icon={Wrench}
            tone="warning"
            onClick={() => navigate('/complaints')}
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </section>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Lead Status Breakdown */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Enquiry Pipeline Status</h3>
              <p className="text-xs text-muted-foreground">Hot / Warm / Cold / Converted / Lost</p>
            </div>
            <Link
              to="/enquiries"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View Pipeline <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="pt-2">
            <PipelineBarChart data={pipelineData} />
          </div>
        </Card>

        {/* Customer Category Breakdown */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Customer Segments</h3>
              <p className="text-xs text-muted-foreground">Workshop · Tyre Shop · Fitters · OEM</p>
            </div>
            <Link
              to="/customers"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Directory <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="pt-2">
            <CategoryPieChart data={categoryData} />
          </div>
        </Card>

        {/* Top Outstanding Customers */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Highest Outstanding Due</h3>
              <p className="text-xs text-muted-foreground">Accounts exceeding or near credit limit</p>
            </div>
            <Link
              to="/payments"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Collect <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="pt-2">
            <OutstandingBarChart data={topOutstanding} />
          </div>
        </Card>
      </div>

      {/* Two Column Action Area: Today's Follow-ups & Service Complaints */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Follow-ups Table */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Today's Scheduled Follow-ups
                </h3>
                <span className="text-xs text-muted-foreground">
                  {todayPendingFollowUps.length} pending calls & visits scheduled
                </span>
              </div>
            </div>
            <Link
              to="/follow-ups"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              All Follow-ups <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {todayFollowUps.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No follow-ups scheduled for today. Great job!
              </div>
            ) : (
              todayFollowUps.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {f.firmName}
                      </span>
                      <PriorityBadge priority={f.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{f.contactPerson}</span>
                      <span>·</span>
                      <span className="font-medium text-primary">{f.assignedPersonName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${f.mobile.replace(/\s+/g, '')}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-muted/60 text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                      title="Call"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${f.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${f.contactPerson}, regarding your requirement at ${f.firmName} - BizFlow`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </a>
                    {f.status === 'Pending' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteFollowUp(f.id)}
                        className="h-8 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Live Service Complaints */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-500" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Active Service Complaints
                </h3>
                <span className="text-xs text-muted-foreground">
                  Breakdown and calibration requests
                </span>
              </div>
            </div>
            <Link
              to="/complaints"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              All Tickets <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {openComplaints.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                All customer machines running smoothly. No active complaints.
              </div>
            ) : (
              openComplaints.slice(0, 4).map((c) => (
                <div key={c.id} className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {c.ticketNumber}
                      </span>
                      <span className="font-semibold text-sm text-foreground truncate">
                        {c.firmName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <PriorityBadge priority={c.priority} />
                      <ComplaintStatusBadge status={c.status} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <strong className="text-foreground">{c.equipmentModel}:</strong>{' '}
                    {c.issueDescription}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                    <span>
                      Engineer: <strong className="text-foreground">{c.assignedServicePersonName}</strong>
                    </span>
                    <span>
                      {c.city}, {c.district}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent High Priority Enquiries Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                High-Potential Enquiries
              </h3>
              <p className="text-xs text-muted-foreground">
                Customers ready for quotation finalization
              </p>
            </div>
          </div>
          <Link
            to="/enquiries"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            Manage All Enquiries <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Mobile Cards View */}
        <div className="space-y-2.5 md:hidden">
          {enquiries.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No enquiries logged yet. Tap <strong>New Enquiry</strong> to add one.
            </div>
          ) : (
            enquiries.slice(0, 5).map((e) => {
            const salesRep = staff.find((s) => s.id === e.assignedSalesPersonId);
            return (
              <div
                key={e.id}
                onClick={() => navigate(`/enquiries?id=${e.id}`)}
                className="rounded-xl border bg-muted/20 p-3 space-y-2 active:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-primary">
                    {e.enquiryNumber}
                  </span>
                  <LeadStatusBadge status={e.leadStatus} />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{e.firmName}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between mt-0.5">
                    <span>
                      {e.city}, {e.district}
                    </span>
                    <CustomerCategoryBadge category={e.category} />
                  </div>
                </div>
                <p className="text-xs text-foreground/90 line-clamp-2 bg-background/70 rounded p-2 border">
                  {e.requirement}
                </p>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-bold tabular-nums text-foreground">
                    {formatINR(e.estimatedValue)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Rep: <strong className="text-foreground">{salesRep?.name ?? 'Unassigned'}</strong>
                  </span>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-2.5">Enquiry No</th>
                <th className="p-2.5">Firm & Location</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Requirement</th>
                <th className="p-2.5">Est. Value</th>
                <th className="p-2.5">Lead Status</th>
                <th className="p-2.5">Sales Person</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No enquiries logged yet. Click <strong>New Enquiry</strong> to get started.
                  </td>
                </tr>
              ) : (
                enquiries.slice(0, 5).map((e) => {
                const salesRep = staff.find((s) => s.id === e.assignedSalesPersonId);
                return (
                  <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-2.5 font-mono font-medium text-primary">{e.enquiryNumber}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-foreground">{e.firmName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {e.city}, {e.district} · {e.mobile}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <CustomerCategoryBadge category={e.category} />
                    </td>
                    <td className="p-2.5 max-w-[200px] truncate" title={e.requirement}>
                      {e.requirement}
                    </td>
                    <td className="p-2.5 font-bold tabular-nums text-foreground">
                      {formatINR(e.estimatedValue)}
                    </td>
                    <td className="p-2.5">
                      <LeadStatusBadge status={e.leadStatus} />
                    </td>
                    <td className="p-2.5 font-medium">{salesRep?.name ?? 'Unassigned'}</td>
                    <td className="p-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/enquiries?id=${e.id}`)}
                        className="h-7 text-xs text-primary"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AttentionBanner({
  todayPendingCount,
  criticalComplaintsCount,
  pendingQuotesCount,
  pendingQuotesValue,
  totalOutstanding,
  customersWithDuesCount,
}: {
  todayPendingCount: number;
  criticalComplaintsCount: number;
  pendingQuotesCount: number;
  pendingQuotesValue: number;
  totalOutstanding: number;
  customersWithDuesCount: number;
}) {
  const flags: {
    tone: 'red' | 'yellow' | 'green';
    text: string;
    to: string;
  }[] = [];

  if (criticalComplaintsCount > 0) {
    flags.push({
      tone: 'red',
      text: `${criticalComplaintsCount} Critical Service Complaints SLA!`,
      to: '/complaints',
    });
  }

  if (todayPendingCount > 0) {
    flags.push({
      tone: 'red',
      text: `${todayPendingCount} Follow-ups due today`,
      to: '/follow-ups',
    });
  }

  if (totalOutstanding > 0) {
    flags.push({
      tone: 'yellow',
      text: `${formatCompactINR(totalOutstanding)} pending payments across ${customersWithDuesCount} customers`,
      to: '/payments',
    });
  }

  if (pendingQuotesCount > 0) {
    flags.push({
      tone: 'yellow',
      text: `${pendingQuotesCount} quotes pending (${formatCompactINR(pendingQuotesValue)})`,
      to: '/quotations',
    });
  }

  if (flags.length === 0) {
    flags.push({
      tone: 'green',
      text: 'All follow-ups and tickets are up to date!',
      to: '/',
    });
  }

  const toneClasses: Record<string, string> = {
    red: 'border-destructive/30 bg-destructive/10 text-destructive',
    yellow: 'border-warning/30 bg-warning/10 text-warning',
    green: 'border-success/30 bg-success/10 text-success',
  };

  return (
    <Card className="p-3.5 border-dashed">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Attention Items
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {flags.map((f, i) => (
            <Link
              key={i}
              to={f.to}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity hover:opacity-85 ${toneClasses[f.tone]}`}
            >
              {f.tone === 'green' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {f.text}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
