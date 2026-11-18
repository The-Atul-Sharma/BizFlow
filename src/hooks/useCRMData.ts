import { useState, useEffect, useCallback } from 'react';
import {
  customerService,
  enquiryService,
  quotationService,
  followUpService,
  complaintService,
  paymentService,
  staffService,
} from '@/services/api';
import type {
  Customer,
  Enquiry,
  Quotation,
  FollowUp,
  ServiceComplaint,
  PaymentReceipt,
  UserStaff,
} from '@/types';

export function useCRMData() {
  const [customers, setCustomers] = useState<Customer[]>(() => customerService.list());
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => enquiryService.list());
  const [quotations, setQuotations] = useState<Quotation[]>(() => quotationService.list());
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => followUpService.list());
  const [complaints, setComplaints] = useState<ServiceComplaint[]>(() => complaintService.list());
  const [payments, setPayments] = useState<PaymentReceipt[]>(() => paymentService.list());
  const [staff, setStaff] = useState<UserStaff[]>(() => staffService.list());

  const refresh = useCallback(() => {
    setCustomers([...customerService.list()]);
    setEnquiries([...enquiryService.list()]);
    setQuotations([...quotationService.list()]);
    setFollowUps([...followUpService.list()]);
    setComplaints([...complaintService.list()]);
    setPayments([...paymentService.list()]);
    setStaff([...staffService.list()]);
  }, []);

  useEffect(() => {
    window.addEventListener('crm-data-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('crm-data-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return {
    customers,
    enquiries,
    quotations,
    followUps,
    complaints,
    payments,
    staff,
    refresh,
  };
}
