'use client';

import { useEffect, useState, useRef } from 'react';
import { Container, Heading, Text, Box, VStack, HStack, Button, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import { MdArrowBack, MdAccessTime, MdCheck } from 'react-icons/md';
import { Tag } from '@chakra-ui/react';

interface Problem {
  id: string;
  title: string;
  content: string;
  difficulty: number;
}

interface VirtualContest {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  score: number;
}

export default function VirtualContestPage({ params }: { params: { id: string; virtual_id: string } }) {
  const router = useRouter();
  const session = useSession();
  const toast = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [virtualContest, setVirtualContest] = useState<VirtualContest | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const supabase = createClientComponentClient();
  const [isQuitDialogOpen, setQuitDialogOpen] = useState(false);
  const [isFinishDialogOpen, setFinishDialogOpen] = useState(false);
  const quitCancelRef = useRef<HTMLButtonElement | null>(null);
  const finishCancelRef = useRef<HTMLButtonElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      // バーチャルコンテスト情報の取得
      const { data: vcData, error: vcError } = await supabase
        .from('virtual_contests')
        .select('*')
        .eq('id', params.virtual_id)
        .single();

      if (vcError || !vcData) {
        toast({
          title: 'エラー',
          description: 'バーチャルコンテストが見つかりませんでした',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push(`/contests/${params.id}`);
        return;
      }

      setVirtualContest(vcData);

      // 問題一覧の取得
      const { data: problemsData, error: problemsError } = await supabase
        .from('problems')
        .select('*')
        .eq('contest_id', params.id)
        .order('number', { ascending: true });

      if (problemsError) {
        toast({
          title: 'エラー',
          description: '問題の取得に失敗しました',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setProblems(problemsData || []);
    };

    fetchData();
  }, [session, params.id, params.virtual_id, router, supabase, toast]);

  // タイマーの更新
  useEffect(() => {
    if (!virtualContest) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(virtualContest.end_time);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('終了');
        // コンテスト終了時の処理
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [virtualContest]);

  const handleProblemClick = (problemId: string) => {
    router.push(`/contests/${params.id}/virtual/${params.virtual_id}/problems/${problemId}`);
  };

  const handleQuit = async () => {
    setLoading(true);
    await supabase.from('virtual_contests').delete().eq('id', params.virtual_id);
    setLoading(false);
    setQuitDialogOpen(false);
    router.push('/');
  };

  const handleFinish = async () => {
    setLoading(true);
    // 正解数を集計
    const { data: submissions } = await supabase
      .from('submissions')
      .select('is_correct')
      .eq('virtual_contest_id', params.virtual_id)
      .eq('is_correct', true);
    const correctCount = submissions ? submissions.length : 0;
    // スコア（正解数）を保存し、statusもfinishedに
    await supabase
      .from('virtual_contests')
      .update({ status: 'finished', score: correctCount })
      .eq('id', params.virtual_id);
    setLoading(false);
    setFinishDialogOpen(false);
    router.push(`/contests/${params.id}/virtual/${params.virtual_id}/result`);
  };

  if (!virtualContest) {
    return <Text>読み込み中...</Text>;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            バーチャルコンテスト
          </Heading>
          <HStack>
            <Tag
              size="lg"
              colorScheme={timeLeft === '終了' ? 'red' : timeLeft.startsWith('0:') ? 'orange' : 'teal'}
              fontSize="2xl"
              px={6}
              py={2}
              borderRadius="full"
            >
              <MdAccessTime style={{ marginRight: 8 }} />
              {timeLeft === '終了' ? '終了' : `残り ${timeLeft}`}
            </Tag>
            <Button
              leftIcon={<MdArrowBack />}
              colorScheme="red"
              variant="outline"
              size="sm"
              ml={4}
              onClick={() => setQuitDialogOpen(true)}
            >
              やめる
            </Button>
            <Button
              leftIcon={<MdCheck />}
              colorScheme="green"
              variant="solid"
              size="sm"
              ml={2}
              onClick={() => setFinishDialogOpen(true)}
            >
              完了する
            </Button>
          </HStack>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={4}>
            問題一覧
          </Heading>
          <VStack spacing={4} align="stretch">
            {problems.map((problem) => (
              <Box
                key={problem.id}
                p={4}
                borderWidth={1}
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
                cursor="pointer"
                onClick={() => handleProblemClick(problem.id)}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{problem.title}</Text>
                    <Text color="gray.600">難易度: {problem.difficulty}</Text>
                  </VStack>
                  <Button colorScheme="blue" size="sm">
                    問題を解く
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>

      {/* やめる確認ダイアログ */}
      <AlertDialog
        isOpen={isQuitDialogOpen}
        leastDestructiveRef={quitCancelRef}
        onClose={() => setQuitDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              バーチャルコンテストをやめますか？
            </AlertDialogHeader>
            <AlertDialogBody>
              この操作は取り消せません。本当にやめてよろしいですか？
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={quitCancelRef} onClick={() => setQuitDialogOpen(false)}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleQuit} ml={3} isLoading={loading}>
                やめる
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {/* 完了する確認ダイアログ */}
      <AlertDialog
        isOpen={isFinishDialogOpen}
        leastDestructiveRef={finishCancelRef}
        onClose={() => setFinishDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              バーチャルコンテストを完了しますか？
            </AlertDialogHeader>
            <AlertDialogBody>
              全ての提出が完了していることを確認してください。採点画面に移動します。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={finishCancelRef} onClick={() => setFinishDialogOpen(false)}>
                キャンセル
              </Button>
              <Button colorScheme="green" onClick={handleFinish} ml={3}>
                完了する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 