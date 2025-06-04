import { Box, Container, Heading, VStack, Button, HStack } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import QuestionList from '@/components/questions/QuestionList';
import QuestionFilter from '@/components/questions/QuestionFilter';
import Link from 'next/link';

export default async function QuestionsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      *,
      category:categories(*),
      user:profiles(id, name, avatar_url),
      _count {
        answers
      }
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
  }

  console.log('Fetched questions:', questions);

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
        <QuestionList questions={questions || []} />
      </VStack>
    </Container>
  );
} 