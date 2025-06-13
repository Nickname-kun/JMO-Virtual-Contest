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

// コンテスト名を元にカテゴリを判定するヘルパー関数
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

export default async function ContestsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: contests, error } = await supabase
    .from('contests')
    .select('name, year'); // 名前と年度のみ取得

  if (error) {
    console.error('Error fetching contests:', error);
    return <Text textAlign="center" py={8}>コンテスト情報の読み込みに失敗しました。</Text>;
  }

  // ユニークな年度を抽出して降順にソート
  const uniqueYears = Array.from(new Set(contests?.map(c => c.year))).sort((a, b) => b - a);

  // ユニークなカテゴリを抽出してソート
  const uniqueCategories = Array.from(new Set(contests?.map(c => getContestCategory(c.name)))).sort();

  return (
    <Box maxW="4xl" mx="auto" py={10} px={4}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        コンテスト一覧
      </Heading>

      {/* 年度別リンク */}
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={6}>年度別コンテスト</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {uniqueYears.map((year) => (
            <Link key={year} href={`/contests/year/${year}`} passHref>
              <Button size="lg" colorScheme="blue" variant="outline" width="full">
                {year}年
              </Button>
            </Link>
          ))}
        </SimpleGrid>
      </Box>

      {/* カテゴリ別リンク */}
      <Box>
        <Heading as="h2" size="lg" mb={6}>カテゴリ別コンテスト</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {uniqueCategories.map((category) => (
            <Link key={category} href={`/contests/category/${encodeURIComponent(category)}`} passHref>
              <Button size="lg" colorScheme="purple" variant="outline" width="full">
                {category}
              </Button>
            </Link>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
} 