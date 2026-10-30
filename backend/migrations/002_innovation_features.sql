-- SignalSafe Campus - Migration 002: Advanced Innovation Features
-- Adds tables for: Threat DNA, Threat Campaigns, Verified QR Registry,
-- Institutional Trust Graph, Campus Warnings, Incident Timeline, and Safety Coach.

-- 1. Threat Fingerprints
CREATE TABLE IF NOT EXISTS public.threat_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
    domain_normalized TEXT DEFAULT '',
    url_structure_hash TEXT DEFAULT '',
    content_tokens JSONB DEFAULT '[]'::jsonb,
    claimed_sender TEXT DEFAULT '',
    fingerprint_hash TEXT NOT NULL,
    feature_vector JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Threat Campaigns
CREATE TABLE IF NOT EXISTS public.threat_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    primary_theme TEXT DEFAULT 'General Phishing',
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'suspected' CHECK (status IN ('suspected', 'confirmed', 'rejected', 'mitigated')),
    confidence_score DOUBLE PRECISION DEFAULT 0.75,
    incident_count INTEGER DEFAULT 1,
    description TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Campaign Incidents Junction
CREATE TABLE IF NOT EXISTS public.campaign_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.threat_campaigns(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION DEFAULT 1.0,
    match_reasons JSONB DEFAULT '[]'::jsonb,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verified QR Registry
CREATE TABLE IF NOT EXISTS public.verified_qr_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    department TEXT DEFAULT 'University Admin',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Institutional Trust Graph Identities
CREATE TABLE IF NOT EXISTS public.institutional_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    department TEXT NOT NULL,
    official_email TEXT NOT NULL,
    official_phone TEXT DEFAULT '',
    verified_domain TEXT NOT NULL,
    official_portal_url TEXT DEFAULT '',
    verified_payment_portal TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Campus Cyber Immune System Warnings
CREATE TABLE IF NOT EXISTS public.campus_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.threat_campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'archived')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Incident Timeline Audit Events
CREATE TABLE IF NOT EXISTS public.incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Cyber Safety Coach Learning Modules
CREATE TABLE IF NOT EXISTS public.learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_minutes INTEGER DEFAULT 3,
    content_markdown TEXT NOT NULL,
    icon_name TEXT DEFAULT 'Shield',
    order_index INTEGER DEFAULT 0
);

-- 9. Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options_json JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT DEFAULT ''
);

-- 10. Student Learning Progress
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    quiz_score INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ
);

-- RLS Enablement
ALTER TABLE public.threat_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_qr_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- Read policies for students and staff
CREATE POLICY "Public read verified QR destinations" ON public.verified_qr_destinations FOR SELECT USING (is_active = true);
CREATE POLICY "Public read institutional identities" ON public.institutional_identities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read campus warnings" ON public.campus_warnings FOR SELECT USING (status = 'approved');
CREATE POLICY "Public read learning modules" ON public.learning_modules FOR SELECT USING (true);
CREATE POLICY "Public read quiz questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Users read own learning progress" ON public.learning_progress FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_threat_fingerprints_hash ON public.threat_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_threat_campaigns_status ON public.threat_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_inc ON public.incident_timeline(incident_id);
