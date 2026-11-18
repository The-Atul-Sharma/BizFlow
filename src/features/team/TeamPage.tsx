import { useState, useEffect, type FormEvent } from 'react';
import {
  UserPlus,
  Phone,
  MessageSquare,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
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
import { useAuth } from '@/hooks/useAuth';
import { staffService } from '@/services/api';
import type { UserStaff } from '@/types';
import { toast } from 'sonner';

export default function TeamPage() {
  const { staff, customers, enquiries, complaints } = useCRMData();
  const { currentUser } = useAuth();
  const [filterRole, setFilterRole] = useState<'all' | 'Sales' | 'Service'>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserStaff | null>(null);

  const filteredStaff = staff.filter((s) => {
    if (filterRole === 'all') return true;
    return s.role === filterRole;
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (member: UserStaff) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleDelete = (member: UserStaff) => {
    if (member.id === currentUser?.id) {
      toast.error('Cannot delete your currently logged-in account.');
      return;
    }
    if (member.role === 'Admin' && staff.filter((s) => s.role === 'Admin').length <= 1) {
      toast.error('Cannot delete the last remaining Admin.');
      return;
    }
    if (confirm(`Remove team member "${member.name}"?`)) {
      staffService.delete(member.id);
      toast.success(`${member.name} removed from team.`);
    }
  };

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
        actions={
          <Button size="sm" onClick={handleOpenAdd} className="gap-1.5 shadow-xs font-semibold">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        }
      />

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
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
        {filteredStaff.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            No team members found in this category. Click <strong>Add Member</strong> to add one.
          </div>
        ) : (
          filteredStaff.map((member) => {
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

            const isSelf = member.id === currentUser?.id;

            const roleColors = {
              Sales: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
              Service: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
              Admin: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            };

            return (
              <Card
                key={member.id}
                className="p-4 space-y-4 hover:border-primary/40 transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-foreground truncate">{member.name}</h3>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          @{member.username}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span
                          className={`rounded-full border px-2 py-0.2 text-[10px] font-bold uppercase ${
                            roleColors[member.role] || roleColors.Sales
                          }`}
                        >
                          {member.role}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{member.zone}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(member)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Edit member"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(member)}
                      disabled={isSelf}
                      className="h-7 w-7 p-0 text-destructive disabled:opacity-40"
                      title="Delete member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
                    <div className="font-bold text-orange-500 mt-0.5">
                      {assignedComplaintsCount}
                    </div>
                  </div>
                </div>

                {/* Contact Info (Mobile only) */}
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <a
                    href={`tel:${member.mobile.replace(/\s+/g, '')}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{member.mobile}</span>
                  </a>
                  <a
                    href={`https://wa.me/${member.mobile.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                    title="WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </a>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Team Member Dialog */}
      <AddEditMemberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingMember}
        existingStaff={staff}
      />
    </div>
  );
}

function AddEditMemberDialog({
  open,
  onOpenChange,
  initialData,
  existingStaff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: UserStaff | null;
  existingStaff: UserStaff[];
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Sales' | 'Service' | 'Admin'>('Sales');
  const [mobile, setMobile] = useState('');
  const [zone, setZone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setMobile(initialData.mobile);
      setZone(initialData.zone);
      setUsername(initialData.username);
      setPassword('');
    } else {
      setName('');
      setRole('Sales');
      setMobile('');
      setZone('');
      setUsername('');
      setPassword('');
    }
    setShowPassword(false);
  }, [initialData, open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanMobile = mobile.trim();
    const cleanZone = zone.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

    if (!cleanName || !cleanMobile || !cleanUsername) {
      toast.error('Please fill in Full Name, Mobile Number, and Username.');
      return;
    }

    if (!initialData && password.trim().length < 4) {
      toast.error('Please enter a login password (minimum 4 characters).');
      return;
    }

    const duplicate = existingStaff.some(
      (s) => s.username.toLowerCase() === cleanUsername && s.id !== initialData?.id,
    );
    if (duplicate) {
      toast.error(`Username @${cleanUsername} is already taken.`);
      return;
    }

    if (initialData) {
      staffService.update(initialData.id, {
        name: cleanName,
        role,
        mobile: cleanMobile,
        zone: cleanZone || 'General Territory',
        username: cleanUsername,
        password: password.trim() ? password.trim() : initialData.password,
      });
      toast.success(`${cleanName} updated successfully!`);
    } else {
      staffService.create({
        name: cleanName,
        role,
        mobile: cleanMobile,
        zone: cleanZone || 'General Territory',
        username: cleanUsername,
        password: password.trim(),
        active: true,
      });
      toast.success(`${cleanName} added to ${role} team!`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {initialData ? 'Edit Team Member' : 'Add Sales / Service Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Full Name *</Label>
            <Input
              placeholder="e.g. Suresh Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Role *</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales Executive</SelectItem>
                  <SelectItem value="Service">Service Engineer</SelectItem>
                  <SelectItem value="Admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mobile Number *</Label>
              <Input
                placeholder="+91 98..."
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Operating Zone / Territory</Label>
            <Input
              placeholder="e.g. West Zone (Pune & Surat)"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Username (Login ID) *</Label>
              <Input
                placeholder="e.g. suresh"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                required
                className="h-9 text-xs font-mono lowercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                {initialData ? 'New Password (Optional)' : 'Login Password *'}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={initialData ? 'Keep existing' : 'Min 4 chars'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!initialData}
                  className="h-9 text-xs pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
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
              {initialData ? 'Save Changes' : 'Add Team Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
