import { Container, VStack, Box } from '@chakra-ui/react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import QuestionDetail from '@/components/questions/QuestionDetail';
import AnswerList from '@/components/questions/AnswerList';
import AnswerForm from '@/components/questions/AnswerForm';

export default async function QuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  const { data: question } = await supabase
    .from('questions')
    .select(
      `
      *,
      category:categories(*),
      user:profiles(id, name, avatar_url),
      answers:answers(
        *,
        user:profiles(id, name, avatar_url)
      ),
      _count {
        answers
      }
    `
    )
    .eq('id', params.id)
    .single();

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