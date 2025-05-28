"use client";

import { useEffect, useState } from 'react';
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

export default function VirtualHistoryPage() {
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
        {virtualContests.length === 0 ? (
          <Text color="gray.500">バーチャルコンテストの履歴はありません。</Text>
        ) : (
          virtualContests.map(vc => (
            <Box key={vc.id} p={4} borderWidth={1} borderRadius="md" bg="gray.50">
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">{vc.start_time ? new Date(vc.start_time).toLocaleString() : ''} ～ {vc.end_time ? new Date(vc.end_time).toLocaleString() : ''}</Text>
                  <Text color="gray.600">ステータス: {vc.status === 'finished' ? '完了' : vc.status === 'in_progress' ? '進行中' : '未開始'}</Text>
                </Box>
                <Link href={`/contests/${vc.contest_id}/virtual/${vc.id}/result`} passHref>
                  <Button as="a" colorScheme="blue" variant="solid" size="sm">
                    採点結果を見る
                  </Button>
                </Link>
              </HStack>
            </Box>
          ))
        )}
      </VStack>
    </Container>
  );
} 