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
  Link,
} from '@chakra-ui/react';
import { QuestionWithDetails } from '@/types/question';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import NextLink from 'next/link';

type QuestionCardProps = {
  question: QuestionWithDetails;
};

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between" align="center">
          <Heading size="md">
            <Link as={NextLink} href={`/questions/${question.id}`}>
              {question.title}
            </Link>
          </Heading>
          <Tag colorScheme="blue">{question.category.name}</Tag>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Text noOfLines={3}>{question.content}</Text>
          <HStack justify="space-between">
            <HStack>
              <Avatar
                size="sm"
                name={question.user.name}
                src={question.user.avatarUrl}
              />
              <Text fontSize="sm">{question.user.name}</Text>
            </HStack>
            <HStack spacing={4}>
              <Text fontSize="sm">
                {formatDistanceToNow(new Date(question.createdAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </Text>
              <Text fontSize="sm">
                {question._count.answers} 件の回答
              </Text>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
} 