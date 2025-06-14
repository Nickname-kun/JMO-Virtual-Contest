-- 回答の「いいね」テーブルを作成
CREATE TABLE answer_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(answer_id, user_id)
);

-- RLSポリシーを設定
ALTER TABLE answer_likes ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが「いいね」を閲覧可能
CREATE POLICY "全ユーザーが「いいね」を閲覧可能" ON answer_likes
  FOR SELECT USING (true);

-- 認証済みユーザーのみ「いいね」を追加可能
CREATE POLICY "認証済みユーザーのみ「いいね」を追加可能" ON answer_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは自分の「いいね」のみ削除可能
DROP POLICY IF EXISTS "認証済みユーザーは自分の「いいね」のみ削除可能" ON answer_likes;
CREATE POLICY "認証済みユーザーは自分の「いいね」のみ削除可能" ON answer_likes
  FOR DELETE USING (auth.uid() = user_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true); 