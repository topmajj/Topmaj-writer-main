-- Create a function to increment credits
CREATE OR REPLACE FUNCTION increment_credits(user_id_param UUID, increment_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE credits
  SET used_credits = used_credits + increment_amount
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
