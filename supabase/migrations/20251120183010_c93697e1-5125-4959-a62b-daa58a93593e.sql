-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('artist', 'organizer');

-- Create enum for artistic branches
CREATE TYPE public.artistic_branch AS ENUM (
  'music',
  'dance',
  'theater',
  'visual_arts',
  'circus',
  'magic',
  'comedy',
  'dj',
  'live_painting',
  'performance',
  'other'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type public.user_type NOT NULL,
  full_name TEXT NOT NULL,
  pronouns TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create artist_profiles table for artist-specific data
CREATE TABLE public.artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  artistic_branches public.artistic_branch[] NOT NULL DEFAULT '{}',
  portfolio_items JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  location TEXT,
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organizer_profiles table for organizer-specific data
CREATE TABLE public.organizer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  event_types TEXT[] DEFAULT '{}',
  preferred_branches public.artistic_branch[] DEFAULT '{}',
  budget_range TEXT,
  location TEXT,
  event_frequency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Artist profiles policies
CREATE POLICY "Users can view all artist profiles"
  ON public.artist_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Artists can insert their own profile"
  ON public.artist_profiles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND id = auth.uid() AND user_type = 'artist'
  ));

CREATE POLICY "Artists can update their own profile"
  ON public.artist_profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND id = auth.uid()
  ));

-- Organizer profiles policies
CREATE POLICY "Users can view all organizer profiles"
  ON public.organizer_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can insert their own profile"
  ON public.organizer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND id = auth.uid() AND user_type = 'organizer'
  ));

CREATE POLICY "Organizers can update their own profile"
  ON public.organizer_profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_organizer_profiles_updated_at
  BEFORE UPDATE ON public.organizer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();