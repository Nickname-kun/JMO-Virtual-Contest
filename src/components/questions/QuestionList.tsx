'use client';

import { Box, VStack } from '@chakra-ui/react';
import { QuestionWithDetails } from '@/types/question';
import QuestionCard from './QuestionCard';
import { useEffect } from 'react';

type QuestionListProps = {
  questions: QuestionWithDetails[];
};

export default function QuestionList({ questions }: QuestionListProps) {
  useEffect(() => {
    console.log('QuestionList received questions:', questions);
  }, [questions]);

  return (
    <VStack spacing={4} align="stretch">
      {questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </VStack>
  );
} 