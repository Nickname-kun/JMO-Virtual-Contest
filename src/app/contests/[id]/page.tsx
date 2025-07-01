import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Container, Heading, Text, Box, VStack, Button, Link as ChakraLink, HStack } from '@chakra-ui/react';
import VirtualStartButton from './VirtualStartButton';

interface Contest {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  pdf_url?: string;
}

export default async function ContestPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!contest) {
    return <Text>コンテストが見つかりませんでした。</Text>;
  }

  // コンテストに紐づく問題数を取得
  const { count: problemCount, error: problemCountError } = await supabase
    .from('problems')
    .select('id', { count: 'exact' })
    .eq('contest_id', params.id);

  if (problemCountError) {
    console.error('Error fetching problem count:', problemCountError);
    return <Text>問題数の取得に失敗しました。</Text>;
  }

  return (
    <Container maxW="container.md" py={8}>
      <HStack spacing={4} align="center" mb={4}>
        <Heading as="h1" size="xl">
          {contest.name}
        </Heading>
        <Button
          as={contest.pdf_url ? ChakraLink : undefined}
          href={contest.pdf_url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          colorScheme="purple"
          variant="solid"
          isDisabled={!contest.pdf_url}
          opacity={contest.pdf_url ? 1 : 0.5}
          _hover={contest.pdf_url ? {} : { cursor: 'not-allowed' }}
          size="sm"
        >
          問題PDF
        </Button>
      </HStack>
      
      <Text mb={6}>{contest.description}</Text>

      {/* 受験生への注意事項セクション */}
      <Box mt={8} mb={6}>
        <Heading as="h2" size="md" mb={4}>
          受験生への注意事項
        </Heading>
        <VStack align="start" spacing={2}>
          <Text>- 試験開始の合図があるまでは問題を開かないでください。</Text>
          <Text>- 計算機、携帯電話、スマートフォンなどの電子機器、および参考書、ノートなどの使用は認められません。</Text>
          <Text>- 問題は12問、試験時間は{contest.duration_minutes}分です。</Text>
          <Text>- 配点は各問に記載されています。</Text>
          <Text>- 解答は指定された解答欄に明確に記入してください。</Text>
          <Text>- 使用できる筆記用具は、シャープペンシル、鉛筆、ボールペン（黒または青）です。</Text>
          <Text>- 試験終了後、解答の提出方法について指示があります。</Text>
        </VStack>
      </Box>

      {/* 著作権表示を追加 */}
      <Text fontSize="sm" color="gray.700" mt={6} mb={6} textAlign="center">
        ※ JMOおよびJJMOの問題の著作権は数学オリンピック財団に帰属します。
      </Text>

      <VirtualStartButton contestId={contest.id} durationMinutes={contest.duration_minutes} problemCount={problemCount || 0} />
    </Container>
  );
} 