# **Ovel — SaaS Project Plan & Technical Blueprint**

The Flat-Price Booking-to-Paid Operating Platform for Modern Service Businesses

# **1\. Executive Summary & Product Vision**

Ovel is a flat-price booking-to-paid operating platform designed for small service businesses (salons, aesthetic clinics, mobile auto detailers, consultants, and independent specialists). While existing booking software stops at calendar reservations and standalone proposal tools charge per seat, Ovel unifies the complete commercial loop: **Quote → Book → Remind → Invoice → Paid**.

## **The Strategic Value of the "Ovel" Brand**

* **Operational Blueprint & Open Booking:** Reflects a streamlined Operational Blueprint for service businesses and an Open Booking pipeline that works frictionlessly across channels.  
* **Optimal Business Continuity:** Emphasizes seamless client retention and lifetime value through automated rebooking reminders, smart waitlists, and recurring services.  
* **On-Demand & Punchy Brand Identity:** Offers a bold, memorable brand ideal for modern mobile UI, passwordless client authentication, and zero platform commission fees.

# **2\. Competitive Landscape & Market Positioning**

## **Incumbent Analysis**

| Platform | Primary Focus | Pricing Model | Major Bottlenecks & Limitations |
| :---- | :---- | :---- | :---- |
| **Acuity Scheduling** | Scheduling | \$16 \- \$61+/mo | Dated UI, confusing add-ons, lacks integrated end-to-end invoicing. |
| **Square Appointments** | POS & Booking | Free to \$29+/loc | Forces ecosystem lock-in to Square payment processing. |
| **Fresha** | Salon Marketplace | 20% discovery \+ fees | High transaction cuts on new client discovery on top of processing. |
| **HoneyBook** | Proposals & CRM | \$36 \- \$129/mo | Costly seat tiers; SMS and scheduling restricted to top plans. |
| **Dubsado** | Workflow Automation | \$20 \- \$40/mo | Steep learning curve (15–25 hours average initial setup time). |
| **Calendly / Cal.com** | Meeting Link | \$10 \- \$20/seat/mo | Designed for meetings; lacks integrated quote-to-paid workflows. |

## **Ovel's Strategic Moat**

1. **The Unified Bundle:** Quotes, bookings, deposits, automated reminders, and invoices at one predictable flat subscription price.  
2. **Zero Transaction Take-Rate:** Clients connect their own payment gateway (Stripe Connect Standard) with 0% platform fee cuts.  
3. **Done-For-You (DFY) Agency Onboarding:** Overcoming setup friction by providing white-glove catalog importation and scheduling setup.  
4. **Interactive Two-Way Messaging:** WhatsApp- and SMS-native interactive confirmations (Confirm/Cancel) reducing no-show rates by up to 25%.

# **3\. System Architecture & Tech Stack**

Ovel is engineered for maximum reliability and scalability with zero fixed infrastructure cost at launch.

| Layer | Component | Selection | Rationale & Capabilities |
| :---- | :---- | :---- | :---- |
| **Frontend** | Framework | Next.js 15 (App Router) | React 19, Server Actions, optimal SEO, fast edge rendering via Vercel. |
| **Styling** | UI Design System | Tailwind CSS \+ shadcn/ui | Radix UI primitives customized with Ovel's signature clean, modern aesthetic. |
| **Database** | Primary Store | Supabase (PostgreSQL 16\) | Native Row-Level Security (RLS) enforcing strict multi-tenant isolation. |
| **Auth** | Identity Provider | Supabase Auth | Admin password/OAuth; passwordless magic links for end-clients. |
| **Orchestration** | Background Jobs | Trigger.dev / Inngest | Durable execution, delayed workflows, and cron reminder schedules. |
| **Storage** | Asset & PDF Hosting | Cloudflare R2 | Zero-egress fee object storage for client invoice PDFs and assets. |
| **Payments** | Gateway Integration | Stripe Connect Standard | Direct merchant payout routing with zero platform transaction fees. |
| **Messaging** | Email & WhatsApp | Resend \+ Meta Cloud API | Transactional emails (3,000 free/mo) and interactive WhatsApp messaging. |
| **Calendar Sync** | Bidirectional Engine | Google Calendar API \+ Graph | Real-time calendar synchronization preventing double-bookings. |

# **5\. Phased Product Roadmap**

## **MVP (Weeks 1 to 8\)**

* **Booking Engine:** Services, staff scheduling, custom buffer times, hosted booking pages (`/book/[slug]`), embeddable iframe widget, required deposit payments, self-service cancellation and reschedule flows.  
* **Reminders:** Multi-channel notifications (Email \+ WhatsApp/SMS) scheduled at T-24 hours and T-2 hours, with automated two-way response parsing.  
* **Invoicing:** Digital invoice generation, deposit receipts, itemized tax calculation, payment links, and Stripe Connect Standard integration.  
* **Client Portal:** Magic-link authentication (passwordless), appointment history, upcoming schedule viewer, outstanding invoice settlement, and intake forms.  
* **Analytics Dashboard:** Live metrics tracking no-show rates, gross revenue, reminder response rates, and outstanding invoices.

## **Phase 2: Growth & Advanced Scheduling (Weeks 9 to 14\)**

* **Interactive Quotes:** Line items, optional add-ons, digital e-signature, expiration dates, and auto-conversion into a confirmed booking and deposit invoice upon acceptance.  
* **Capacity Protection:** Smart waitlist with automated vacancy alerts, card-on-file with automated late-cancellation/no-show fees.  
* **Extended Scheduling:** Recurring appointments, service packages, and recurring memberships.  
* **Workflow Plumbing:** Lead intake forms, pipeline tracking, Zapier/webhook integrations, and CSV/accounting exports.

## **Phase 3: The Scale Moat (Weeks 15+)**

* **Agency / White-Label Mode:** Master multi-tenant dashboard, custom domain mapping, reseller billing, and turnkey industry templates.  
* **AI Front-Desk Assistant:** Autonomous WhatsApp and web conversational agent answering service FAQs and scheduling appointments with human fallback.  
* **Enterprise Controls:** Multi-location management, role-based access control (RBAC), and detailed security audit logs.

# **6\. Eight-Week Implementation Sprint Plan**

## **Sprint 1 (Weeks 1–2): Core Engine & Tenancy**

* Project scaffolding with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.  
* Supabase database initialization, migrations, and Row-Level Security policies.  
* Availability slot engine: computes available slots based on staff working hours minus existing bookings minus external calendar events minus buffer times.  
* Admin dashboard shell: staff management, service catalog setup, and working hours builder.

## **Sprint 2 (Weeks 3–4): Booking Funnel & Payments**

* Public booking interface (`/book/[slug]`): service selection, staff assignment, date/time picker, intake form, and deposit payment.  
* Stripe Connect Standard onboarding: merchant connects Stripe account; direct charge processing.  
* Booking confirmation and tokenized self-service links for rescheduling and cancellation under organization policy limits.

## **Sprint 3 (Weeks 5–6): Messaging, Invoicing & Portal**

* Scheduled reminder orchestration via Trigger.dev: dispatching email (Resend) and WhatsApp messages (Meta Cloud API).  
* Two-way WhatsApp webhook: parsing inbound replies ("1" to Confirm, "2" to Cancel) and updating booking state dynamically.  
* Automated invoice PDF generation via React PDF and storage upload to Cloudflare R2.  
* Passwordless Client Portal (`/portal/[slug]`) with Supabase magic links.

## **Sprint 4 (Weeks 7–8): Calendar Sync, Analytics & Pilot**

* Google Calendar two-way synchronization via Google Calendar API and push notification webhooks.  
* Analytics dashboard computing real-time revenue, show-up rates, and outstanding receivables.  
* Production deployment to Vercel with SSL and DNS routing.  
* Onboarding 5 pilot service businesses with white-glove Done-For-You (DFY) service.

# **7\. Go-To-Market & Pilot Strategy**

## **Pilot Cohort Profile**

* **Target Niches:** High-end hair salons, aesthetic/skin clinics, mobile auto detailers, and specialty medical/wellness practices.  
* **Pilot Size:** 5 to 10 vetted local businesses.  
* **Commercial Offer:** \$39/month (first 30 days waived during testing), \$150 setup fee (waived in exchange for video case studies and feedback).

## **Value Proposition Hook**

* **Commission-Free Growth:** Stop paying 20% marketplace commissions (vs. Fresha).  
* **Zero-Setup Hassle:** Avoid 20+ hours of setup complexity (vs. Dubsado) via our Done-For-You agency setup.  
* **Single-Tool Simplicity:** Replace 3 separate tools (Calendly \+ PandaDoc \+ Square) with one unified, flat-fee loop.

# **8\. Definition of Done & Success Metrics**

* **Technical Quality:** 100% RLS tenant isolation verified by automated tests; booking slot computation under 200ms; zero double-booking occurrences.  
* **Operational Quality:** Automated reminders delivered within 60 seconds of trigger schedule; WhatsApp interactive replies updating system status reliably.  
* **Business Impact:** Pilot cohort achieves a reduction of at least 20% in customer no-show rates within the first 30 days of implementation.

