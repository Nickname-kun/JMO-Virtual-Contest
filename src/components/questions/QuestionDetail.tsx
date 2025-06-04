import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  HStack,
  Tag,
  Avatar,
  VStack,
} from '@chakra-ui/react';
import { QuestionWithDetails } from '@/types/question';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

type QuestionDetailProps = {
  question: QuestionWithDetails;
};

export default function QuestionDetail({ question }: QuestionDetailProps) {
  return (
    <Card>
      <CardHeader>
        <VStack align="stretch" spacing={4}>
          <Heading size="lg">{question.title}</Heading>
          <HStack>
            <Tag colorScheme="blue">{question.category.name}</Tag>
            <Text fontSize="sm" color="gray.500">
              {formatDistanceToNow(new Date(question.createdAt), {
                addSuffix: true,
                locale: ja,
              })}
            </Text>
          </HStack>
        </VStack>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={6}>
          <Text whiteSpace="pre-wrap">{question.content}</Text>
          <HStack>
            <Avatar
              size="sm"
              name={question.user.name}
              src={question.user.avatarUrl}
            />
            <Text fontSize="sm">{question.user.name}</Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
} 