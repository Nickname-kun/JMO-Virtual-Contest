"use client";

import { Box, Text, Spinner, VStack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session) {
      // セッションがあればルートにリダイレクト
      router.push('/');
    } else if (session === null) {
      // セッションがなく、エラーがある場合なども考慮し、
      // 必要であればエラー表示やログインページへのリダイレクトなどを追加
      console.log("認証セッションが見つかりませんでした。");
      // router.push('/auth'); // 例: セッションがない場合はログインページへ
    }
  }, [session, router]);

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
