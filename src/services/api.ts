import { getDatabase, saveDatabase } from './db';
import { supabaseSync } from './supabaseSync';
import type {
  Customer,
  Enquiry,
  Quotation,
  FollowUp,
  ServiceComplaint,
  PaymentReceipt,
  UserStaff,
  LeadStatus,
  QuotationStatus,
  CompanySettings,
} from '@/types';

function nextSequenceNumber(existingNumbers: string[], prefix: string, startFrom = 1): string {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  let maxSeq = startFrom - 1;
  for (const num of existingNumbers) {
    if (num.startsWith(fullPrefix)) {
      const parsed = parseInt(num.slice(fullPrefix.length), 10);
      if (!isNaN(parsed) && parsed > maxSeq) maxSeq = parsed;
    }
  }
  return `${fullPrefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export const customerService = {
  list(): Customer[] {
    return getDatabase().customers;
  },

  get(id: string): Customer | undefined {
    return getDatabase().customers.find((c) => c.id === id);
  },

  create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const db = getDatabase();
    const now = new Date().toISOString();
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    db.customers.unshift(newCust);
    saveDatabase(db);
    supabaseSync.upsertCustomer(newCust);
    return newCust;
  },

  update(id: string, updates: Partial<Customer>): Customer | null {
    const db = getDatabase();
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated: Customer = {
      ...db.customers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.customers[idx] = updated;
    supabaseSync.upsertCustomer(updated);

    // Sync firmName/contact to related records if contact info changes
    if (updates.firmName || updates.mobile || updates.contactPerson) {
      db.enquiries = db.enquiries.map((e) => {
        if (e.customerId !== id) return e;
        const next = {
          ...e,
          firmName: updates.firmName ?? e.firmName,
          contactPerson: updates.contactPerson ?? e.contactPerson,
          mobile: updates.mobile ?? e.mobile,
        };
        supabaseSync.upsertEnquiry(next);
        return next;
      });
      db.followUps = db.followUps.map((f) => {
        if (f.customerId !== id) return f;
        const next = {
          ...f,
          firmName: updates.firmName ?? f.firmName,
          contactPerson: updates.contactPerson ?? f.contactPerson,
          mobile: updates.mobile ?? f.mobile,
        };
        supabaseSync.upsertFollowUp(next);
        return next;
      });
      db.complaints = db.complaints.map((c) => {
        if (c.customerId !== id) return c;
        const next = {
          ...c,
          firmName: updates.firmName ?? c.firmName,
          contactPerson: updates.contactPerson ?? c.contactPerson,
          mobile: updates.mobile ?? c.mobile,
        };
        supabaseSync.upsertComplaint(next);
        return next;
      });
    }

    saveDatabase(db);
    return updated;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const initLen = db.customers.length;
    db.customers = db.customers.filter((c) => c.id !== id);
    if (db.customers.length !== initLen) {
      saveDatabase(db);
      supabaseSync.deleteCustomer(id);
      return true;
    }
    return false;
  },
};

export const enquiryService = {
  list(): Enquiry[] {
    return getDatabase().enquiries;
  },

  get(id: string): Enquiry | undefined {
    return getDatabase().enquiries.find((e) => e.id === id);
  },

  create(data: Omit<Enquiry, 'id' | 'enquiryNumber' | 'createdAt' | 'updatedAt'>): Enquiry {
    const db = getDatabase();
    const now = new Date().toISOString();
    const enquiryNumber = nextSequenceNumber(
      db.enquiries.map((e) => e.enquiryNumber),
      'ENQ',
      1,
    );
    const newEnq: Enquiry = {
      ...data,
      id: `enq-${Date.now()}`,
      enquiryNumber,
      createdAt: now,
      updatedAt: now,
    };
    db.enquiries.unshift(newEnq);
    supabaseSync.upsertEnquiry(newEnq);

    if (data.nextFollowUpDate) {
      const staffMember = db.staff.find((s) => s.id === data.assignedSalesPersonId);
      const newFollowUp: FollowUp = {
        id: `fol-${Date.now() + 1}`,
        title: `Follow-up for ${newEnq.enquiryNumber}`,
        type: 'Sales',
        customerId: data.customerId,
        enquiryId: newEnq.id,
        firmName: data.firmName,
        contactPerson: data.contactPerson,
        mobile: data.mobile,
        scheduledDate: data.nextFollowUpDate,
        assignedPersonId: data.assignedSalesPersonId,
        assignedPersonName: staffMember?.name ?? 'Sales Team',
        status: 'Pending',
        priority: data.priority,
        notes: data.notes || `Discussion regarding ${data.requirement}`,
        createdAt: now,
        updatedAt: now,
      };
      db.followUps.unshift(newFollowUp);
      supabaseSync.upsertFollowUp(newFollowUp);
    }

    saveDatabase(db);
    return newEnq;
  },

  update(id: string, updates: Partial<Enquiry>): Enquiry | null {
    const db = getDatabase();
    const idx = db.enquiries.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const updated: Enquiry = {
      ...db.enquiries[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.enquiries[idx] = updated;
    supabaseSync.upsertEnquiry(updated);

    if (updated.customerId && updates.leadStatus) {
      const cIdx = db.customers.findIndex((c) => c.id === updated.customerId);
      if (cIdx !== -1) {
        db.customers[cIdx] = {
          ...db.customers[cIdx],
          leadStatus: updates.leadStatus,
          updatedAt: new Date().toISOString(),
        };
        supabaseSync.upsertCustomer(db.customers[cIdx]);
      }
    }

    saveDatabase(db);
    return updated;
  },

  updateStatus(id: string, status: LeadStatus): Enquiry | null {
    return this.update(id, { leadStatus: status });
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const initialLen = db.enquiries.length;
    db.enquiries = db.enquiries.filter((e) => e.id !== id);
    if (db.enquiries.length !== initialLen) {
      saveDatabase(db);
      supabaseSync.deleteEnquiry(id);
      return true;
    }
    return false;
  },
};

export const quotationService = {
  list(): Quotation[] {
    return getDatabase().quotations;
  },

  get(id: string): Quotation | undefined {
    return getDatabase().quotations.find((q) => q.id === id);
  },

  create(data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Quotation {
    const db = getDatabase();
    const now = new Date().toISOString();
    const quotationNumber = nextSequenceNumber(
      db.quotations.map((q) => q.quotationNumber),
      'QUO',
      1,
    );
    const newQuo: Quotation = {
      ...data,
      id: `quo-${Date.now()}`,
      quotationNumber,
      createdAt: now,
      updatedAt: now,
    };
    db.quotations.unshift(newQuo);
    saveDatabase(db);
    supabaseSync.upsertQuotation(newQuo);
    return newQuo;
  },

  update(id: string, updates: Partial<Quotation>): Quotation | null {
    const db = getDatabase();
    const idx = db.quotations.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    const updated: Quotation = {
      ...db.quotations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.quotations[idx] = updated;
    saveDatabase(db);
    supabaseSync.upsertQuotation(updated);
    return updated;
  },

  updateStatus(id: string, status: QuotationStatus): Quotation | null {
    return this.update(id, { status });
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const initialLen = db.quotations.length;
    db.quotations = db.quotations.filter((q) => q.id !== id);
    if (db.quotations.length !== initialLen) {
      saveDatabase(db);
      supabaseSync.deleteQuotation(id);
      return true;
    }
    return false;
  },
};

export const followUpService = {
  list(): FollowUp[] {
    return getDatabase().followUps;
  },

  create(data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>): FollowUp {
    const db = getDatabase();
    const now = new Date().toISOString();
    const newFol: FollowUp = {
      ...data,
      id: `fol-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    db.followUps.unshift(newFol);
    saveDatabase(db);
    supabaseSync.upsertFollowUp(newFol);
    return newFol;
  },

  update(id: string, updates: Partial<FollowUp>): FollowUp | null {
    const db = getDatabase();
    const idx = db.followUps.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const updated: FollowUp = {
      ...db.followUps[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.followUps[idx] = updated;
    saveDatabase(db);
    supabaseSync.upsertFollowUp(updated);
    return updated;
  },

  complete(id: string, outcome: string, notes?: string): FollowUp | null {
    const db = getDatabase();
    const idx = db.followUps.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const current = db.followUps[idx];
    const updated: FollowUp = {
      ...current,
      status: 'Completed',
      outcome,
      notes: notes ? `${current.notes ? `${current.notes} | ` : ''}Note: ${notes}` : current.notes,
      updatedAt: new Date().toISOString(),
    };
    db.followUps[idx] = updated;
    saveDatabase(db);
    supabaseSync.upsertFollowUp(updated);
    return updated;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const initialLen = db.followUps.length;
    db.followUps = db.followUps.filter((f) => f.id !== id);
    if (db.followUps.length !== initialLen) {
      saveDatabase(db);
      supabaseSync.deleteFollowUp(id);
      return true;
    }
    return false;
  },
};

export const complaintService = {
  list(): ServiceComplaint[] {
    return getDatabase().complaints;
  },

  get(id: string): ServiceComplaint | undefined {
    return getDatabase().complaints.find((c) => c.id === id);
  },

  create(
    data: Omit<ServiceComplaint, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>,
  ): ServiceComplaint {
    const db = getDatabase();
    const now = new Date().toISOString();
    const ticketNumber = nextSequenceNumber(
      db.complaints.map((c) => c.ticketNumber),
      'CMP',
      1,
    );
    const newCmp: ServiceComplaint = {
      ...data,
      id: `cmp-${Date.now()}`,
      ticketNumber,
      createdAt: now,
      updatedAt: now,
    };
    db.complaints.unshift(newCmp);
    saveDatabase(db);
    supabaseSync.upsertComplaint(newCmp);
    return newCmp;
  },

  update(id: string, updates: Partial<ServiceComplaint>): ServiceComplaint | null {
    const db = getDatabase();
    const idx = db.complaints.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated: ServiceComplaint = {
      ...db.complaints[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.complaints[idx] = updated;
    saveDatabase(db);
    supabaseSync.upsertComplaint(updated);
    return updated;
  },

  resolve(id: string, resolutionNotes: string): ServiceComplaint | null {
    const now = new Date().toISOString();
    return this.update(id, {
      status: 'Resolved',
      resolvedDate: now,
      resolutionNotes,
    });
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const initialLen = db.complaints.length;
    db.complaints = db.complaints.filter((c) => c.id !== id);
    if (db.complaints.length !== initialLen) {
      saveDatabase(db);
      supabaseSync.deleteComplaint(id);
      return true;
    }
    return false;
  },
};

export const paymentService = {
  list(): PaymentReceipt[] {
    return getDatabase().payments;
  },

  recordPayment(data: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'createdAt'>): PaymentReceipt {
    const db = getDatabase();
    const now = new Date().toISOString();
    const receiptNumber = nextSequenceNumber(
      db.payments.map((p) => p.receiptNumber),
      'RCT',
      1,
    );
    const receipt: PaymentReceipt = {
      ...data,
      id: `pay-${Date.now()}`,
      receiptNumber,
      createdAt: now,
    };
    db.payments.unshift(receipt);
    supabaseSync.insertPayment(receipt);

    const custIdx = db.customers.findIndex((c) => c.id === data.customerId);
    if (custIdx !== -1) {
      const currentDue = db.customers[custIdx].outstandingAmount || 0;
      db.customers[custIdx] = {
        ...db.customers[custIdx],
        outstandingAmount: Math.max(0, currentDue - data.amount),
        updatedAt: now,
      };
      supabaseSync.upsertCustomer(db.customers[custIdx]);
    }

    saveDatabase(db);
    return receipt;
  },
};

export const staffService = {
  list(): UserStaff[] {
    return getDatabase().staff;
  },

  get(id: string): UserStaff | undefined {
    return getDatabase().staff.find((s) => s.id === id);
  },

  create(data: Omit<UserStaff, 'id' | 'createdAt'>): UserStaff {
    const db = getDatabase();
    const newUser: UserStaff = {
      ...data,
      id: `st-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.staff.push(newUser);
    saveDatabase(db);
    supabaseSync.upsertStaff(newUser);
    return newUser;
  },

  update(id: string, updates: Partial<UserStaff>): UserStaff | null {
    const db = getDatabase();
    const idx = db.staff.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated: UserStaff = {
      ...db.staff[idx],
      ...updates,
    };
    db.staff[idx] = updated;
    saveDatabase(db);
    supabaseSync.upsertStaff(updated);
    return updated;
  },

  updatePassword(id: string, newPassword: string): boolean {
    return !!this.update(id, { password: newPassword });
  },

  toggleActive(id: string): boolean {
    const user = this.get(id);
    if (!user) return false;
    this.update(id, { active: !user.active });
    return true;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const initLen = db.staff.length;
    db.staff = db.staff.filter((s) => s.id !== id);
    if (db.staff.length !== initLen) {
      saveDatabase(db);
      supabaseSync.deleteStaff(id);
      return true;
    }
    return false;
  },

  authenticate(username: string, password: string): UserStaff | null {
    const cleanUser = username.trim().toLowerCase();
    const found = getDatabase().staff.find(
      (s) => s.username.toLowerCase() === cleanUser && s.password === password,
    );
    if (found && found.active) {
      return found;
    }
    return null;
  },

  getSalesStaff(): UserStaff[] {
    return getDatabase().staff.filter((s) => s.role === 'Sales' || s.role === 'Admin');
  },

  getServiceStaff(): UserStaff[] {
    return getDatabase().staff.filter((s) => s.role === 'Service');
  },
};

export const settingsService = {
  get(): CompanySettings | undefined {
    return getDatabase().settings;
  },

  update(updates: Partial<CompanySettings>): CompanySettings {
    const db = getDatabase();
    const next: CompanySettings = {
      companyName: db.settings?.companyName ?? 'BizFlow',
      tagline: db.settings?.tagline ?? '',
      gstin: db.settings?.gstin ?? '',
      phone: db.settings?.phone ?? '',
      email: db.settings?.email ?? '',
      address: db.settings?.address ?? '',
      defaultCreditDays: db.settings?.defaultCreditDays ?? 30,
      defaultGstPercent: db.settings?.defaultGstPercent ?? 18,
      ...updates,
    };
    db.settings = next;
    saveDatabase(db);
    supabaseSync.upsertSettings(next);
    return next;
  },
};
