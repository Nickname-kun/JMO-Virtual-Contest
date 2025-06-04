import {
  Card,
  CardBody,
  Text,
  HStack,
  Avatar,
  VStack,
} from '@chakra-ui/react';
import { Answer } from '@/types/question';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

type AnswerCardProps = {
  answer: Answer;
};

export default function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Text whiteSpace="pre-wrap">{answer.content}</Text>
          <HStack justify="space-between">
            <HStack>
              <Avatar
                size="sm"
                name={answer.user.name}
                src={answer.user.avatarUrl}
              />
              <Text fontSize="sm">{answer.user.name}</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {formatDistanceToNow(new Date(answer.createdAt), {
                addSuffix: true,
                locale: ja,
              })}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
} 