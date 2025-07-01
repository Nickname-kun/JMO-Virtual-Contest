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
import ColoredUserName from '@/components/ColoredUserName';

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
    .select('username, is_public, affiliation, bio, twitter, github, website, omc, is_admin')
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
  const virtualContests = virtualContestsData || [];

  // 解説数を取得
  const { data: explanations } = await supabase
    .from('explanations')
    .select('id')
    .eq('user_id', userId);

  // ベストアンサー数を集計
  const { data: bestAnswerQuestions } = await supabase
    .from('questions')
    .select('best_answer_id')
    .not('best_answer_id', 'is', null);

  let bestAnswerCount = 0;
  if (bestAnswerQuestions) {
    const { data: myAnswers } = await supabase
      .from('answers')
      .select('id, user_id');
    const myAnswerIds = myAnswers?.filter(a => a.user_id === userId).map(a => a.id) || [];
    bestAnswerCount = bestAnswerQuestions.filter(q => myAnswerIds.includes(q.best_answer_id)).length;
  }

  // 解説No.1・ベストアンサーNo.1判定用データ取得
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, is_admin');

  // 全ユーザーの解説数を取得
  const { data: allExplanations } = await supabase
    .from('explanations')
    .select('user_id');
  const explanationCountMap: Record<string, number> = {};
  allExplanations?.forEach(e => {
    if (!allProfiles?.find(p => p.id === e.user_id)?.is_admin) {
      explanationCountMap[e.user_id] = (explanationCountMap[e.user_id] || 0) + 1;
    }
  });
  const maxExplanation = Math.max(...Object.values(explanationCountMap), 0);
  const no1ExplanationUsers = Object.entries(explanationCountMap)
    .filter(([_, cnt]) => cnt === maxExplanation)
    .map(([uid]) => uid);

  // 全ユーザーのベストアンサー数を取得
  const { data: allAnswers } = await supabase
    .from('answers')
    .select('id, user_id');
  const { data: allBestAnswerQuestions } = await supabase
    .from('questions')
    .select('best_answer_id')
    .not('best_answer_id', 'is', null);
  const bestAnswerCountMap: Record<string, number> = {};
  allBestAnswerQuestions?.forEach(q => {
    const ans = allAnswers?.find(a => a.id === q.best_answer_id);
    if (ans && !allProfiles?.find(p => p.id === ans.user_id)?.is_admin) {
      bestAnswerCountMap[ans.user_id] = (bestAnswerCountMap[ans.user_id] || 0) + 1;
    }
  });
  const maxBestAnswer = Math.max(...Object.values(bestAnswerCountMap), 0);
  const no1BestAnswerUsers = Object.entries(bestAnswerCountMap)
    .filter(([_, cnt]) => cnt === maxBestAnswer)
    .map(([uid]) => uid);

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
          <Text fontSize="lg" mb={4}>
            現在のユーザー名: {userData?.username ? (
              <ColoredUserName
                userId={userId}
                username={userData.username}
                isAdmin={userData.is_admin}
                explanationCount={explanations?.length || 0}
                bestAnswerCount={bestAnswerCount}
                isProfileLink={false}
                isExplanationNo1={!userData.is_admin && no1ExplanationUsers.includes(userId)}
                isBestAnswerNo1={!userData.is_admin && no1BestAnswerUsers.includes(userId)}
              />
            ) : '設定されていません'}
          </Text>
          <Text fontSize="md" mb={2}>
            ベストアンサー獲得回数: <b>{bestAnswerCount}</b> ／ 投稿した解説数: <b>{explanations?.length || 0}</b>
          </Text>
          <ProfileForm
            initialUsername={userData?.username || ''}
            initialIsPublic={userData?.is_public ?? false}
            initialAffiliation={userData?.affiliation || ''}
            initialBio={userData?.bio || ''}
            initialTwitter={userData?.twitter || ''}
            initialGithub={userData?.github || ''}
            initialWebsite={userData?.website || ''}
            initialOmc={userData?.omc || ''}
          />
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