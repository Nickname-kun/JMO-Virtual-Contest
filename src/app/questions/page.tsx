import { Box, Container, Heading, VStack, Button, HStack } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import QuestionList from '@/components/questions/QuestionList';
import QuestionFilter from '@/components/questions/QuestionFilter';
import Link from 'next/link';
import { QuestionWithDetails } from '@/types/question';

export default async function QuestionsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      *,
      category:categories(*),
      user:profiles(*),
      answers(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error fetching questions:', error);
  }

  // 取得したデータをQuestionWithDetails型にマッピング
  const questionsWithDetails: QuestionWithDetails[] = questions?.map(q => ({
    ...q,
    category: q.category as any, // 型アサーションまたは適切なマッピング
    user: q.user as any, // 型アサーションまたは適切なマッピング
    answers: q.answers as any || [], // Supabaseから返されるanswersデータをそのまま使用（回答リストが必要な場合）
    _count: {
      answers: q.answers?.[0]?.count || 0, // answers配列の最初の要素からcountを取得
    },
  })) || [];

  console.log('Fetched questions with details:', questionsWithDetails);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading as="h1" size="xl">
              質問一覧
            </Heading>
            <Button
              as={Link}
              href="/questions/new"
              colorScheme="blue"
              size="lg"
            >
              質問する
            </Button>
          </HStack>
          <QuestionFilter />
        </Box>
        <QuestionList questions={questionsWithDetails} />
      </VStack>
    </Container>
  );
} 