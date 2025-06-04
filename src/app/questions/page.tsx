import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import QuestionList from '@/components/questions/QuestionList';
import QuestionFilter from '@/components/questions/QuestionFilter';

export default async function QuestionsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: questions } = await supabase
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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={4}>
            質問一覧
          </Heading>
          <QuestionFilter />
        </Box>
        <QuestionList questions={questions || []} />
      </VStack>
    </Container>
  );
} 