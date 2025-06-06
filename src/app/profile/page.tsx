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

interface VirtualContestContest {
  id: string;
  name: string;
}

interface VirtualContest {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  score: number;
  contest_id: string | null;
  contests: VirtualContestContest | null;
}

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });
  const session = await supabase.auth.getSession();

  if (!session.data.session) {
    redirect('/auth');
  }

  const userId = session.data.session.user.id;

  // ユーザー情報の取得
  const { data: userData } = await supabase
    .from('users')
    .select('username')
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
  const { data: virtualContests } = await supabase
    .from('virtual_contests')
    .select(`
      id,
      start_time,
      end_time,
      status,
      score,
      contest_id,
      contests!inner (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={4}>プロフィール</Heading>
          <ProfileForm initialUsername={userData?.username || ''} userId={userId} />
        </Box>
        <Box>
          <Heading as="h2" size="lg" mb={4}>学習データ</Heading>
          <LearningData submissions={submissions || []} virtualContests={virtualContests || []} />
        </Box>
      </VStack>
    </Container>
  );
} 