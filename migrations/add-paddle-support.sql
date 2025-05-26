-- Add Paddle-specific columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20),
ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paddle_price_id VARCHAR(255);

-- Update existing records to use Stripe as payment provider
UPDATE subscriptions 
SET payment_provider = 'stripe' 
WHERE stripe_customer_id IS NOT NULL AND payment_provider IS NULL;

-- Add index for paddle customer ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer_id ON subscriptions(paddle_customer_id);
