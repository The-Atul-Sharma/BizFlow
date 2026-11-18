<p align="center">
  <img src="public/pwa-192.png" alt="BizFlow Logo" width="96" />
</p>

<h1 align="center">BizFlow</h1>

<p align="center">
  <strong>Mobile-first Progressive Web App (PWA) CRM</strong> for automotive garage equipment suppliers, distributors, and field service teams serving <strong>Workshops, Tyre Shops, Fitters, OEM Facilities, and Others</strong>.
</p>

---

## Core Features

### 1. Live Operations Dashboard
- **5 Core KPI Cards:** New Enquiries, Pending Quotations, Pending Payments, Today's Follow-ups, and Service Complaints.
- **Attention Banner:** Real-time alerts for critical SLA breakdowns, follow-ups due today, pending quotes, and overdue accounts.
- **Interactive Charts:** Enquiry pipeline breakdown (*Hot / Warm / Cold / Converted / Lost*), customer segmentation (*Workshop / Tyre Shop / Fitters / OEM / Other*), and highest outstanding dues.
- **Quick Action Queues:** Today's scheduled calls with 1-tap **Call**, **WhatsApp**, and **Mark Done**, plus active service breakdown tickets.

### 2. Enquiries & Lead Pipeline
- **Dual Views:** Swipeable **Kanban Pipeline** on mobile + filterable **Table View** with color-coded 1-click status pills (`Hot`, `Warm`, `Cold`, `Converted`, `Lost`).
- **Filtering & Search:** Filter by category (*Workshop, Tyre Shop, Fitters, OEM, Other*), sales executive, priority, and lead status.
- **Auto Follow-up Scheduling:** Setting a follow-up date automatically creates a scheduled task in Today's Follow-ups.
- **Excel Export:** Export filtered enquiries to `.xlsx`.

### 3. Customers Directory
- **Full Customer Profile:** Firm name, category, contact person, mobile/alternate mobile, address, city, district, state, pincode, and notes.
- **GST Details:** 15-character GSTIN tracking and registration status (*Active / Pending / Unregistered*).
- **Financial & Outstanding Tracking:** Current outstanding balance, credit limit utilization, payment terms, and 1-tap **Record Payment** receipt generation.
- **Personnel Assignment:** Dedicated **Sales Executive** and **Service Engineer** assignment per account.
- **Account History Drawer:** Slideout sheet showing linked enquiries, quotations, complaints, and payment receipts.
- **Excel Export:** Export customer directory to `.xlsx`.

### 4. Commercial Quotations
- **Itemized Builder:** Equipment descriptions, HSN codes, quantity, unit price, automatic GST calculation (18% CGST + SGST), and grand totals.
- **Status Workflow:** Track proposals across `Draft`, `Pending`, `Accepted`, `Rejected`, and `Expired`.
- **Printable PDF Layout:** Mobile-responsive preview modal with clean A4 print layout (`Print PDF`).

### 5. Today's Follow-ups
- Categorized queues for **Today's Calls**, **Overdue**, **Upcoming**, and **Completed** follow-ups.
- Direct **Call (`tel:`)**, **WhatsApp (`wa.me`)**, and outcome logging on completion.

### 6. Service Complaints & Breakdown Tickets
- Ticket numbering (`CMP-2026-xxx`), equipment model, serial number, fault description, priority (`Critical`, `High`, `Medium`, `Low`), status (`Open`, `In Progress`, `Awaiting Parts`, `Resolved`, `Closed`), and assigned service engineer.
- Quick **Resolve Ticket** workflow with work-done remarks and Excel export.

### 7. Outstanding & Payment Collections
- Customer-wise outstanding ledger with credit limit progress bars and 1-tap WhatsApp payment reminders.
- Recording a payment receipt (`RCT-2026-xxx`) automatically deducts from the customer's outstanding balance and logs payment mode (`UPI`, `NEFT/RTGS`, `Cheque`, `Cash`) and reference/UTR number.

### 8. Sales & Service Team
- Manage Sales Executives, Service Engineers, and Administrators with operating zones, live assigned workload stats (Accounts, Active Leads, Service Tickets), and 1-tap Call/WhatsApp.

### 9. Settings, Access Control & Auth
- **Username & Password Authentication:** Dedicated `/login` screen, protected routes, session persistence, and instant sign-out.
- **User Access Management:** Create/edit users, reveal/change passwords, assign roles (`Admin`, `Sales`, `Service`), and toggle Active/Revoked access.
- **Organization & GST Settings:** Configure company branding, GSTIN, default credit period, and GST %.
- **JSON Backup & Restore:** Export and restore the full CRM database as JSON.

---

## Mobile-First PWA Experience

- **Installable PWA:** Configured via `vite-plugin-pwa` with custom **BizFlow** icons (`192×192`, `512×512` maskable, `180×180` Apple touch icon) and offline precaching.
- **Automatic Update Prompt:** On every new production deployment (`dist/version.json` vs `__BUILD_ID__`), installed PWAs display a **BizFlow "Update available"** prompt to cleanly activate the new service worker and reload.
- **Native Mobile UI:**
  - All form modals open as **bottom drawers** on mobile (`< 640px`) with drag handles and safe-area padding.
  - Responsive mobile cards replace wide desktop tables across every module with zero horizontal overflow.
  - Fixed bottom navigation bar with live badge counts and automatic scroll-to-top on tab changes.
  - Global command search (`⌘K` or `/`) and Dark/Light theme toggle.

---

## Tech Stack

- **Framework:** React 19, TypeScript, Vite 8
- **Styling & UI:** Tailwind CSS v4, Radix UI, Lucide Icons, Sonner
- **Routing & Charts:** React Router v7, Recharts
- **PWA & Utilities:** `vite-plugin-pwa`, Workbox, `xlsx`, `date-fns`
- **Database & Sync:** Supabase (PostgreSQL) with optimistic local cache & JSON backup/restore

---

## Supabase Setup

1. Create a Supabase project and run [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) in your Supabase **SQL Editor**.
2. Copy `.env.example` to `.env` (or add these variables in **Vercel -> Project Settings -> Environment Variables**):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISH_KEY=your-publishable-or-anon-key
```

> Both `VITE_SUPABASE_PUBLISH_KEY` and `VITE_SUPABASE_ANON_KEY` are supported.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3001)
npm run dev

# Type-check and build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```text
├── public/                     # BizFlow favicons & PWA icons
├── src/
│   ├── components/
│   │   ├── PwaUpdatePrompt.tsx # Full-screen PWA update modal
│   │   ├── shared/             # PageHeader, KpiCard, Badges
│   │   └── ui/                 # Radix UI components (bottom-drawer Dialog, Sheet, etc.)
│   ├── features/
│   │   ├── auth/               # LoginPage, RequireAuth
│   │   ├── dashboard/          # DashboardPage, DashboardCharts
│   │   ├── enquiries/          # EnquiriesPage (Kanban & Table)
│   │   ├── customers/          # CustomersPage (Directory, Ledger & Detail Sheet)
│   │   ├── quotations/         # QuotationsPage (Builder & Print PDF)
│   │   ├── followups/          # FollowUpsPage
│   │   ├── complaints/         # ComplaintsPage
│   │   ├── payments/           # PaymentsPage
│   │   ├── team/               # TeamPage
│   │   └── settings/           # SettingsPage (Users, Passwords, Org & Backup)
│   ├── hooks/                  # useAuth, useCRMData, useAppUpdate, usePWAInstall, useTheme
│   ├── layouts/                # AppLayout, Sidebar, GlobalSearch
│   ├── lib/                    # supabase, pwaUpdate, chunkLoadError, utils
│   ├── services/               # db.ts, api.ts, supabaseSync.ts
│   ├── types/                  # TypeScript interfaces
│   └── utils/                  # format.ts (INR formatting), exportExcel.ts
├── supabase/migrations/        # PostgreSQL schema for Supabase
├── vercel.json                 # SPA rewrites & no-cache headers for version.json / sw.js
└── vite.config.ts              # Vite + VitePWA + app-version build plugin
```

---

## Deployment (Vercel)

BizFlow is ready for zero-config deployment on **Vercel**:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- `vercel.json` handles client-side SPA rewrites and sets `Cache-Control: no-store` on `/version.json` and `/sw.js` so installed PWAs immediately receive update prompts after every deployment.
