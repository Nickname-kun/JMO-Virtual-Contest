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
        <Text fontSize="md" color="teal.500" fontWeight="bold">
          みんなで作る、競技数学のQ&Aコミュニティ
        </Text>
        <Text fontSize="lg" color="gray.700">
          ここは競技数学版の「みんなの教室」。<br />
          日々の学習で生まれた疑問を共有し、協力して解決する場です。<br />
          質問も回答も、気軽にどうぞ！
        </Text>
        <Text fontSize="md" color="gray.600">
          ・どんな疑問でもOK<br />
          ・回答は1行でも歓迎<br />
          ・過去の質問も検索できます
        </Text>
        <VStack spacing={4}>
          <Button as={Link} href="/maclath/questions" colorScheme="blue" size="lg">
            質問一覧を見る
          </Button>
          <Button as={Link} href="/maclath/questions/new" colorScheme="teal" variant="outline" size="md">
            質問を投稿する
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
} 