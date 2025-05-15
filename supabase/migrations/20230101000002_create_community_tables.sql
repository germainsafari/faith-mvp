-- Create topics table
CREATE TABLE IF NOT EXISTS public.community_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  replies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);

-- Create posts table (replies to topics)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES public.community_topics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  likes_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE -- For thread replies
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create community groups table
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create group members table
CREATE TABLE IF NOT EXISTS public.community_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for topics
CREATE POLICY "Everyone can view topics" 
  ON public.community_topics 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create topics" 
  ON public.community_topics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" 
  ON public.community_topics 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" 
  ON public.community_topics 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for posts
CREATE POLICY "Everyone can view posts" 
  ON public.community_posts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create posts" 
  ON public.community_posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.community_posts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.community_posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "Users can view likes" 
  ON public.community_likes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own likes" 
  ON public.community_likes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
  ON public.community_likes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for groups
CREATE POLICY "Everyone can view groups" 
  ON public.community_groups 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create groups" 
  ON public.community_groups 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups" 
  ON public.community_groups 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" 
  ON public.community_groups 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Create policies for group members
CREATE POLICY "Everyone can view group members" 
  ON public.community_group_members 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join groups" 
  ON public.community_group_members 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
  ON public.community_group_members 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
  ON public.community_group_members 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create functions for updating topics replies count
CREATE OR REPLACE FUNCTION public.increment_topic_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_topics
  SET replies_count = replies_count + 1
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_topic_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_topics
  SET replies_count = replies_count - 1
  WHERE id = OLD.topic_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.community_posts
  FOR EACH ROW EXECUTE PROCEDURE public.increment_topic_replies_count();

CREATE TRIGGER on_post_deleted
  AFTER DELETE ON public.community_posts
  FOR EACH ROW EXECUTE PROCEDURE public.decrement_topic_replies_count();

-- Create indexes for better performance
CREATE INDEX community_topics_user_id_idx ON public.community_topics(user_id);
CREATE INDEX community_posts_topic_id_idx ON public.community_posts(topic_id);
CREATE INDEX community_posts_user_id_idx ON public.community_posts(user_id);
CREATE INDEX community_posts_parent_id_idx ON public.community_posts(parent_id);
CREATE INDEX community_likes_post_id_idx ON public.community_likes(post_id);
CREATE INDEX community_likes_user_id_idx ON public.community_likes(user_id);
CREATE INDEX community_groups_created_by_idx ON public.community_groups(created_by);
CREATE INDEX community_group_members_group_id_idx ON public.community_group_members(group_id);
CREATE INDEX community_group_members_user_id_idx ON public.community_group_members(user_id);
