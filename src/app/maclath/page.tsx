'use client';

import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import Link from 'next/link';

export default function MaclathHomePage() {
  return (
    <Box
      maxW="container.md"
      mx="auto"
      px={4}
      py={10}
      textAlign="center"
      bg="whiteAlpha.900"
      borderRadius="lg"
      boxShadow="xl"
      mt={8}
    >
      <VStack spacing={6}>
        <Heading as="h1" size="2xl" color="teal.600">
          ようこそ Maclath へ！
        </Heading>
        <Text fontSize="lg" color="gray.700">
          ここは競技数学版の「みんなの教室」。
          日々の学習で生まれた疑問を共有し、協力して解決する場です。
          質問を投稿したり、他の人の質問に回答して、一緒に学びを深めましょう！
        </Text>
        <Button as={Link} href="/questions" colorScheme="blue" size="lg">
          質問一覧を見る
        </Button>
      </VStack>
    </Box>
  );
} 