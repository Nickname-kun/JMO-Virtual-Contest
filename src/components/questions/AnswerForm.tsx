import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type AnswerFormProps = {
  questionId: string;
};

export default function AnswerForm({ questionId }: AnswerFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('answers').insert({
        question_id: questionId,
        content,
      });

      if (error) throw error;

      setContent('');
      router.refresh();
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>回答</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="回答を入力してください"
                minH="200px"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              alignSelf="flex-end"
            >
              回答を投稿
            </Button>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
} 