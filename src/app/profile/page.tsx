import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Button } from '@chakra-ui/react';
// import FeedbackToast from './FeedbackToast'; // FeedbackToastのインポートを削除
import ProfileForm from './profile-form'; // 後で作成するProfileFormをインポート
import LearningData from './learning-data'; // LearningDataコンポーネントをインポート
import PasswordChangeForm from './PasswordChangeForm'; // パスワード変更フォームをインポート
import DeleteAccountButton from './DeleteAccountButton'; // アカウント削除ボタンをインポート

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: {
    session
  } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, is_admin') // 必要に応じて他のカラムも取得
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    // エラー表示やリダイレクトなどを検討
    return <Box>プロフィールの読み込みに失敗しました。</Box>; // エラー表示を追加
  }

  // ユーザーの提出履歴を取得（関連する問題情報も結合）
  const { data: submissionsData, error: submissionsError } = await supabase
    .from('submissions')
    .select(`
      id,
      problem_id,
      answer,
      is_correct,
      submitted_at,
      problems!inner ( id, title, number, field )
    `)
    .eq('user_id', session.user.id)
    .order('submitted_at', { ascending: false });

  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
    // エラーハンドリング
  }

  // 型に合わせてデータを変換
  const submissions = submissionsData?.map(submission => ({
    ...submission,
    problems: submission.problems[0] // 配列の最初の要素を取得
  })) || [];

  // ユーザーのバーチャルコンテスト履歴を取得（関連するコンテスト情報も結合）
  const { data: virtualContestsData, error: virtualContestsError } = await supabase
    .from('virtual_contests')
    .select(`
      id,
      start_time,
      end_time,
      status,
      score,
      contest_id,
      contests!inner ( id, name )
    `)
    .eq('user_id', session.user.id)
    .order('start_time', { ascending: false });

  if (virtualContestsError) {
    console.error('Error fetching virtual contests:', virtualContestsError);
    // エラーハンドリング
  }

  // 型に合わせてデータを変換
  const virtualContests = virtualContestsData?.map(contest => ({
    ...contest,
    contests: contest.contests[0] // 配列の最初の要素を取得
  })) || [];

  // Server Action for updating username - Called directly from Client Component
  // sessionは直接参照せず、Server Action内でcookiesからsupabaseクライアントを作成して取得
  const updateUsername = async (formData: FormData): Promise<{ status: string; message: string }> => {
    'use server';

    // Server Action内で改めてcookiesからsupabaseクライアントを作成し、セッションを取得
    const supabaseServer = createServerComponentClient({ cookies });
     const { data: { session: serverSession } } = await supabaseServer.auth.getSession();

    if (!serverSession) {
      return { status: 'error', message: '認証されていません。', };
    }

    const newUsername = formData.get('username') as string;
    const userId = serverSession.user.id;

    if (!newUsername || newUsername.trim() === '') {
        return JSON.parse(JSON.stringify({ status: 'error', message: 'ユーザー名は空にできません。' }));
    }

    const { error } = await supabaseServer
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', userId);

    if (error) {
      console.error('Error updating username:', error);
       return JSON.parse(JSON.stringify({ status: 'error', message: error.message }));
    } else {
      console.log('Username updated successfully!');
       return JSON.parse(JSON.stringify({ status: 'success', message: 'ユーザー名が更新されました！' }));
    }
  };

  return (
    <Box p={8} maxW="container.md" mx="auto">
      {/* <FeedbackToast /> */}
      <VStack spacing={6} align="start">
        <Heading as="h1" size="xl">マイページ</Heading>
        <Text fontSize="lg">現在のユーザー: {profile?.username || session.user.email} さん</Text>

        <Box mt={8} w="full">
          <Heading as="h2" size="lg" mb={4}>プロフィール編集</Heading>
          {/* ProfileForm Client Component に初期データとServer Actionを渡す */}
          <ProfileForm initialProfile={profile} updateUsernameAction={updateUsername} />
        </Box>

        {/* パスワード変更フォームを追加 */}
        <PasswordChangeForm />

        {/* アカウント削除ボタンを追加 */}
        <Box mt={8} w="full">
          <Heading as="h2" size="lg" mb={4}>アカウント削除</Heading>
          <DeleteAccountButton />
        </Box>

        {/* 学習データ表示コンポーネントにデータを渡す */}
        <Box mt={8} w="full">
          <Heading as="h2" size="lg" mb={4}>学習データ</Heading>
          <LearningData submissions={submissions} virtualContests={virtualContests} />
        </Box>

      </VStack>
    </Box>
  );
} 