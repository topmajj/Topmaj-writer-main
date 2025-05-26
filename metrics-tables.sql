-- User metrics table
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  words_generated INT NOT NULL DEFAULT 0,
  words_generated_previous_month INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI prompts tracking table
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  model VARCHAR(255) NOT NULL,
  tokens_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscription and credits table
CREATE TABLE IF NOT EXISTS public.user_subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(255) NOT NULL DEFAULT 'free',
  credits_used INT NOT NULL DEFAULT 0,
  total_credits INT NOT NULL DEFAULT 10000,
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- User can only see and modify their own metrics
CREATE POLICY user_metrics_policy ON public.user_metrics
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User can only see and create their own prompts
CREATE POLICY ai_prompts_policy ON public.ai_prompts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User can only see and modify their own subscription
CREATE POLICY user_subscription_policy ON public.user_subscription
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User can only see and modify their own documents
CREATE POLICY documents_policy ON public.documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert sample data for testing
INSERT INTO public.user_metrics (user_id, words_generated, words_generated_previous_month)
SELECT 
  auth.uid(),
  45231,
  37658
WHERE 
  NOT EXISTS (SELECT 1 FROM public.user_metrics WHERE user_id = auth.uid());

INSERT INTO public.user_subscription (user_id, plan, credits_used, total_credits)
SELECT 
  auth.uid(),
  'pro',
  7800,
  10000
WHERE 
  NOT EXISTS (SELECT 1 FROM public.user_subscription WHERE user_id = auth.uid());
