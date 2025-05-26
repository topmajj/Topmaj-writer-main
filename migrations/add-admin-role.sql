-- Check if the column exists before adding it to user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create a function to promote a user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET is_admin = TRUE
    WHERE id = profile_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to promote a user to admin by user_id
CREATE OR REPLACE FUNCTION promote_to_admin_by_user_id(auth_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET is_admin = TRUE
    WHERE user_id = auth_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to demote an admin to regular user
CREATE OR REPLACE FUNCTION demote_from_admin(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET is_admin = FALSE
    WHERE id = profile_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to demote an admin by user_id
CREATE OR REPLACE FUNCTION demote_from_admin_by_user_id(auth_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET is_admin = FALSE
    WHERE user_id = auth_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_user_admin(auth_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status
    FROM user_profiles
    WHERE user_id = auth_user_id;
    
    RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql;
