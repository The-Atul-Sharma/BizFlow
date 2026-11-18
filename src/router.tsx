import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import EnquiriesPage from '@/features/enquiries/EnquiriesPage';
import CustomersPage from '@/features/customers/CustomersPage';
import QuotationsPage from '@/features/quotations/QuotationsPage';
import FollowUpsPage from '@/features/followups/FollowUpsPage';
import ComplaintsPage from '@/features/complaints/ComplaintsPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import TeamPage from '@/features/team/TeamPage';
import SettingsPage from '@/features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'enquiries', element: <EnquiriesPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'quotations', element: <QuotationsPage /> },
          { path: 'follow-ups', element: <FollowUpsPage /> },
          { path: 'complaints', element: <ComplaintsPage /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'team', element: <TeamPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
