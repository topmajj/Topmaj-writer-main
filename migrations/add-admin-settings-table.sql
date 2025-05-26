-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_if_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the admin_settings table if it doesn't exist
CREATE OR REPLACE FUNCTION create_admin_settings_table()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'admin_settings'
  ) THEN
    CREATE TABLE public.admin_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      settings JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
    
    -- Only allow admins to access this table
    CREATE POLICY "Admin users can read admin_settings" 
      ON public.admin_settings FOR SELECT 
      USING (auth.jwt() ->> 'role' = 'admin');
      
    CREATE POLICY "Admin users can insert admin_settings" 
      ON public.admin_settings FOR INSERT 
      WITH CHECK (auth.jwt() ->> 'role' = 'admin');
      
    CREATE POLICY "Admin users can update admin_settings" 
      ON public.admin_settings FOR UPDATE 
      USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the table immediately if it doesn't exist
SELECT create_admin_settings_table();

-- Insert default settings if the table is empty
INSERT INTO public.admin_settings (settings)
SELECT '{"security":{"minPasswordLength":8,"requireSpecialChar":true,"requireNumber":true,"requireUppercase":true,"sessionTimeout":60,"maxLoginAttempts":5,"enableTwoFactor":false,"ipRestriction":false,"allowedIPs":"","adminEmailNotifications":true,"securityLogRetention":"90"},"api":{"rateLimit":100,"apiTimeout":30,"enableCORS":true,"allowedOrigins":"*"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings LIMIT 1);
