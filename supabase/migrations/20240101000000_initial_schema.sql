-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('talker', 'listener');
CREATE TYPE listener_status AS ENUM ('active', 'inactive');
CREATE TYPE call_request_status AS ENUM ('ringing', 'accepted', 'denied', 'timeout', 'canceled');
CREATE TYPE misconduct_category AS ENUM ('harassment', 'hate', 'sexual_content', 'scam', 'other');

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  banned BOOLEAN DEFAULT FALSE NOT NULL,
  reports_count INTEGER DEFAULT 0 NOT NULL,
  rating_avg NUMERIC(3, 2) DEFAULT 0 NOT NULL,
  rating_count INTEGER DEFAULT 0 NOT NULL,

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Listener presence table
CREATE TABLE listener_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status listener_status DEFAULT 'inactive' NOT NULL,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_denies INTEGER DEFAULT 0 NOT NULL,
  activation_until TIMESTAMP WITH TIME ZONE
);

-- Favorites table
CREATE TABLE favorites (
  talker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listener_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (talker_id, listener_id)
);

-- Call requests table
CREATE TABLE call_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listener_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  status call_request_status DEFAULT 'ringing' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  CONSTRAINT description_length CHECK (char_length(description) >= 100 AND char_length(description) <= 2000)
);

-- Call sessions table
CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listener_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  ended_reason TEXT
);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE NOT NULL,
  talker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listener_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT unique_session_rating UNIQUE (call_session_id)
);

-- Misconduct reports table
CREATE TABLE misconduct_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category misconduct_category NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT note_length CHECK (note IS NULL OR char_length(note) <= 500)
);

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_banned ON profiles(banned);
CREATE INDEX idx_listener_presence_status ON listener_presence(status);
CREATE INDEX idx_call_requests_talker ON call_requests(talker_id);
CREATE INDEX idx_call_requests_listener ON call_requests(listener_id);
CREATE INDEX idx_call_requests_status ON call_requests(status);
CREATE INDEX idx_call_sessions_talker ON call_sessions(talker_id);
CREATE INDEX idx_call_sessions_listener ON call_sessions(listener_id);
CREATE INDEX idx_ratings_listener ON ratings(listener_id);
CREATE INDEX idx_misconduct_reports_reported ON misconduct_reports(reported_id);

-- Function to update listener rating average
CREATE OR REPLACE FUNCTION update_listener_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE listener_id = NEW.listener_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE listener_id = NEW.listener_id
    )
  WHERE id = NEW.listener_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for rating updates
CREATE TRIGGER on_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_listener_rating();

-- Function to update reports count and check for ban
CREATE OR REPLACE FUNCTION update_reports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reports_count = reports_count + 1
  WHERE id = NEW.reported_id;

  -- Auto-ban if reports exceed threshold
  UPDATE profiles
  SET banned = TRUE
  WHERE id = NEW.reported_id
    AND reports_count > 5;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for misconduct reports
CREATE TRIGGER on_misconduct_report_insert
  AFTER INSERT ON misconduct_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_count();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, role, language_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    (NEW.raw_user_meta_data->>'role')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'language_code', 'en')
  );

  -- If listener, also create presence record
  IF (NEW.raw_user_meta_data->>'role') = 'listener' THEN
    INSERT INTO listener_presence (user_id, status)
    VALUES (NEW.id, 'inactive');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listener_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE misconduct_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Listener presence policies
CREATE POLICY "Listener presence is viewable by authenticated users"
  ON listener_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Listeners can update own presence"
  ON listener_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Listeners can insert own presence"
  ON listener_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = talker_id);

CREATE POLICY "Talkers can insert favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = talker_id);

CREATE POLICY "Talkers can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = talker_id);

-- Call requests policies
CREATE POLICY "Participants can view their call requests"
  ON call_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = talker_id OR auth.uid() = listener_id);

CREATE POLICY "Talkers can create call requests"
  ON call_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = talker_id);

CREATE POLICY "Participants can update call requests"
  ON call_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = talker_id OR auth.uid() = listener_id);

-- Call sessions policies
CREATE POLICY "Participants can view their sessions"
  ON call_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = talker_id OR auth.uid() = listener_id);

CREATE POLICY "Authenticated users can create sessions"
  ON call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = talker_id OR auth.uid() = listener_id);

CREATE POLICY "Participants can update their sessions"
  ON call_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = talker_id OR auth.uid() = listener_id);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Talkers can insert ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = talker_id);

-- Misconduct reports policies
CREATE POLICY "Users can view reports they created"
  ON misconduct_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
  ON misconduct_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE listener_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE call_requests;
