-- Undertow: persist accounts, the actions taken on them, and outreach.
-- All access goes through server routes with the service role; no client grants or policies.

CREATE TABLE public.accounts (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  arr_eur integer NOT NULL CHECK (arr_eur >= 0),
  level text NOT NULL CHECK (level IN ('high', 'rising', 'calm')),
  owner text NOT NULL DEFAULT 'Unassigned',
  last_touch_days integer NOT NULL DEFAULT 0 CHECK (last_touch_days >= 0),
  reason text NOT NULL,
  verdict text NOT NULL,
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestion text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'handled')),
  handled_reason text CHECK (handled_reason IN ('reached_out', 'not_a_risk', 'emailed', 'seed')),
  handled_note text,
  handled_at timestamptz,
  source text NOT NULL DEFAULT 'sample' CHECK (source IN ('sample', 'added')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handled_needs_reason CHECK (
    (status = 'open' AND handled_reason IS NULL) OR (status = 'handled' AND handled_reason IS NOT NULL)
  )
);

CREATE TABLE public.account_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  actor text NOT NULL,
  type text NOT NULL CHECK (type IN ('assigned', 'reached_out', 'not_a_risk', 'reopened', 'emailed', 'messaged', 'replied', 'added')),
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_events_account_created_idx ON public.account_events (account_id, created_at DESC);

CREATE TABLE public.outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('Email', 'Slack')),
  recipient text NOT NULL,
  sent_by text NOT NULL,
  pdf boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'replied')),
  sent_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.accounts, public.account_events, public.outreach TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.accounts IS 'Flagged accounts in the weekly brief. Under-the-radar is derived, never stored. Server-only.';
COMMENT ON TABLE public.account_events IS 'Append-only log of actions on accounts (who did what, when). Server-only.';
COMMENT ON TABLE public.outreach IS 'Messages sent from Undertow and whether the customer replied. Server-only.';
