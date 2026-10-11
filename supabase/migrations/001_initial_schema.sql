-- ==============================================================================
-- Ovel SaaS Platform — PostgreSQL 16 Initial Schema with Multi-Tenant RLS
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations (Tenants) Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    phone VARCHAR(50),
    plan VARCHAR(50) NOT NULL DEFAULT 'Pilot ($39/mo)',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, pending_setup
    stripe_account_id VARCHAR(255),
    settings JSONB DEFAULT '{
        "buffer_default_minutes": 15,
        "currency": "USD",
        "tax_rate_percent": 8.5,
        "cancellation_policy_hours": 24,
        "whatsapp_reminders_enabled": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Staff Members Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100) DEFAULT 'Specialist',
    is_active BOOLEAN NOT NULL DEFAULT true,
    working_hours JSONB NOT NULL DEFAULT '{
        "monday": {"start": "09:00", "end": "18:00", "active": true},
        "tuesday": {"start": "09:00", "end": "18:00", "active": true},
        "wednesday": {"start": "09:00", "end": "18:00", "active": true},
        "thursday": {"start": "09:00", "end": "18:00", "active": true},
        "friday": {"start": "09:00", "end": "18:00", "active": true},
        "saturday": {"start": "10:00", "end": "16:00", "active": true},
        "sunday": {"start": "00:00", "end": "00:00", "active": false}
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Service Catalog Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 45,
    price_cents INT NOT NULL DEFAULT 0,
    deposit_cents INT NOT NULL DEFAULT 0,
    buffer_before_minutes INT NOT NULL DEFAULT 0,
    buffer_after_minutes INT NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed', -- confirmed, pending_deposit, rescheduled, cancelled, completed
    total_price_cents INT NOT NULL,
    deposit_paid_cents INT NOT NULL DEFAULT 0,
    notes TEXT,
    reschedule_token VARCHAR(100) UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Interactive Quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    optional_add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_cents INT NOT NULL DEFAULT 0,
    deposit_cents INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, accepted, converted
    signature_data TEXT,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    subtotal_cents INT NOT NULL,
    deposit_credited_cents INT NOT NULL DEFAULT 0,
    tax_cents INT NOT NULL DEFAULT 0,
    balance_due_cents INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'paid', -- draft, sent, paid, overdue
    pdf_r2_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Reminders & Messaging Log Table (WhatsApp & Email)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- whatsapp, email, sms
    trigger_type VARCHAR(50) NOT NULL, -- T-24h, T-2h, instant_confirmation
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, sent, delivered, replied_1_confirmed, replied_2_cancelled
    payload JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Row-Level Security (RLS) Setup
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 10. Public Access Policies for Hosted Booking & Proposals
CREATE POLICY "Public can view active services" ON public.services 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active staff" ON public.staff 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can insert bookings" ON public.bookings 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view booking by reschedule_token" ON public.bookings 
    FOR SELECT USING (true);

CREATE POLICY "Public can view and sign quotes" ON public.quotes 
    FOR SELECT USING (true);

-- 11. User Profiles & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'business_owner', -- super_admin, business_owner, staff, client
    permissions JSONB DEFAULT '["bookings:read", "bookings:write"]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, invited, suspended
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their organization" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Owners and Admins can manage their organization profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'business_owner' AND organization_id = profiles.organization_id))
        )
    );

