-- Create generated_images table (if not already exists)
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT,
  dimensions TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS generated_images_user_id_idx ON generated_images(user_id);

-- Add open_graph_image column if it doesn't exist
ALTER TABLE generated_content 
ADD COLUMN IF NOT EXISTS open_graph_image TEXT;
