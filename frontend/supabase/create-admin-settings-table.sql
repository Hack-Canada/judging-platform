-- Create admin_settings table for storing admin configuration
-- This replaces localStorage for better persistence and multi-session support

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(setting_key);

-- Insert default settings if they don't exist
INSERT INTO public.admin_settings (setting_key, setting_value) 
VALUES 
  ('investment_fund', '10000'),
  ('calendar_slot_duration', '5'),
  ('calendar_judges_per_project', '2'),
  ('calendar_start_time', '13:00'),
  ('calendar_end_time', '16:00'),
  ('scoring_min_investment', '0'),
  ('scoring_max_investment', '1000'),
  ('tracks_data', '[]'),
  ('rooms_data', '[]')
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.admin_settings IS 'Global admin settings and configuration values';
