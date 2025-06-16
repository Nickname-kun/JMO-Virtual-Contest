'use client';

import { Button, useToast, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface VirtualStartButtonProps {
  contestId: string;
  durationMinutes: number;
  problemCount: number;
}

export default function VirtualStartButton({ contestId, durationMinutes, problemCount }: VirtualStartButtonProps) {
  const router = useRouter();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (countdown === 0) {
      handleStart();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const startCountdown = () => {
    if (!session?.user) {
      toast({ title: 'ログインが必要です', status: 'warning', duration: 3000, isClosable: true });
      router.push('/auth');
      return;
    }
    setCountdown(3);
  };

  const handleStart = async () => {
    if (!session?.user) {
      toast({ title: 'ログインが必要です', status: 'warning', duration: 3000, isClosable: true });
      router.push('/auth');
      return;
    }
    setLoading(true);
    const start = new Date();
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const supabase = createClientComponentClient();
    const { data, error } = await supabase.from('virtual_contests').insert({
      user_id: session.user.id,
      contest_id: contestId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'in_progress',
      score: 0,
    }).select().single();
    setLoading(false);
    if (error) {
      toast({ title: 'バーチャル開始に失敗しました', description: error.message, status: 'error', duration: 4000, isClosable: true });
    } else if (data) {
      router.push(`/contests/${contestId}/virtual/${data.id}`);
    }
  };

  return (
    <Button
      colorScheme="teal"
      size="lg"
      onClick={startCountdown}
      isLoading={loading}
      isDisabled={countdown !== null || problemCount === 0}
      mt={4}
    >
      {countdown !== null ? `開始まで ${countdown} 秒` : problemCount === 0 ? '問題がありません' : 'バーチャル開始'}
    </Button>
  );
} 