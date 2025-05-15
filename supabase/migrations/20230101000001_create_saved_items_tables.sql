-- Create saved verses table
CREATE TABLE IF NOT EXISTS public.saved_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  verse TEXT NOT NULL,
  reference TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create saved churches table
CREATE TABLE IF NOT EXISTS public.saved_churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  vicinity TEXT,
  place_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.saved_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_churches ENABLE ROW LEVEL SECURITY;

-- Create policies for saved verses
CREATE POLICY "Users can view their own saved verses" 
  ON public.saved_verses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved verses" 
  ON public.saved_verses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved verses" 
  ON public.saved_verses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for saved churches
CREATE POLICY "Users can view their own saved churches" 
  ON public.saved_churches 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved churches" 
  ON public.saved_churches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved churches" 
  ON public.saved_churches 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX saved_verses_user_id_idx ON public.saved_verses(user_id);
CREATE INDEX saved_churches_user_id_idx ON public.saved_churches(user_id);
