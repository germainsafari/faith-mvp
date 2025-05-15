-- Add subscription_type and account_type columns to user_spotify_tokens
ALTER TABLE user_spotify_tokens 
ADD COLUMN subscription_type VARCHAR(50),
ADD COLUMN account_type VARCHAR(50),
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;

-- Create table for user's saved playlists
CREATE TABLE IF NOT EXISTS user_spotify_playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id VARCHAR(255) NOT NULL,
  playlist_name VARCHAR(255) NOT NULL,
  playlist_image_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, playlist_id)
);

-- Create table for recently played tracks
CREATE TABLE IF NOT EXISTS user_spotify_recent_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id VARCHAR(255) NOT NULL,
  track_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  album_name VARCHAR(255),
  album_image_url TEXT,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id, played_at)
);
