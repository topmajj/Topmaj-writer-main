-- Function to get plan statistics
CREATE OR REPLACE FUNCTION get_plan_stats()
RETURNS TABLE (plan text, count bigint) 
LANGUAGE SQL
AS $$
  SELECT plan, COUNT(*) 
  FROM subscriptions 
  GROUP BY plan;
$$;

-- Function to get provider statistics
CREATE OR REPLACE FUNCTION get_provider_stats()
RETURNS TABLE (payment_provider text, count bigint) 
LANGUAGE SQL
AS $$
  SELECT payment_provider, COUNT(*) 
  FROM subscriptions 
  GROUP BY payment_provider;
$$;

-- Function to get status statistics
CREATE OR REPLACE FUNCTION get_status_stats()
RETURNS TABLE (status text, count bigint) 
LANGUAGE SQL
AS $$
  SELECT status, COUNT(*) 
  FROM subscriptions 
  GROUP BY status;
$$;

-- Function to get credits statistics
CREATE OR REPLACE FUNCTION get_credits_stats()
RETURNS TABLE (total_credits bigint, used_credits bigint) 
LANGUAGE SQL
AS $$
  SELECT 
    COALESCE(SUM(total_credits), 0) as total_credits,
    COALESCE(SUM(used_credits), 0) as used_credits
  FROM credits;
$$;
