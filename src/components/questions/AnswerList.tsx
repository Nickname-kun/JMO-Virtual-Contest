import { VStack, Heading } from '@chakra-ui/react';
import { Answer } from '@/types/question';
import AnswerCard from './AnswerCard';

type AnswerListProps = {
  answers: Answer[];
};

export default function AnswerList({ answers }: AnswerListProps) {
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md">{answers.length} 件の回答</Heading>
      {answers.map((answer) => (
        <AnswerCard key={answer.id} answer={answer} />
      ))}
    </VStack>
  );
} 