import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Building2,
  Save,
  CheckCircle2,
  XCircle,
  LogOut,
  Download,
  Upload,
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
import { staffService, settingsService } from '@/services/api';
import { getDatabase, saveDatabase } from '@/services/db';
import type { UserStaff, CompanySettings } from '@/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { staff } = useCRMData();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'users' | 'company' | 'backup'>('users');

  // Search in users
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // User Add/Edit Dialog
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserStaff | null>(null);

  // Password Change Dialog
  const [passwordUser, setPasswordUser] = useState<UserStaff | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Company Settings
  const initialSettings = settingsService.get() || {
    companyName: 'BizFlow Equipment Pvt Ltd',
    tagline: 'Automotive Garage Equipment & Field Operations',
    gstin: '27AAACA9001R1Z8',
    phone: '+91 20 2567 8900',
    email: 'support@bizflow.com',
    address: 'Auto Towers, Plot 14, MIDC Bhosari, Pune, Maharashtra 411026',
    defaultCreditDays: 30,
    defaultGstPercent: 18,
  };
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialSettings);

  const filteredUsers = useMemo(() => {
    return staff.filter((u) => {
      const q = searchUser.toLowerCase();
      const matchSearch =
        !searchUser ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.mobile.includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false);

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staff, searchUser, roleFilter]);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleActive = (user: UserStaff) => {
    if (user.id === currentUser?.id && user.active) {
      toast.error('You cannot deactivate your own logged-in account!');
      return;
    }
    staffService.toggleActive(user.id);
    toast.success(`User ${user.username} access ${user.active ? 'disabled' : 'enabled'}`);
  };

  const handleDeleteUser = (user: UserStaff) => {
    if (user.id === currentUser?.id) {
      toast.error('Cannot delete the currently logged-in account!');
      return;
    }
    if (user.role === 'Admin' && staff.filter((s) => s.role === 'Admin').length <= 1) {
      toast.error('Cannot delete the last remaining Admin!');
      return;
    }
    if (confirm(`Are you sure you want to permanently remove user @${user.username}?`)) {
      staffService.delete(user.id);
      toast.success(`User @${user.username} removed.`);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;
    if (!newPassword.trim() || newPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    staffService.updatePassword(passwordUser.id, newPassword.trim());
    toast.success(`Password for @${passwordUser.username} updated successfully!`);
    setPasswordUser(null);
    setNewPassword('');
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.update(companySettings);
    toast.success('Company settings saved successfully!');
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getDatabase(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BizFlow_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Database backup downloaded!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.customers) && Array.isArray(json.staff)) {
          saveDatabase(json);
          toast.success('Database restored successfully from backup!');
        } else {
          toast.error('Invalid backup file format');
        }
      } catch (err) {
        toast.error('Failed to parse backup JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Access Control"
        description="Manage system users, login credentials (username/password), team roles, and organization parameters."
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {staff.length} Active Accounts
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingUser(null);
              setIsUserDialogOpen(true);
            }}
            className="gap-1.5 shadow-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add User Access
          </Button>
        }
      />

      {/* Current Logged-in User Profile Banner */}
      {currentUser && (
        <Card className="p-4 bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {currentUser.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">{currentUser.name}</h3>
                <span className="rounded bg-primary/10 text-primary px-2 py-0.2 text-[10px] font-bold uppercase">
                  {currentUser.role}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  @{currentUser.username}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current Active Session · {currentUser.zone} · {currentUser.mobile}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                logout();
                toast.success('Signed out successfully');
                navigate('/login', { replace: true });
              }}
              className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          User Access & Passwords ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === 'company'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Organization & GST Settings
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
            activeTab === 'backup'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Download className="h-4 w-4" />
          Backup & Restore
        </button>
      </div>

      {/* TAB 1: USERS & ACCESS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Search user name, username, mobile, email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Sales">Sales Executive</SelectItem>
                  <SelectItem value="Service">Service Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Mobile User Access Cards */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((user) => {
              const isVisible = !!showPasswordMap[user.id];
              const isSelf = user.id === currentUser?.id;
              const roleStyles = {
                Admin: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                Sales: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                Service: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
              };

              return (
                <Card key={user.id} className="p-3.5 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground truncate">
                          {user.name}
                        </span>
                        {isSelf && (
                          <span className="rounded bg-primary/20 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-semibold text-primary mt-0.5">
                        @{user.username}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {user.mobile} · {user.zone}
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                        roleStyles[user.role] || roleStyles.Sales
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  {/* Password Row */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Password:</span>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {isVisible ? user.password || '••••••' : '••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title={isVisible ? 'Hide Password' : 'Show Password'}
                      >
                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPasswordUser(user);
                          setNewPassword('');
                        }}
                        className="h-7 w-7 p-0 text-primary"
                        title="Change Password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between pt-1.5 border-t">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        user.active
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}
                    >
                      {user.active ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Revoked
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingUser(user);
                          setIsUserDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user)}
                        disabled={isSelf}
                        className="h-8 w-8 p-0 text-destructive disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop User Table with Passwords */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Name & Contact</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Assigned Zone</th>
                    <th className="p-3">Password / Access Key</th>
                    <th className="p-3">Access Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((user) => {
                    const isVisible = !!showPasswordMap[user.id];
                    const isSelf = user.id === currentUser?.id;

                    const roleStyles = {
                      Admin: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                      Sales: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                      Service: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
                    };

                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {user.name}
                            {isSelf && (
                              <span className="rounded bg-primary/20 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {user.mobile}{user.email ? ` · ${user.email}` : ''}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-primary">
                          @{user.username}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                              roleStyles[user.role] || roleStyles.Sales
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[180px] truncate">
                          {user.zone}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-foreground bg-muted/60 px-2 py-1 rounded border min-w-20 inline-block text-center">
                              {isVisible ? user.password || '••••••' : '••••••••'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPasswordUser(user);
                                setNewPassword('');
                              }}
                              className="h-7 w-7 p-0 text-primary"
                              title="Change Password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${
                              user.active
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}
                          >
                            {user.active ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" /> Revoked
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingUser(user);
                                setIsUserDialogOpen(true);
                              }}
                              className="h-7 w-7 p-0"
                              title="Edit user"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user)}
                              disabled={isSelf}
                              className="h-7 w-7 p-0 text-destructive disabled:opacity-40"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      )}

      {/* TAB 2: ORGANIZATION & GST SETTINGS */}
      {activeTab === 'company' && (
        <Card className="p-5 max-w-2xl">
          <form onSubmit={handleSaveCompanySettings} className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Organization & Billing Profile</h3>
                <p className="text-xs text-muted-foreground">
                  These details appear on generated Quotations, Invoices, and Payment Receipts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Company Name *</Label>
                <Input
                  value={companySettings.companyName}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, companyName: e.target.value })
                  }
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">GSTIN *</Label>
                <Input
                  value={companySettings.gstin}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, gstin: e.target.value.toUpperCase() })
                  }
                  required
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Support Phone</Label>
                <Input
                  value={companySettings.phone}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, phone: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Registered Address</Label>
                <Input
                  value={companySettings.address}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, address: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Default Credit Period (Days)</Label>
                <Input
                  type="number"
                  value={companySettings.defaultCreditDays}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      defaultCreditDays: parseInt(e.target.value, 10) || 30,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Standard Equipment GST (%)</Label>
                <Input
                  type="number"
                  value={companySettings.defaultGstPercent}
                  onChange={(e) =>
                    setCompanySettings({
                      ...companySettings,
                      defaultGstPercent: parseInt(e.target.value, 10) || 18,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end">
              <Button type="submit" size="sm" className="gap-1.5 font-semibold">
                <Save className="h-4 w-4" />
                Save Organization Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 4: BACKUP & DATA RESET */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Download Database Backup</h3>
            <p className="text-xs text-muted-foreground">
              Save a complete JSON snapshot containing all customers, quotations, enquiries, follow-ups, complaints, and user accounts.
            </p>
            <Button size="sm" variant="outline" onClick={handleExportBackup} className="gap-1.5">
              <Download className="h-4 w-4 text-primary" />
              Download JSON Backup
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Restore Database from Backup</h3>
            <p className="text-xs text-muted-foreground">
              Upload a previously exported JSON backup file to restore all records.
            </p>
            <label className="inline-flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-muted transition-colors">
              <Upload className="h-4 w-4 text-emerald-600" />
              Choose Backup File (.json)
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </Card>
        </div>
      )}

      {/* ADD / EDIT USER DIALOG */}
      <AddEditUserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        initialData={editingUser}
        existingUsers={staff}
      />

      {/* CHANGE PASSWORD DIALOG */}
      <Dialog open={!!passwordUser} onOpenChange={() => setPasswordUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password for @{passwordUser?.username}
            </DialogTitle>
          </DialogHeader>

          {passwordUser && (
            <form onSubmit={handleSavePassword} className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1">
                <div>
                  Name: <strong>{passwordUser.name}</strong> ({passwordUser.role})
                </div>
                <div>
                  Username: <strong className="font-mono">@{passwordUser.username}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">New Password *</Label>
                <Input
                  type="text"
                  placeholder="Enter new password (min 4 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-semibold shadow-xs">
                  Update Password
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
// ADD / EDIT USER MODAL
// ----------------------------------------------------
function AddEditUserDialog({
  open,
  onOpenChange,
  initialData,
  existingUsers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UserStaff | null;
  existingUsers: UserStaff[];
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'Sales' | 'Service' | 'Admin'>('Sales');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('');

  useMemo(() => {
    if (initialData) {
      setName(initialData.name);
      setUsername(initialData.username);
      setPassword(initialData.password || '');
      setRole(initialData.role);
      setMobile(initialData.mobile);
      setEmail(initialData.email || '');
      setZone(initialData.zone);
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setRole('Sales');
      setMobile('');
      setEmail('');
      setZone('West Zone (Maharashtra)');
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    if (!name.trim() || !cleanUser || !mobile.trim()) {
      toast.error('Please enter Name, Username and Mobile');
      return;
    }

    if (!initialData && (!password || password.length < 4)) {
      toast.error('Please enter a password with at least 4 characters');
      return;
    }

    // Check duplicate username
    const exists = existingUsers.some(
      (u) => u.username.toLowerCase() === cleanUser && u.id !== initialData?.id,
    );
    if (exists) {
      toast.error(`Username @${cleanUser} is already taken!`);
      return;
    }

    if (initialData) {
      staffService.update(initialData.id, {
        name: name.trim(),
        username: cleanUser,
        password: password ? password.trim() : initialData.password,
        role,
        mobile: mobile.trim(),
        email: email.trim() || `${cleanUser}@bizflow.com`,
        zone: zone.trim(),
      });
      toast.success(`User @${cleanUser} updated!`);
    } else {
      staffService.create({
        name: name.trim(),
        username: cleanUser,
        password: password.trim(),
        role,
        mobile: mobile.trim(),
        email: email.trim() || `${cleanUser}@bizflow.com`,
        zone: zone.trim(),
        active: true,
      });
      toast.success(`New user @${cleanUser} created with role ${role}!`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {initialData ? 'Edit User Profile' : 'Add New User & Give Access'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Full Name *</Label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Username (Login ID) *</Label>
              <Input
                placeholder="e.g. rahul.s"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                required
                className="h-9 text-xs font-mono lowercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Role *</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
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
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              {initialData ? 'Password (Leave blank to keep existing)' : 'Login Password *'}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={initialData ? 'Existing password kept' : 'Enter login password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!initialData}
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="email@bizflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Operating Zone / Territory</Label>
            <Input
              placeholder="e.g. West Zone (Pune, Nashik, Surat)"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
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
              {initialData ? 'Save Changes' : 'Create User & Grant Access'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
