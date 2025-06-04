import { Box, Container, Heading, VStack, Button, HStack } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import QuestionList from '@/components/questions/QuestionList';
import QuestionFilter from '@/components/questions/QuestionFilter';
import Link from 'next/link';
import { QuestionWithDetails } from '@/types/question';

export default async function QuestionsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      category:categories(*),
      user:profiles(id, name, avatar_url),
      answers(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
    // エラー時は空の配列を返すか、エラー表示を行う
    return (
      <Container maxW="container.xl" py={8}>
        <Box>Error loading questions.</Box>
      </Container>
    );
  }

  // 取得したデータをQuestionWithDetails型にマッピング
  const questionsWithDetails: QuestionWithDetails[] = data?.map(q => ({
    ...q,
    category: q.category as any, // 型アサーションまたは適切なマッピング
    user: q.user as any, // 型アサーションまたは適切なマッピング
    answers: [], // このselectではanswersデータ自体は取得していないため空配列
    _count: {
      answers: q.answers?.[0]?.count || 0, // countはanswers配列の最初の要素に格納される
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