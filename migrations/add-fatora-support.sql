-- Add Fatora-specific columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS fatora_order_id TEXT,
ADD COLUMN IF NOT EXISTS fatora_payment_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_fatora_order_id
ON subscriptions(fatora_order_id);
