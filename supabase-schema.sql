-- =============================================
-- 개인 홈페이지 Supabase 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 좋아요 테이블 (비회원 가능, 세션 ID 기반)
CREATE TABLE IF NOT EXISTS likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS likes_slug_session ON likes(slug, session_id);

-- 2. 댓글 테이블 (소셜 로그인 필요)
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS 활성화
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. 좋아요 정책
CREATE POLICY "Anyone can read likes"
  ON likes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert likes"
  ON likes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete likes"
  ON likes FOR DELETE USING (true);

-- 5. 댓글 정책
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);
