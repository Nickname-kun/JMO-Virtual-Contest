-- questionsテーブルにreferenced_problem_idカラムを追加
ALTER TABLE questions
ADD COLUMN referenced_problem_id UUID REFERENCES problems(id) ON DELETE SET NULL;

-- RLSポリシーを更新
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがreferenced_problem_idを閲覧可能
CREATE POLICY "全ユーザーがreferenced_problem_idを閲覧可能" ON questions
  FOR SELECT USING (true);

-- 認証済みユーザーのみreferenced_problem_idを更新可能
CREATE POLICY "認証済みユーザーのみreferenced_problem_idを更新可能" ON questions
  FOR UPDATE USING (auth.uid() = user_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true); 