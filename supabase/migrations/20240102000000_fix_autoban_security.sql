-- Security fix: Remove automatic banning, require manual review instead
-- This prevents coordinated false reporting attacks

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_misconduct_report_insert ON misconduct_reports;
DROP FUNCTION IF EXISTS update_reports_count();

-- Create new function that only increments count and flags for review
CREATE OR REPLACE FUNCTION update_reports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reports_count = reports_count + 1
  WHERE id = NEW.reported_id;

  -- Note: Banning is now manual-only. Admins should review users with reports_count > 5
  -- Consider creating an admin dashboard to review flagged users

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_misconduct_report_insert
  AFTER INSERT ON misconduct_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_count();

-- Add a column to track if user is flagged for review (optional, for admin dashboard)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;

-- Create a function to flag users when they reach the threshold
CREATE OR REPLACE FUNCTION flag_user_for_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Flag user for review if they reach 5 reports
  IF NEW.reports_count >= 5 AND OLD.reports_count < 5 THEN
    UPDATE profiles
    SET flagged_for_review = TRUE
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to flag users for review
CREATE TRIGGER on_reports_count_updated
  AFTER UPDATE OF reports_count ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION flag_user_for_review();

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_flagged ON profiles(flagged_for_review) WHERE flagged_for_review = TRUE;
