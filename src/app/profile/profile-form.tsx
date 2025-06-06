"use client";

import { Box, VStack, FormControl, FormLabel, Input, Button, useToast, FormHelperText } from '@chakra-ui/react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileFormProps {
  initialUsername: string;
  // updateUsernameAction: (formData: FormData) => Promise<{ status: string; message: string }>; // サーバーアクションは不要になるためコメントアウトまたは削除
}

export default function ProfileForm({
  initialUsername,
  // updateUsernameAction, // サーバーアクションは不要になるためコメントアウトまたは削除
}: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const supabase = createClientComponentClient(); // クライアントサイドでSupabaseクライアントを初期化

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const MAX_USERNAME_LENGTH = 15; // 最大文字数を15に変更

    if (username.trim().length === 0) {
       toast({
        title: 'エラー',
        description: 'ユーザー名は空にできません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    if (username.trim().length > MAX_USERNAME_LENGTH) {
      toast({
        title: 'エラー',
        description: `ユーザー名は${MAX_USERNAME_LENGTH}文字以内で入力してください。`, // 最大文字数を超えた場合のエラーメッセージ
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // ユーザー名の重複チェック
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (existingUser) {
      toast({
        title: 'エラー',
        description: 'このユーザー名は既に使用されています。別のユーザー名を選択してください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // クライアントサイドからSupabaseを使ってユーザー名を更新
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast({
        title: 'エラー',
        description: 'ユーザー情報の取得に失敗しました。', // または適切なエラーメッセージ
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating username:', updateError);
       toast({
        title: 'エラー',
        description: updateError.message, // または適切なエラーメッセージ
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
       toast({
        title: '成功',
        description: 'ユーザー名が更新されました！',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="start">
        <FormControl id="username">
          <FormLabel>ユーザー名</FormLabel>
          <Input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <FormHelperText>ユーザー名は15文字以内で入力してください。</FormHelperText>
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          ユーザー名を更新
        </Button>
      </VStack>
    </form>
  );
} 