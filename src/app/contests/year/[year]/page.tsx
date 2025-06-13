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

export default async function ContestsByYearPage({
  params,
}: {
  params: { year: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const targetYear = parseInt(params.year);

  const { data: contests, error } = await supabase
    .from('contests')
    .select('*')
    .eq('year', targetYear)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contests by year:', error);
    return <Text textAlign="center" py={8}>コンテストの読み込みに失敗しました。</Text>;
  }

  return (
    <Box maxW="4xl" mx="auto" py={10} px={4}>
      <Button as={Link} href="/contests" variant="outline" colorScheme="gray" mb={6}>
        コンテスト一覧に戻る
      </Button>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        {targetYear}年のコンテスト
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {contests?.map((c: Contest) => (
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