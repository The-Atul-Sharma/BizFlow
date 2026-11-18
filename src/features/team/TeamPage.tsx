import { useState } from 'react';
import {
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Target,
  Wrench,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { useCRMData } from '@/hooks/useCRMData';

export default function TeamPage() {
  const { staff, customers, enquiries, complaints } = useCRMData();
  const [filterRole, setFilterRole] = useState<'all' | 'Sales' | 'Service'>('all');

  const filteredStaff = staff.filter(
    (s) => filterRole === 'all' || s.role === filterRole || s.role === 'Manager',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Service Team Assignment"
        description="Territory sales executives and certified service engineers handling workshop installations and support."
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {staff.length} Team Members
          </span>
        }
      />

      {/* Role Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setFilterRole('all')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
            filterRole === 'all'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          All Members ({staff.length})
        </button>
        <button
          onClick={() => setFilterRole('Sales')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
            filterRole === 'Sales'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Sales Executives ({staff.filter((s) => s.role === 'Sales').length})
        </button>
        <button
          onClick={() => setFilterRole('Service')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
            filterRole === 'Service'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Service Engineers ({staff.filter((s) => s.role === 'Service').length})
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => {
          const assignedCustomersCount = customers.filter(
            (c) =>
              c.assignedSalesPersonId === member.id ||
              c.assignedServicePersonId === member.id,
          ).length;

          const assignedLeadsCount = enquiries.filter(
            (e) => e.assignedSalesPersonId === member.id,
          ).length;

          const assignedComplaintsCount = complaints.filter(
            (c) => c.assignedServicePersonId === member.id,
          ).length;

          const roleColors = {
            Sales: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            Service: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
            Manager: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
            Admin: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          };

          return (
            <Card key={member.id} className="p-4 space-y-4 hover:border-primary/40 transition-colors shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{member.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`rounded-full border px-2 py-0.2 text-[10px] font-bold uppercase ${
                          roleColors[member.role] || roleColors.Sales
                        }`}
                      >
                        {member.role}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {member.zone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Stats */}
              <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/30 border text-center text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground">Accounts</div>
                  <div className="font-bold text-foreground mt-0.5">{assignedCustomersCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Active Leads</div>
                  <div className="font-bold text-primary mt-0.5">{assignedLeadsCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Service Tickets</div>
                  <div className="font-bold text-orange-500 mt-0.5">{assignedComplaintsCount}</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 pt-1 border-t text-xs">
                <a
                  href={`tel:${member.mobile.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{member.mobile}</span>
                </a>
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{member.email}</span>
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
