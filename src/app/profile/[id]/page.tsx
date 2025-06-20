import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Box, Heading, Text, VStack, Container, Tag, List, ListItem, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import LearningData from '../learning-data';

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { id } = params;


  // プロフィール情報を取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, is_public, created_at, is_admin, affiliation, bio')
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

  return (
    <Container maxW="container.sm" py={16}>
      <Box textAlign="center" p={8} borderWidth={1} borderRadius="lg" bg="white" boxShadow="md">
        <Heading size="lg" mb={2} color={profile.is_admin ? 'rgb(102, 0, 153)' : undefined}>{profile.username}</Heading>
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