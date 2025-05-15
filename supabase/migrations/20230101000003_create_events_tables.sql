-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  organizer TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_url TEXT,
  image_url TEXT,
  is_community_event BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy for selecting events (anyone can view events)
CREATE POLICY "Anyone can view events" 
  ON events FOR SELECT 
  USING (true);

-- Policy for inserting events (authenticated users only)
CREATE POLICY "Authenticated users can insert events" 
  ON events FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating events (only the creator can update)
CREATE POLICY "Users can update their own events" 
  ON events FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Policy for deleting events (only the creator can delete)
CREATE POLICY "Users can delete their own events" 
  ON events FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS events_date_idx ON events (date);
CREATE INDEX IF NOT EXISTS events_type_idx ON events (event_type);
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events (user_id);
