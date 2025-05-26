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

-- Create the count_candidates_by_status function in Supabase
CREATE OR REPLACE FUNCTION count_candidates_by_status(user_id UUID)
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE SQL
AS $$
  SELECT 
    candidates.status,
    COUNT(*) as count
  FROM candidates
  WHERE candidates.created_by = user_id
  GROUP BY candidates.status
  ORDER BY candidates.status;
$$;

-- Function to get assigned and unassigned candidates for a quiz
CREATE OR REPLACE FUNCTION get_candidates_for_quiz_assignment(quiz_id_param UUID, p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position_id UUID;
  v_assigned_interviews jsonb;
  v_unassigned_candidates jsonb;
  v_quiz_exists BOOLEAN;
  v_quiz jsonb;
  v_position jsonb;
BEGIN
  -- Check if the quiz exists and belongs to the user
  SELECT EXISTS (
    SELECT 1
    FROM quizzes
    WHERE id = quiz_id_param AND created_by = p_user_id
  ) INTO v_quiz_exists;

  IF NOT v_quiz_exists THEN
    RETURN jsonb_build_object(
      'error', 'Quiz not found or user does not have permission.',
      'assigned_interviews', '[]'::jsonb,
      'unassigned_candidates', '[]'::jsonb,
      'quiz', NULL,
      'position', NULL
    );
  END IF;

  -- Get the quiz details
  SELECT row_to_json(q) INTO v_quiz
  FROM (
    SELECT id, title, position_id, time_limit, created_by
    FROM quizzes
    WHERE id = quiz_id_param
  ) q;

  -- Get the position_id for the quiz
  SELECT position_id INTO v_position_id
  FROM quizzes
  WHERE id = quiz_id_param;

  -- Get the position details
  SELECT row_to_json(p) INTO v_position
  FROM (
    SELECT id, title
    FROM positions
    WHERE id = v_position_id
  ) p;

  -- Get interviews (assigned candidates) for this quiz
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id, -- interview id
    'token', i.token,
    'status', i.status,
    'created_at', i.created_at,
    'started_at', i.started_at,
    'completed_at', i.completed_at,
    'candidate_id', c.id,
    'candidate_name', c.name,
    'candidate_email', c.email,
    'quiz_id', q.id,
    'quiz_title', q.title
  )), '[]'::jsonb)
  INTO v_assigned_interviews
  FROM interviews i
  JOIN candidates c ON i.candidate_id = c.id
  JOIN quizzes q ON i.quiz_id = q.id
  WHERE i.quiz_id = quiz_id_param;

  -- Get candidates in the same position, created by the user, who are not yet assigned to this quiz
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'email', c.email,
      'status', c.status
    )), '[]'::jsonb)
  INTO v_unassigned_candidates
  FROM candidates c
  WHERE c.position_id = v_position_id
    AND c.created_by = p_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM interviews i_check
      WHERE i_check.candidate_id = c.id AND i_check.quiz_id = quiz_id_param
    );

  RETURN jsonb_build_object(
    'assigned_interviews', v_assigned_interviews,
    'unassigned_candidates', v_unassigned_candidates,
    'quiz', v_quiz,
    'position', v_position
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_interviews(
  p_user_id UUID,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_position_id UUID DEFAULT NULL,
  p_programming_language TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  token TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  score FLOAT,
  candidate_id UUID,
  candidate_name TEXT,
  candidate_email TEXT,
  quiz_id UUID,
  quiz_title TEXT,
  position_id UUID,
  position_title TEXT,
  position_skills TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.token,
    i.status,
    i.started_at,
    i.completed_at,
    i.created_at,
    i.score,
    c.id AS candidate_id,
    c.name AS candidate_name,
    c.email AS candidate_email,
    q.id AS quiz_id,
    q.title AS quiz_title,
    p.id AS position_id,
    p.title AS position_title,
    p.skills AS position_skills
  FROM interviews i
  JOIN candidates c ON i.candidate_id = c.id
  JOIN quizzes q ON i.quiz_id = q.id
  JOIN positions p ON q.position_id = p.id
  WHERE c.created_by = p_user_id
    AND (p_status IS NULL OR p_status = 'all' OR i.status = p_status)
    AND (p_position_id IS NULL OR p_position_id::text = 'all' OR p.id = p_position_id)
    AND (
      p_programming_language IS NULL
      OR p_programming_language = 'all'
      OR p_programming_language = ANY(p.skills)
    )
    AND (
      p_search IS NULL
      OR p_search = ''
      OR c.name ILIKE '%' || p_search || '%'
      OR c.email ILIKE '%' || p_search || '%'
      OR q.title ILIKE '%' || p_search || '%'
      OR p.title ILIKE '%' || p_search || '%'
    )
  ORDER BY i.created_at DESC
  OFFSET ((p_page - 1) * p_limit)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;