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
  Button,
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
          <HStack justify="space-between" alignItems="flex-end">
            <HStack>
              <Avatar
                size="sm"
                name={question.user.username}
                // src={question.user.avatar_url} // avatar_urlは存在しないためコメントアウト
              />
              <Text fontSize="sm">{question.user.username}</Text>
            </HStack>
            <VStack align="flex-end" spacing={2}>
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.500">
                  {formatDistanceToNow(new Date(question.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {question._count?.answers || 0} 件の回答
                </Text>
              </HStack>
              <Button
                as={NextLink}
                href={`/questions/${question.id}`}
                colorScheme="teal"
                size="sm"
              >
                回答する
              </Button>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
} 