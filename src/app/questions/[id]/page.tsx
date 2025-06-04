import { Container, VStack, Box } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import QuestionDetail from '@/components/questions/QuestionDetail';
import AnswerList from '@/components/questions/AnswerList';
import AnswerForm from '@/components/questions/AnswerForm';
import { QuestionWithDetails } from '@/types/question';

export default async function QuestionPage({
  params,
}: {
  params: { id: string };
}) {
  console.log('Fetching question with ID:', params.id);
  const supabase = createServerComponentClient({ cookies });

  const { data: question, error } = await supabase
    .from('questions')
    .select(
      `
      *,
      category:categories(*),
      user:profiles(id, username),
      answers:answers(
        *,
        user:profiles(id, username)
      ),
    `
    )
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Error fetching question detail:', error);
  }

  console.log('Fetched question detail:', question);

  if (!question) {
    notFound();
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <QuestionDetail question={question} />
        <Box>
          <AnswerList answers={question.answers} />
        </Box>
        <Box>
          <AnswerForm questionId={question.id} />
        </Box>
      </VStack>
    </Container>
  );
} 