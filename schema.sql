-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'recruiter',
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  experience_level TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  soft_skills TEXT[],
  contract_type TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  resume_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  time_limit INTEGER,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score FLOAT,
  answers JSONB,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interviews_candidate_id_idx ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS interviews_quiz_id_idx ON public.interviews(quiz_id);
CREATE INDEX IF NOT EXISTS interviews_token_idx ON public.interviews(token);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for positions
CREATE POLICY "Anyone can view position title by quiz token"
  ON positions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own positions"
  ON positions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own positions"
  ON positions FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own positions"
  ON positions FOR DELETE
  USING (auth.uid() = created_by);

-- Create policies for candidates
CREATE POLICY "Users can view their own candidates"
  ON candidates FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view candidate by interview token"
  ON candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.candidate_id = candidates.id
      AND interviews.token IS NOT NULL
    )
  );

CREATE POLICY "Users can insert their own candidates"
  ON candidates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own candidates"
  ON candidates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own candidates"
  ON candidates FOR DELETE
  USING (auth.uid() = created_by);

-- Create policies for quizzes
CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view quiz by interview token"
  ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.quiz_id = quizzes.id
      AND interviews.token IS NOT NULL
    )
  );

CREATE POLICY "Users can insert their own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = created_by);

-- Create policies for interviews
CREATE POLICY "Anyone can access interviews by token"
  ON interviews FOR SELECT
  USING (token IS NOT NULL);

CREATE POLICY "Users can insert interviews for their candidates"
  ON interviews FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidates
    WHERE candidates.id = interviews.candidate_id
    AND candidates.created_by = auth.uid()
  ));

CREATE POLICY "Users can update interviews for their candidates"
  ON interviews FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM candidates
    WHERE candidates.id = interviews.candidate_id
    AND candidates.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete interviews for their candidates"
  ON interviews FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM candidates
    WHERE candidates.id = interviews.candidate_id
    AND candidates.created_by = auth.uid()
  ));

-- Create policy for public interview access by token
CREATE POLICY "Anyone can access interviews by token"
  ON interviews FOR SELECT
  USING (true);

-- Create function to get user by auth.uid
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', auth.uid(),
    'email', (SELECT email FROM auth.users WHERE id = auth.uid()),
    'role', (SELECT role FROM profiles WHERE user_id = auth.uid())
  )
$$;

-- Create function to check if user owns a position
CREATE OR REPLACE FUNCTION user_owns_position(position_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM positions
    WHERE id = position_id
    AND created_by = auth.uid()
  )
$$;

-- Create function to check if user owns a candidate
CREATE OR REPLACE FUNCTION user_owns_candidate(candidate_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM candidates
    WHERE id = candidate_id
    AND created_by = auth.uid()
  )
$$;

-- Create function to check if user owns a quiz
CREATE OR REPLACE FUNCTION user_owns_quiz(quiz_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM quizzes
    WHERE id = quiz_id
    AND created_by = auth.uid()
  )
$$;

-- Create a function to count quizzes by position
CREATE OR REPLACE FUNCTION count_quizzes_by_position()
RETURNS TABLE (
  position_id TEXT,
  position_title TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::TEXT as position_id,
    p.title as position_title,
    COUNT(q.id) as count
  FROM 
    positions p
  LEFT JOIN 
    quizzes q ON p.id = q.position_id
  GROUP BY 
    p.id, p.title
  ORDER BY 
    count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique tokens
CREATE OR REPLACE FUNCTION generate_unique_token()
RETURNS VARCHAR AS $$
DECLARE
  token VARCHAR;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a random token
    token := encode(gen_random_bytes(12), 'hex');
    
    -- Check if token already exists
    SELECT EXISTS (
      SELECT 1 FROM public.interviews WHERE interviews.token = token
    ) INTO exists_already;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT exists_already;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically generate tokens
CREATE OR REPLACE FUNCTION set_interview_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := generate_unique_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER set_interview_token_trigger
BEFORE INSERT ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION set_interview_token();