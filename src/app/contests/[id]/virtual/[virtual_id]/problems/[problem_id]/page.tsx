import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container, Text } from '@chakra-ui/react';
import ProblemClient from './ProblemClient';

export default async function ProblemPage({ params }: { params: { id: string; virtual_id: string; problem_id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  // 問題データ取得
  const { data: problem, error: problemError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', params.problem_id)
    .single();

  // バーチャルコンテスト情報の取得
  const { data: virtualContest, error: vcError } = await supabase
    .from('virtual_contests')
    .select('*')
    .eq('id', params.virtual_id)
    .single();

  if (problemError || !problem) {
    return <Container><Text>問題が見つかりませんでした</Text></Container>;
  }

  if (vcError || !virtualContest) {
    return <Container><Text>バーチャルコンテスト情報が見つかりませんでした</Text></Container>;
  }

  // 必要なら他のデータもここで取得

  return <ProblemClient problem={problem} params={params} userId={session.user.id} virtualContest={virtualContest} />;
} 