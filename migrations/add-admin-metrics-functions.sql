-- Function to get total users count
CREATE OR REPLACE FUNCTION get_total_users_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(DISTINCT user_id) FROM subscriptions);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_total_users_count() TO authenticated;
