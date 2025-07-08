-- 解説画像テーブルを作成
CREATE TABLE explanation_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  explanation_id UUID REFERENCES explanations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  position INTEGER NOT NULL, -- 解説内での表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定
ALTER TABLE explanation_images ENABLE ROW LEVEL SECURITY;

-- 自分の画像のみ閲覧・編集可能
CREATE POLICY "Users can view their own explanation images" ON explanation_images
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM explanations WHERE id = explanation_id
  ));

CREATE POLICY "Users can insert their own explanation images" ON explanation_images
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM explanations WHERE id = explanation_id
  ));

CREATE POLICY "Users can update their own explanation images" ON explanation_images
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM explanations WHERE id = explanation_id
  ));

CREATE POLICY "Users can delete their own explanation images" ON explanation_images
  FOR DELETE USING (auth.uid() IN (
    SELECT user_id FROM explanations WHERE id = explanation_id
  ));

-- 管理者は全件閲覧・編集可能
CREATE POLICY "Admins can manage all explanation images" ON explanation_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 公開ユーザーの解説画像は誰でも閲覧可能
CREATE POLICY "Anyone can view public user explanation images" ON explanation_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM explanations e
      JOIN profiles p ON e.user_id = p.id
      WHERE e.id = explanation_id AND p.is_public = true
    )
  );

-- インデックスを作成
CREATE INDEX idx_explanation_images_explanation_id ON explanation_images(explanation_id);
CREATE INDEX idx_explanation_images_position ON explanation_images(position); 