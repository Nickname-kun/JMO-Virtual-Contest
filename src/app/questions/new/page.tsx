import { Container, VStack, Box } from '@chakra-ui/react';
import QuestionForm from '@/components/questions/QuestionForm';

export default function NewQuestionPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <QuestionForm />
        </Box>
      </VStack>
    </Container>
  );
} 