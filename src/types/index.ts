export type CustomerCategory = 'Workshop' | 'Tyre Shop' | 'Fitters' | 'OEM' | 'Dealer' | 'Other';

export type LeadStatus = 'hot' | 'warm' | 'cold' | 'converted' | 'lost';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';

export type QuotationStatus = 'Draft' | 'Pending' | 'Accepted' | 'Rejected' | 'Expired';

export type ComplaintStatus = 'Open' | 'In Progress' | 'Awaiting Parts' | 'Resolved' | 'Closed';

export type FollowUpStatus = 'Pending' | 'Completed' | 'Rescheduled' | 'Missed';

export type PaymentMode = 'Cash' | 'UPI' | 'NEFT/RTGS' | 'Cheque';

export interface UserStaff {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'Sales' | 'Service' | 'Admin';
  mobile: string;
  email?: string;
  zone: string;
  active: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  defaultCreditDays: number;
  defaultGstPercent: number;
}

export interface Customer {
  id: string;
  firmName: string;
  contactPerson: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  category: CustomerCategory;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  gstin: string;
  gstStatus: 'Active' | 'Pending' | 'Unregistered';
  assignedSalesPersonId: string;
  assignedServicePersonId: string;
  leadStatus: LeadStatus;
  outstandingAmount: number;
  creditLimit: number;
  paymentTermsDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enquiry {
  id: string;
  enquiryNumber: string;
  customerId?: string;
  firmName: string;
  contactPerson: string;
  mobile: string;
  city: string;
  district: string;
  category: CustomerCategory;
  requirement: string;
  estimatedValue: number;
  leadStatus: LeadStatus;
  priority: Priority;
  assignedSalesPersonId: string;
  nextFollowUpDate: string; // YYYY-MM-DD
  source: 'Direct Visit' | 'Phone Call' | 'Website' | 'Referral' | 'Exhibition' | 'OEM Referral';
  notes?: string;
  quotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  hsnCode: string;
  qty: number;
  unitPrice: number;
  taxPercent: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  firmName: string;
  contactPerson: string;
  mobile: string;
  gstin: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  assignedSalesPersonId: string;
  validUntil: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  title: string;
  type: 'Sales' | 'Service' | 'Payment Collection' | 'Quotation Review';
  customerId?: string;
  enquiryId?: string;
  firmName: string;
  contactPerson: string;
  mobile: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string;
  assignedPersonId: string;
  assignedPersonName: string;
  status: FollowUpStatus;
  priority: Priority;
  notes: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceComplaint {
  id: string;
  ticketNumber: string;
  customerId: string;
  firmName: string;
  contactPerson: string;
  mobile: string;
  city: string;
  district: string;
  category: CustomerCategory;
  equipmentModel: string;
  serialNumber?: string;
  issueDescription: string;
  priority: Priority;
  status: ComplaintStatus;
  assignedServicePersonId: string;
  assignedServicePersonName: string;
  reportedDate: string;
  resolvedDate?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  customerId: string;
  firmName: string;
  invoiceNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNo?: string;
  notes?: string;
  collectedById: string;
  createdAt: string;
}

export interface CRMDatabase {
  customers: Customer[];
  enquiries: Enquiry[];
  quotations: Quotation[];
  followUps: FollowUp[];
  complaints: ServiceComplaint[];
  payments: PaymentReceipt[];
  staff: UserStaff[];
  settings?: CompanySettings;
}
