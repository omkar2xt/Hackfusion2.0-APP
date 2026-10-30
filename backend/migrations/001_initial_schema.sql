-- SignalSafe Campus - PostgreSQL Schema Migration for Supabase
-- Initial Schema: profiles, scans, incidents, incident_notes, audit_logs

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    campus TEXT DEFAULT 'Central University',
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'staff', 'faculty', 'security_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('url', 'message', 'qr')),
    input_value TEXT NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN ('MALICIOUS', 'SUSPICIOUS', 'LOW_RISK', 'UNKNOWN')),
    risk_level TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    scoring_version TEXT DEFAULT 'v1.2-explainable',
    indicators JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN (
        'phishing', 'malware', 'data_breach', 'unauthorized_access',
        'suspicious_email', 'social_engineering', 'other'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'triaged', 'investigating', 'resolved', 'closed'
    )),
    description TEXT NOT NULL,
    suspicious_content TEXT,
    resolution_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Incident Notes Table (for security team investigation notes)
CREATE TABLE IF NOT EXISTS public.incident_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audit Logs Table (tracks status changes and administrative actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own profile; admins can read all
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Scans: Users can view own scans; public scans if user_id is null
CREATE POLICY "Users view own scans" ON public.scans
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Incidents: Users view own reports; security admins can view all
CREATE POLICY "Users view own incidents" ON public.incidents
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'security_admin')
    );

CREATE POLICY "Users can insert incidents" ON public.incidents
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Index creation for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_scans_checked_at ON public.scans(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON public.incidents(user_id);

