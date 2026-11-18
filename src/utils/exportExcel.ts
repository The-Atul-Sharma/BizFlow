import * as XLSX from 'xlsx';
import type { Customer, Enquiry, Quotation, ServiceComplaint } from '@/types';

export function exportCustomersToExcel(customers: Customer[]) {
  const data = customers.map((c) => ({
    'Firm Name': c.firmName,
    'Category': c.category,
    'Contact Person': c.contactPerson,
    'Mobile Number': c.mobile,
    'City': c.city,
    'District': c.district,
    'State': c.state,
    'GSTIN': c.gstin,
    'GST Status': c.gstStatus,
    'Lead Status': c.leadStatus.toUpperCase(),
    'Outstanding (₹)': c.outstandingAmount,
    'Credit Limit (₹)': c.creditLimit,
    'Payment Terms (Days)': c.paymentTermsDays,
    'Created At': c.createdAt,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, `BizFlow_Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportEnquiriesToExcel(enquiries: Enquiry[]) {
  const data = enquiries.map((e) => ({
    'Enquiry No': e.enquiryNumber,
    'Firm Name': e.firmName,
    'Category': e.category,
    'Contact Person': e.contactPerson,
    'Mobile': e.mobile,
    'City': e.city,
    'District': e.district,
    'Requirement': e.requirement,
    'Estimated Value (₹)': e.estimatedValue,
    'Lead Status': e.leadStatus.toUpperCase(),
    'Priority': e.priority,
    'Next Follow-up': e.nextFollowUpDate,
    'Source': e.source,
    'Created At': e.createdAt,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Enquiries');
  XLSX.writeFile(wb, `BizFlow_Enquiries_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportComplaintsToExcel(complaints: ServiceComplaint[]) {
  const data = complaints.map((c) => ({
    'Ticket No': c.ticketNumber,
    'Firm Name': c.firmName,
    'Category': c.category,
    'City': c.city,
    'District': c.district,
    'Equipment Model': c.equipmentModel,
    'Serial No': c.serialNumber || 'N/A',
    'Issue': c.issueDescription,
    'Priority': c.priority,
    'Status': c.status,
    'Assigned Engineer': c.assignedServicePersonName,
    'Reported Date': c.reportedDate,
    'Resolved Date': c.resolvedDate || 'Pending',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Complaints');
  XLSX.writeFile(wb, `BizFlow_Complaints_${new Date().toISOString().split('T')[0]}.xlsx`);
}
