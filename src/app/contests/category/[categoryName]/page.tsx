import { Box, Heading, SimpleGrid, Text, VStack, Button } from '@chakra-ui/react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

type Contest = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  year: number;
};

// コンテスト名を元にカテゴリを判定するヘルパー関数 (contests/page.tsx と同じ)
const getContestCategory = (contestName: string): string => {
  if (contestName.includes('日本ジュニア数学オリンピック') || contestName.includes('JJMO')) {
    return 'JJMO';
  } else if (contestName.includes('日本数学オリンピック') || contestName.includes('JMO')) {
    return 'JMO';
  } else if (contestName.includes('JMO模試') || contestName.includes('数学オリンピック模試')) {
    return 'JMO模試';
  } else {
    return 'その他のコンテスト';
  }
};

export default async function ContestsByCategoryPage({
  params,
}: {
  params: { categoryName: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const targetCategory = decodeURIComponent(params.categoryName);

  // 全てのコンテストを取得し、カテゴリでフィルタリング
  const { data: allContests, error } = await supabase
    .from('contests')
    .select('*')
    .order('year', { ascending: false });

  if (error) {
    console.error('Error fetching all contests for category filtering:', error);
    return <Text textAlign="center" py={8}>コンテストの読み込みに失敗しました。</Text>;
  }

  const filteredContests = allContests?.filter(contest =>
    getContestCategory(contest.name) === targetCategory
  ) || [];

  return (
    <Box maxW="4xl" mx="auto" py={10} px={4}>
      <Button as={Link} href="/contests" variant="outline" colorScheme="gray" mb={6}>
        コンテスト一覧に戻る
      </Button>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        {targetCategory} コンテスト
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {filteredContests.map((c: Contest) => (
          <Box
            key={c.id}
            bg="white"
            borderRadius="xl"
            boxShadow="md"
            p={6}
            borderWidth={1}
            _hover={{ boxShadow: 'lg' }}
            transition="box-shadow 0.2s"
          >
            <VStack align="start" spacing={2}>
              <Heading as={Link} href={`/contests/${c.id}`} size="md" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                {c.name}
              </Heading>
              <Text color="gray.600" fontSize="sm">
                {c.description}
              </Text>
              <Text fontSize="sm">
                <b>開催年度:</b> {c.year}年
              </Text>
              <Text fontSize="sm">
                <b>制限時間：</b>{c.duration_minutes}分
              </Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
} 