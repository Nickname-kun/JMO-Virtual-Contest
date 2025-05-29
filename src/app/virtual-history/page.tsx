"use client";

import { useEffect, useState, Suspense } from 'react';
import { Container, Heading, Text, Box, VStack, HStack, Tag, Button, Spinner } from '@chakra-ui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import { useLoading } from '@/contexts/LoadingContext';

interface VirtualContest {
  id: string;
  contest_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

function VirtualHistoryPageContent() {
  const session = useSession();
  const supabase = createClientComponentClient();
  const [virtualContests, setVirtualContests] = useState<VirtualContest[]>([]);
  const [loading, setLoading] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (!session?.user) return;
    const fetchData = async () => {
      setLoading(true);
      showLoading();
      const { data } = await supabase
        .from('virtual_contests')
        .select('id, contest_id, start_time, end_time, status')
        .eq('user_id', session.user.id)
        .order('start_time', { ascending: false });
      setVirtualContests(data || []);
      setLoading(false);
      hideLoading();
    };
    fetchData();
  }, [session]);

  if (!session?.user || loading) {
    return <Box textAlign="center" py={20}><Spinner size="xl" /></Box>;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Heading as="h1" size="xl" mb={6}>バーチャルコンテスト履歴</Heading>
      <VStack spacing={4} align="stretch">
        {virtualContests.map((contest) => (
          <Box key={contest.id} p={4} borderWidth={1} borderRadius="md">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold">
                  {contest.contest_id}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  開始: {new Date(contest.start_time).toLocaleString()}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  終了: {new Date(contest.end_time).toLocaleString()}
                </Text>
              </VStack>
              <HStack>
                <Tag colorScheme={contest.status === 'completed' ? 'green' : 'blue'}>
                  {contest.status === 'completed' ? '完了' : '進行中'}
                </Tag>
                <Button
                  as={Link}
                  href={`/contests/${contest.contest_id}/virtual/${contest.id}`}
                  colorScheme="blue"
                  size="sm"
                >
                  詳細を見る
                </Button>
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Container>
  );
}

export default function VirtualHistoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VirtualHistoryPageContent />
    </Suspense>
  );
} 