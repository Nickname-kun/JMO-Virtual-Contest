"use client";

import { Box, Text, Container, Link as ChakraLink, Flex, VStack, SimpleGrid, Heading, HStack, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';

export default function Footer() {
  return (
    <Box bg="blue.800" py={10} mt={8} color="gray.200">
      <Container maxW="container.lg">
        {/* 新しい上部の横並びメニュー */}
        <HStack spacing={8} justify="center" mb={8} wrap="wrap">
          <ChakraLink as={Link} href="/">
            <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>HOME</Text>
          </ChakraLink>
          <ChakraLink as={Link} href="/problems">
            <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>問題一覧</Text>
          </ChakraLink>
          <ChakraLink as={Link} href="/contests">
            <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>コンテスト</Text>
          </ChakraLink>
          {/* COMMUNITY ドロップダウン */}
          <Menu>
            <MenuButton as={ChakraLink} px={0} bg="none" _hover={{ color: "white", textDecoration: 'none' }} _active={{ bg: 'none' }} _focus={{ boxShadow: 'none' }}>
              <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>Community</Text>
            </MenuButton>
            <MenuList bg="blue.800">
              <MenuItem as={Link} href="/users" bg="blue.800" color="white">
                ユーザーリスト
              </MenuItem>
              <MenuItem as={Link} href="/maclath" bg="blue.800" color="white">
                Maclath
              </MenuItem>
            </MenuList>
          </Menu>
          <ChakraLink as={Link} href="/announcements">
            <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>お知らせ</Text>
          </ChakraLink>
          <ChakraLink as={Link} href="/rules">
            <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>ルール・ご利用ガイド</Text>
          </ChakraLink>
          <ChakraLink as={Link} href="/privacy-policy">
            <Text fontSize="md" color="gray.200" _hover={{ color: "white" }}>プライバシーポリシー</Text>
          </ChakraLink>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}> {/* 2カラムに変更 */}
          {/* カラム 1: サイト紹介 */}
          <VStack align="start" spacing={4}>
            <Heading as="h4" size="md" color="white">JMO Virtual Contest</Heading>
            <Text fontSize="sm" color="gray.400">
              日本数学オリンピック予選の過去問を解いて実力を試せる学習サイトです。
            </Text>
          </VStack>

          {/* カラム 2: お問い合わせ */}
          <VStack align="start" spacing={2}>
            <Heading as="h4" size="md" color="white">お問い合わせ</Heading>
            <Box as="p" fontSize="sm" color="gray.400">
              <FaXTwitter style={{ display: 'inline-block', marginRight: '5px' }} /> X (旧Twitter): 東北大学作問サークル（<ChakraLink href="https://twitter.com/tohoku_sakumon" isExternal color="blue.300">@tohoku_sakumon</ChakraLink>）
              <br />
              または
              <br />
              <ChakraLink href="https://twitter.com/kubositato_toi" isExternal color="blue.300">@kubositato_toi</ChakraLink>
              ／ <ChakraLink href="https://twitter.com/Nickname0628" isExternal color="blue.300">@Nickname0628</ChakraLink>
            </Box>
            <Box as="p" fontSize="sm" color="gray.400">
              <MdEmail style={{ display: 'inline-block', marginRight: '5px' }} /> Email: <ChakraLink href="mailto:bunkeimathlove@gmail.com" isExternal color="blue.300">bunkeimathlove@gmail.com</ChakraLink>
            </Box>
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  );
} 