import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Box, Heading, Text, VStack, Container, Tag, List, ListItem, Link as ChakraLink, HStack, Icon } from '@chakra-ui/react';
import Link from 'next/link';
import LearningData from '../learning-data';
import { FaXTwitter, FaGithub, FaGlobe } from 'react-icons/fa6';
import SnsLinks from './SnsLinks';
import ColoredUserName from '@/components/ColoredUserName';

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { id } = params;


  // プロフィール情報を取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, is_public, created_at, is_admin, affiliation, bio, twitter, github, website, omc')
    .eq('id', id)
    .single();


  if (!profile) {
    notFound();
  }

  if (!profile.is_public) {
    return (
      <Container maxW="container.sm" py={16}>
        <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg" bg="gray.50">
          <Heading size="md" mb={4}>このプロフィールは非公開です</Heading>
          <Text>このユーザーはプロフィールを公開していません。</Text>
        </Box>
      </Container>
    );
  }

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
    .eq('user_id', id)
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
    .eq('user_id', id)
    .order('start_time', { ascending: false });

  const virtualContests = virtualContestsData?.map(vc => ({
    ...vc,
    contests: vc.contests
  })) || [];

  // 解説一覧を取得
  const { data: explanations } = await supabase
    .from('explanations')
    .select('id, title, problem_id, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // ベストアンサー数を集計
  const { data: bestAnswerQuestions } = await supabase
    .from('questions')
    .select('best_answer_id')
    .not('best_answer_id', 'is', null);

  let bestAnswerCount = 0;
  if (bestAnswerQuestions) {
    // answersテーブルから自分のuser_idのものだけカウント
    const { data: myAnswers } = await supabase
      .from('answers')
      .select('id, user_id');
    const myAnswerIds = myAnswers?.filter(a => a.user_id === id).map(a => a.id) || [];
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
  // まずanswersを全件取得
  const { data: allAnswers } = await supabase
    .from('answers')
    .select('id, user_id');
  // best_answer_idがnullでないquestionsを全件取得
  const { data: allBestAnswerQuestions } = await supabase
    .from('questions')
    .select('best_answer_id')
    .not('best_answer_id', 'is', null);
  // user_idごとにカウント
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

  return (
    <Container maxW="container.sm" py={16}>
      <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg" bg="white" boxShadow="md">
        <Heading size="lg" mb={2}>
          <ColoredUserName
            userId={id}
            username={profile.username}
            isAdmin={profile.is_admin}
            explanationCount={explanations?.length || 0}
            bestAnswerCount={bestAnswerCount}
            isProfileLink={false}
            isExplanationNo1={!profile.is_admin && no1ExplanationUsers.includes(id)}
            isBestAnswerNo1={!profile.is_admin && no1BestAnswerUsers.includes(id)}
          />
        </Heading>
        <Text fontSize="md" mb={2}>
          ベストアンサー獲得回数: <b>{bestAnswerCount}</b> ／ 投稿した解説数: <b>{explanations?.length || 0}</b>
        </Text>
        {profile.affiliation && (
          <Text color="gray.600" fontSize="md" mb={1}>所属: {profile.affiliation}</Text>
        )}
        {profile.bio && (
          <Text color="gray.700" fontSize="sm" mb={2}>{profile.bio}</Text>
        )}
        <Tag colorScheme="teal" mb={4}>公開プロフィール</Tag>
        <Text color="gray.500" fontSize="sm" mb={2}>
          登録日: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
        </Text>
        <SnsLinks twitter={profile.twitter} github={profile.github} website={profile.website} omc={profile.omc} />
        {/* 学習データ（分野別正答率・バーチャルコンテスト履歴・ランク分布グラフなど） */}
        <Box mt={8} textAlign="left">
          <LearningData submissions={submissions as any[] || []} virtualContests={virtualContests as any[] || []} />
        </Box>
        {/* 投稿した解説一覧 */}
        <Box mt={8} textAlign="left">
          <Heading as="h2" size="md" mb={2}>投稿した解説一覧</Heading>
          {(!explanations || explanations.length === 0) ? (
            <Text color="gray.500" fontSize="sm">まだ解説はありません。</Text>
          ) : (
            <List spacing={2}>
              {explanations.map((exp: any) => (
                <ListItem key={exp.id}>
                  <ChakraLink as={Link} href={`/problems/${exp.problem_id}/explanations`} color="blue.600" _hover={{ textDecoration: 'underline' }}>
                    {exp.title || '（タイトルなし）'}
                  </ChakraLink>
                  <Text as="span" color="gray.400" fontSize="xs" ml={2}>{new Date(exp.created_at).toLocaleDateString()}</Text>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Container>
  );
} 