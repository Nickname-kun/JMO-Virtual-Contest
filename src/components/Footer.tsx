"use client";

import { Box, Text, Container, Link as ChakraLink } from '@chakra-ui/react';

export default function Footer() {
  return (
    <Box bg="gray.100" py={4} mt={8}>
      <Container maxW="container.lg" textAlign="center">
        <Text fontSize="sm" color="gray.600">
          &copy; {new Date().getFullYear()} JMO Virtual Contest
        </Text>
        <Text fontSize="xs" color="gray.600" mt={1}>
          ※ JMOおよびJJMOの問題の著作権は数学オリンピック財団に帰属します。
        </Text>
        <Text fontSize="sm" color="gray.600" mt={1}>
          お問い合わせ: <ChakraLink href="https://twitter.com/Nickname0628" isExternal color="blue.500">@Nickname0628</ChakraLink>
          ／ <ChakraLink href="https://twitter.com/tohoku_sakumon" isExternal color="blue.500">東北大学作問サークル（@tohoku_sakumon）</ChakraLink>
        </Text>
      </Container>
    </Box>
  );
} 