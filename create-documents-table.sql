-- Create a function to create the documents table if it doesn't exist
CREATE OR REPLACE FUNCTION create_documents_table()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'documents'
  ) THEN
    -- Create the documents table
    CREATE TABLE public.documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY documents_policy ON public.documents
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;
