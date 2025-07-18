import { Box, Heading, Text, SimpleGrid, VStack, Button, Divider, Flex, IconButton } from '@chakra-ui/react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MaclathQuestionsCarousel from "./components/MaclathQuestionsCarousel";

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data: contests } = await supabase
    .from('contests')
    .select('*')
    .order('name', { ascending: false });

  // 最新4件のみ表示
  const latestContests = contests ? contests.slice(0, 4) : [];

  // お知らせを取得
  const { data: announcements } = await supabase
    .from('announcements')
    .select('title, content, created_at')
    .order('created_at', { ascending: false })
    .limit(5); // 最新5件を取得

  // Maclath新着質問（最新5件）を取得
  const { data: questions } = await supabase
    .from('questions')
    .select('id, title, created_at, profiles(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <Box maxW="4xl" mx="auto" py={10} px={4}>
      {/* サービス紹介 */}
      <Heading as="h1" size="xl" mb={4} textAlign="center">
        JMO Virtual Contestとは？
      </Heading>
      <Text fontSize="lg" color="gray.700" mb={4} textAlign="center">
        JMO Virtual Contestは、日本数学オリンピック予選の過去問をバーチャルで体験できる学習サイトです。<br />
        本番さながらの形式で腕試しをしたり、過去問を解いて実力を高めましょう。
      </Text>
      <Box textAlign="center" mb={10}>
        <Button as={Link} href="/rules" colorScheme="teal" variant="outline" size="md">
          ルール・ご利用ガイドページはこちら
        </Button>
      </Box>

      {/* お知らせセクション */}
      <Box mb={10}>
        <Heading as="h2" size="md" mb={4} textAlign="center">
          お知らせ
        </Heading>
        <Box bg="white" borderRadius="xl" boxShadow="md" p={{ base: 4, md: 6 }} borderWidth={1}>
          {announcements && announcements.length > 0 ? (
            <>
              <VStack align="stretch" spacing={4} divider={<Divider borderColor="gray.400" />}>
                {announcements.map((announcement: any) => (
                  <Box key={announcement.created_at}>
                    <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="start">
                      <Text fontSize="sm" color="gray.700" mr={4} whiteSpace="pre-wrap">
                        {new Date(announcement.created_at) >= new Date(new Date().setDate(new Date().getDate() - 2)) && (
                          <Text as="span" mr={2} fontSize="sm" color="red.500" fontWeight="normal">
                            new!
                          </Text>
                        )}
                        {announcement.content}
                      </Text>
                      <Text fontSize="xs" color="gray.500" flexShrink={0}>
                        {new Date(announcement.created_at).toLocaleString()}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </VStack>
              <Box mt={4} textAlign="center">
                <Button as={Link} href="/announcements" colorScheme="blue" variant="ghost" size="sm">
                  それ以前のお知らせはこちら
                </Button>
              </Box>
            </>
          ) : (
            <Text color="gray.700">現在、新しいお知らせはありません。</Text>
          )}
        </Box>
      </Box>

      {/* Maclath新着質問セクション（カルーセル） */}
      <Box mb={10}>
        <Heading as="h2" size="md" mb={4} textAlign="center">
          Maclath新着質問
        </Heading>
        <Box bg="white" borderRadius="xl" boxShadow="md" p={{ base: 4, md: 6 }} borderWidth={1}>
          <MaclathQuestionsCarousel questions={questions || []} />
          <Box mt={4} textAlign="center">
            <Button as={Link} href="/maclath/questions" colorScheme="purple" variant="ghost" size="sm">
              もっと見る
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 新着コンテスト */}
      <Heading as="h2" size="md" mb={4} mt={8} textAlign="center">
        新着コンテスト
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={4}>
        {latestContests.map((c: any) => (
          <Box
            key={c.id}
            bg="white"
            borderRadius="xl"
            boxShadow="md"
            p={6}
            borderWidth={1}
            _hover={{ boxShadow: 'lg' }}
            transition="box-shadow 0.2s"
          >
            <VStack align="start" spacing={2}>
              <Heading as={Link} href={`/contests/${c.id}`} size="md" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                {c.name}
              </Heading>
              <Text color="gray.600" fontSize="sm">{c.description}</Text>
              <Text fontSize="sm">
                <b>制限時間：</b>{c.duration_minutes}分
              </Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
      <Box textAlign="center">
        <Button as={Link} href="/contests" colorScheme="blue" variant="solid">
          もっと見る
        </Button>
      </Box>
    </Box>
  );
}
