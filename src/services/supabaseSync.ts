import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  CRMDatabase,
  Customer,
  Enquiry,
  Quotation,
  FollowUp,
  ServiceComplaint,
  PaymentReceipt,
  UserStaff,
  CompanySettings,
} from '@/types';
import { toast } from 'sonner';

// ----------------- Row Mappers (DB snake_case <-> App camelCase) -----------------

function toCustomerRow(c: Customer) {
  return {
    id: c.id,
    firm_name: c.firmName,
    contact_person: c.contactPerson,
    mobile: c.mobile,
    alternate_mobile: c.alternateMobile ?? null,
    email: c.email ?? null,
    category: c.category,
    address: c.address ?? '',
    city: c.city ?? '',
    district: c.district ?? '',
    state: c.state ?? '',
    pincode: c.pincode ?? '',
    gstin: c.gstin ?? '',
    gst_status: c.gstStatus,
    assigned_sales_person_id: c.assignedSalesPersonId ?? '',
    assigned_service_person_id: c.assignedServicePersonId ?? '',
    lead_status: c.leadStatus,
    outstanding_amount: Number(c.outstandingAmount) || 0,
    credit_limit: Number(c.creditLimit) || 0,
    payment_terms_days: Number(c.paymentTermsDays) || 30,
    notes: c.notes ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function fromCustomerRow(r: any): Customer {
  return {
    id: r.id,
    firmName: r.firm_name,
    contactPerson: r.contact_person,
    mobile: r.mobile,
    alternateMobile: r.alternate_mobile ?? undefined,
    email: r.email ?? undefined,
    category: r.category,
    address: r.address ?? '',
    city: r.city ?? '',
    district: r.district ?? '',
    state: r.state ?? '',
    pincode: r.pincode ?? '',
    gstin: r.gstin ?? '',
    gstStatus: r.gst_status ?? 'Active',
    assignedSalesPersonId: r.assigned_sales_person_id ?? '',
    assignedServicePersonId: r.assigned_service_person_id ?? '',
    leadStatus: r.lead_status ?? 'warm',
    outstandingAmount: Number(r.outstanding_amount) || 0,
    creditLimit: Number(r.credit_limit) || 0,
    paymentTermsDays: Number(r.payment_terms_days) || 30,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toEnquiryRow(e: Enquiry) {
  return {
    id: e.id,
    enquiry_number: e.enquiryNumber,
    customer_id: e.customerId ?? null,
    firm_name: e.firmName,
    contact_person: e.contactPerson ?? '',
    mobile: e.mobile,
    city: e.city ?? '',
    district: e.district ?? '',
    category: e.category,
    requirement: e.requirement,
    estimated_value: Number(e.estimatedValue) || 0,
    lead_status: e.leadStatus,
    priority: e.priority,
    assigned_sales_person_id: e.assignedSalesPersonId ?? '',
    next_follow_up_date: e.nextFollowUpDate ?? '',
    source: e.source,
    notes: e.notes ?? null,
    quotation_id: e.quotationId ?? null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

function fromEnquiryRow(r: any): Enquiry {
  return {
    id: r.id,
    enquiryNumber: r.enquiry_number,
    customerId: r.customer_id ?? undefined,
    firmName: r.firm_name,
    contactPerson: r.contact_person ?? '',
    mobile: r.mobile,
    city: r.city ?? '',
    district: r.district ?? '',
    category: r.category,
    requirement: r.requirement,
    estimatedValue: Number(r.estimated_value) || 0,
    leadStatus: r.lead_status ?? 'warm',
    priority: r.priority ?? 'Medium',
    assignedSalesPersonId: r.assigned_sales_person_id ?? '',
    nextFollowUpDate: r.next_follow_up_date ?? '',
    source: r.source ?? 'Direct Visit',
    notes: r.notes ?? undefined,
    quotationId: r.quotation_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toQuotationRow(q: Quotation) {
  return {
    id: q.id,
    quotation_number: q.quotationNumber,
    customer_id: q.customerId ?? '',
    firm_name: q.firmName,
    contact_person: q.contactPerson ?? '',
    mobile: q.mobile ?? '',
    gstin: q.gstin ?? '',
    status: q.status,
    items: q.items ?? [],
    subtotal: Number(q.subtotal) || 0,
    tax_amount: Number(q.taxAmount) || 0,
    grand_total: Number(q.grandTotal) || 0,
    assigned_sales_person_id: q.assignedSalesPersonId ?? '',
    valid_until: q.validUntil ?? '',
    notes: q.notes ?? null,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  };
}

function fromQuotationRow(r: any): Quotation {
  return {
    id: r.id,
    quotationNumber: r.quotation_number,
    customerId: r.customer_id ?? '',
    firmName: r.firm_name,
    contactPerson: r.contact_person ?? '',
    mobile: r.mobile ?? '',
    gstin: r.gstin ?? '',
    status: r.status ?? 'Pending',
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: Number(r.subtotal) || 0,
    taxAmount: Number(r.tax_amount) || 0,
    grandTotal: Number(r.grand_total) || 0,
    assignedSalesPersonId: r.assigned_sales_person_id ?? '',
    validUntil: r.valid_until ?? '',
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toFollowUpRow(f: FollowUp) {
  return {
    id: f.id,
    title: f.title,
    type: f.type,
    customer_id: f.customerId ?? null,
    enquiry_id: f.enquiryId ?? null,
    firm_name: f.firmName,
    contact_person: f.contactPerson ?? '',
    mobile: f.mobile,
    scheduled_date: f.scheduledDate,
    scheduled_time: f.scheduledTime ?? null,
    assigned_person_id: f.assignedPersonId ?? '',
    assigned_person_name: f.assignedPersonName ?? '',
    status: f.status,
    priority: f.priority,
    notes: f.notes ?? '',
    outcome: f.outcome ?? null,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  };
}

function fromFollowUpRow(r: any): FollowUp {
  return {
    id: r.id,
    title: r.title,
    type: r.type ?? 'Sales',
    customerId: r.customer_id ?? undefined,
    enquiryId: r.enquiry_id ?? undefined,
    firmName: r.firm_name,
    contactPerson: r.contact_person ?? '',
    mobile: r.mobile,
    scheduledDate: r.scheduled_date,
    scheduledTime: r.scheduled_time ?? undefined,
    assignedPersonId: r.assigned_person_id ?? '',
    assignedPersonName: r.assigned_person_name ?? '',
    status: r.status ?? 'Pending',
    priority: r.priority ?? 'Medium',
    notes: r.notes ?? '',
    outcome: r.outcome ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toComplaintRow(c: ServiceComplaint) {
  return {
    id: c.id,
    ticket_number: c.ticketNumber,
    customer_id: c.customerId ?? '',
    firm_name: c.firmName,
    contact_person: c.contactPerson ?? '',
    mobile: c.mobile,
    city: c.city ?? '',
    district: c.district ?? '',
    category: c.category,
    equipment_model: c.equipmentModel,
    serial_number: c.serialNumber ?? null,
    issue_description: c.issueDescription,
    priority: c.priority,
    status: c.status,
    assigned_service_person_id: c.assignedServicePersonId ?? '',
    assigned_service_person_name: c.assignedServicePersonName ?? '',
    reported_date: c.reportedDate,
    resolved_date: c.resolvedDate ?? null,
    resolution_notes: c.resolutionNotes ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function fromComplaintRow(r: any): ServiceComplaint {
  return {
    id: r.id,
    ticketNumber: r.ticket_number,
    customerId: r.customer_id ?? '',
    firmName: r.firm_name,
    contactPerson: r.contact_person ?? '',
    mobile: r.mobile,
    city: r.city ?? '',
    district: r.district ?? '',
    category: r.category,
    equipmentModel: r.equipment_model,
    serialNumber: r.serial_number ?? undefined,
    issueDescription: r.issue_description,
    priority: r.priority ?? 'Medium',
    status: r.status ?? 'Open',
    assignedServicePersonId: r.assigned_service_person_id ?? '',
    assignedServicePersonName: r.assigned_service_person_name ?? '',
    reportedDate: r.reported_date,
    resolvedDate: r.resolved_date ?? undefined,
    resolutionNotes: r.resolution_notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toPaymentRow(p: PaymentReceipt) {
  return {
    id: p.id,
    receipt_number: p.receiptNumber,
    customer_id: p.customerId,
    firm_name: p.firmName,
    invoice_number: p.invoiceNumber ?? null,
    amount: Number(p.amount) || 0,
    payment_date: p.paymentDate,
    payment_mode: p.paymentMode,
    reference_no: p.referenceNo ?? null,
    notes: p.notes ?? null,
    collected_by_id: p.collectedById ?? '',
    created_at: p.createdAt,
  };
}

function fromPaymentRow(r: any): PaymentReceipt {
  return {
    id: r.id,
    receiptNumber: r.receipt_number,
    customerId: r.customer_id,
    firmName: r.firm_name,
    invoiceNumber: r.invoice_number ?? undefined,
    amount: Number(r.amount) || 0,
    paymentDate: r.payment_date,
    paymentMode: r.payment_mode,
    referenceNo: r.reference_no ?? undefined,
    notes: r.notes ?? undefined,
    collectedById: r.collected_by_id ?? '',
    createdAt: r.created_at,
  };
}

function toStaffRow(s: UserStaff) {
  return {
    id: s.id,
    name: s.name,
    username: s.username.toLowerCase(),
    password: s.password ?? '',
    role: s.role,
    mobile: s.mobile,
    email: s.email ?? null,
    zone: s.zone ?? '',
    active: s.active,
    last_login: s.lastLogin ?? null,
    created_at: s.createdAt ?? new Date().toISOString(),
  };
}

function fromStaffRow(r: any): UserStaff {
  return {
    id: r.id,
    name: r.name,
    username: r.username,
    password: r.password ?? undefined,
    role: r.role,
    mobile: r.mobile,
    email: r.email ?? undefined,
    zone: r.zone ?? '',
    active: Boolean(r.active),
    lastLogin: r.last_login ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

function toSettingsRow(s: CompanySettings) {
  return {
    id: 'default',
    company_name: s.companyName ?? 'BizFlow',
    tagline: s.tagline ?? '',
    gstin: s.gstin ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    address: s.address ?? '',
    default_credit_days: Number(s.defaultCreditDays) || 30,
    default_gst_percent: Number(s.defaultGstPercent) || 18,
    updated_at: new Date().toISOString(),
  };
}

function fromSettingsRow(r: any): CompanySettings {
  return {
    companyName: r?.company_name ?? 'BizFlow',
    tagline: r?.tagline ?? '',
    gstin: r?.gstin ?? '',
    phone: r?.phone ?? '',
    email: r?.email ?? '',
    address: r?.address ?? '',
    defaultCreditDays: Number(r?.default_credit_days) || 30,
    defaultGstPercent: Number(r?.default_gst_percent) || 18,
  };
}

// ----------------- Supabase Sync API -----------------

export async function fetchAllFromSupabase(): Promise<CRMDatabase> {
  const supabase = getSupabase();

  const [
    customersRes,
    enquiriesRes,
    quotationsRes,
    followUpsRes,
    complaintsRes,
    paymentsRes,
    staffRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
    supabase.from('quotations').select('*').order('created_at', { ascending: false }),
    supabase.from('follow_ups').select('*').order('created_at', { ascending: false }),
    supabase.from('service_complaints').select('*').order('created_at', { ascending: false }),
    supabase.from('payment_receipts').select('*').order('created_at', { ascending: false }),
    supabase.from('staff').select('*').order('created_at', { ascending: true }),
    supabase.from('company_settings').select('*').eq('id', 'default').maybeSingle(),
  ]);

  const errors = [
    customersRes.error,
    enquiriesRes.error,
    quotationsRes.error,
    followUpsRes.error,
    complaintsRes.error,
    paymentsRes.error,
    staffRes.error,
    settingsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message || 'Failed to load data from Supabase');
  }

  return {
    customers: (customersRes.data ?? []).map(fromCustomerRow),
    enquiries: (enquiriesRes.data ?? []).map(fromEnquiryRow),
    quotations: (quotationsRes.data ?? []).map(fromQuotationRow),
    followUps: (followUpsRes.data ?? []).map(fromFollowUpRow),
    complaints: (complaintsRes.data ?? []).map(fromComplaintRow),
    payments: (paymentsRes.data ?? []).map(fromPaymentRow),
    staff: (staffRes.data ?? []).map(fromStaffRow),
    settings: fromSettingsRow(settingsRes.data),
  };
}

async function runSync(op: PromiseLike<{ error: { message: string } | null }>, label: string) {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await op;
    if (error) {
      console.error(`Supabase sync error (${label}):`, error);
      toast.error(`Sync failed (${label}): ${error.message}`);
    }
  } catch (err) {
    console.error(`Supabase network error (${label}):`, err);
    toast.error(`Network sync error while saving ${label}`);
  }
}

export const supabaseSync = {
  upsertCustomer(c: Customer) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('customers').upsert(toCustomerRow(c)), 'customer');
  },
  deleteCustomer(id: string) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('customers').delete().eq('id', id), 'customer delete');
  },

  upsertEnquiry(e: Enquiry) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('enquiries').upsert(toEnquiryRow(e)), 'enquiry');
  },
  deleteEnquiry(id: string) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('enquiries').delete().eq('id', id), 'enquiry delete');
  },

  upsertQuotation(q: Quotation) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('quotations').upsert(toQuotationRow(q)), 'quotation');
  },
  deleteQuotation(id: string) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('quotations').delete().eq('id', id), 'quotation delete');
  },

  upsertFollowUp(f: FollowUp) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('follow_ups').upsert(toFollowUpRow(f)), 'follow-up');
  },
  deleteFollowUp(id: string) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('follow_ups').delete().eq('id', id), 'follow-up delete');
  },

  upsertComplaint(c: ServiceComplaint) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('service_complaints').upsert(toComplaintRow(c)), 'complaint');
  },
  deleteComplaint(id: string) {
    if (!isSupabaseConfigured()) return;
    void runSync(
      getSupabase().from('service_complaints').delete().eq('id', id),
      'complaint delete',
    );
  },

  insertPayment(p: PaymentReceipt) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('payment_receipts').upsert(toPaymentRow(p)), 'payment');
  },

  upsertStaff(s: UserStaff) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('staff').upsert(toStaffRow(s)), 'user');
  },
  deleteStaff(id: string) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('staff').delete().eq('id', id), 'user delete');
  },

  upsertSettings(s: CompanySettings) {
    if (!isSupabaseConfigured()) return;
    void runSync(getSupabase().from('company_settings').upsert(toSettingsRow(s)), 'settings');
  },

  async restoreBackupToSupabase(db: CRMDatabase): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    const tasks: PromiseLike<any>[] = [];

    if (db.settings) {
      tasks.push(supabase.from('company_settings').upsert(toSettingsRow(db.settings)));
    }
    if (db.staff?.length) {
      tasks.push(supabase.from('staff').upsert(db.staff.map(toStaffRow)));
    }
    if (db.customers?.length) {
      tasks.push(supabase.from('customers').upsert(db.customers.map(toCustomerRow)));
    }
    if (db.enquiries?.length) {
      tasks.push(supabase.from('enquiries').upsert(db.enquiries.map(toEnquiryRow)));
    }
    if (db.quotations?.length) {
      tasks.push(supabase.from('quotations').upsert(db.quotations.map(toQuotationRow)));
    }
    if (db.followUps?.length) {
      tasks.push(supabase.from('follow_ups').upsert(db.followUps.map(toFollowUpRow)));
    }
    if (db.complaints?.length) {
      tasks.push(supabase.from('service_complaints').upsert(db.complaints.map(toComplaintRow)));
    }
    if (db.payments?.length) {
      tasks.push(supabase.from('payment_receipts').upsert(db.payments.map(toPaymentRow)));
    }

    await Promise.all(tasks);
  },
};
