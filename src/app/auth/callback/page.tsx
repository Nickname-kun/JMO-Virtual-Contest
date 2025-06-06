"use client";

import { Box, Text, Spinner, VStack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export default function AuthCallbackPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const handleProfileUpsert = async () => {
      if (session) {
        const user = session.user;

        if (user && user.app_metadata.provider) {
          const provider = user.app_metadata.provider;
          let username = user.email; // デフォルトとしてメールアドレスを使用

          // プロバイダー固有のメタデータからユーザー名を取得
          if (provider === 'twitter' && user.user_metadata) {
            // Twitterの場合、user_metadataからnameまたはscreen_nameを取得
            username = user.user_metadata.name || user.user_metadata.screen_name || user.email;
          }
          // 他のプロバイダーを追加する場合はここに追加

          // profilesテーブルにユーザー情報をupsert
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: username as string,
              is_admin: false,
            }, { onConflict: 'id' });

          if (profileError) {
            console.error('Error upserting profile from callback page for user', user.id, ':', profileError);
            // エラー表示などのハンドリングを追加
          }
        }

        // プロフィール更新/作成後、ルートにリダイレクト
        router.push('/');
      } else if (session === null) {
        // セッションがない場合（認証失敗など）
        console.log("認証セッションが見つかりませんでした。");
        // 必要であればログインページなどへリダイレクト
        // router.push('/auth');
      }
    };

    handleProfileUpsert();

  }, [session, router, supabase]); // 依存配列にsupabaseを追加

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      bgColor="gray.100"
    >
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="xl" color="gray.700">
          認証処理中です...
        </Text>
      </VStack>
    </Box>
  );
} 
