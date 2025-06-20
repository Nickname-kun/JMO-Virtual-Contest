import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Button, Container } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FeedbackToast from './FeedbackToast';
import ProfileForm from './profile-form';
import LearningData from './learning-data';
import PasswordChangeForm from './PasswordChangeForm';
import DeleteAccountButton from './DeleteAccountButton';
import { Suspense } from 'react';
import { VirtualContest, VirtualContestContest } from '@/types/database';

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    redirect('/auth');
  }

  const userId = session.data.session.user.id;

  // ユーザー情報の取得
  const { data: userData } = await supabase
    .from('profiles')
    .select('username, is_public')
    .eq('id', userId)
    .single();

  // 提出履歴の取得
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      problem_id,
      answer,
      is_correct,
      submitted_at,
      problems (
        id,
        title,
        number,
        field
      )
    `)
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  // バーチャルコンテスト履歴の取得
  const { data: virtualContestsData } = await supabase
    .from('virtual_contests')
    .select(`
      id,
      start_time,
      end_time,
      status,
      score,
      contest_id,
      contests (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  // 型に合わせてデータを変換（database.tsの型に合わせる）
  const virtualContests: VirtualContest[] = virtualContestsData?.map(vc => ({
    ...vc,
    // Supabaseはリレーションを配列で返すため、取得したデータをそのまま利用
    contests: vc.contests as VirtualContestContest[] | null
  })) || [];

  // ユーザー名更新サーバーアクション（クライアントサイドに移行したため使用しないが、削除は任意）
  const updateUsernameAction = async (formData: FormData) => {
    'use server';
    const supabaseServer = createServerComponentClient({ cookies });
    const { data: { session: serverSession } } = await supabaseServer.auth.getSession();

    if (!serverSession) {
      return { status: 'error', message: '認証されていません。', };
    }

    const newUsername = formData.get('username') as string;
    const userId = serverSession.user.id;

    if (!newUsername || newUsername.trim() === '') {
        return { status: 'error', message: 'ユーザー名は空にできません。', };
    }

    const { error } = await supabaseServer
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', userId);

    if (error) {
      console.error('Error updating username:', error);
       return { status: 'error', message: error.message };
    } else {
       return { status: 'success', message: 'ユーザー名が更新されました！' };
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={4}>プロフィール</Heading>
          <Text fontSize="lg" mb={4}>現在のユーザー名: {userData?.username || '設定されていません'}</Text>
          <ProfileForm initialUsername={userData?.username || ''} initialIsPublic={userData?.is_public ?? false} />
        </Box>
        <Box>
          <Heading as="h2" size="lg" mb={4}>学習データ</Heading>
          <LearningData submissions={submissions || []} virtualContests={virtualContests || []} />
        </Box>
        <Box>
          <Heading as="h2" size="lg" mb={4}>パスワード変更</Heading>
          <Suspense fallback={<div>Loading...</div>}>
            <PasswordChangeForm />
          </Suspense>
        </Box>
        <Box>
          <Heading as="h2" size="lg" mb={4}>アカウント削除</Heading>
          <Suspense fallback={<div>Loading...</div>}>
            <DeleteAccountButton />
          </Suspense>
        </Box>
      </VStack>
    </Container>
  );
} 