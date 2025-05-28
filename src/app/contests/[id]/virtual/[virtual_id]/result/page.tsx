"use client";

import { useEffect, useState } from 'react';
import { Container, Heading, Text, Box, VStack, HStack, Tag, Spinner, Button } from '@chakra-ui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import { FaXTwitter } from 'react-icons/fa6';

interface Problem {
  id: string;
  title: string;
  difficulty: number;
  contest_id: string;
}

interface Submission {
  id: string;
  problem_id: string;
  answer: string;
  is_correct: boolean;
  created_at: string;
}

export default function VirtualContestResultPage({ params }: { params: { id: string; virtual_id: string } }) {
  const session = useSession();
  const supabase = createClientComponentClient();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [borders, setBorders] = useState<{ a: number, b: number, c: number } | null>(null);
  const [contestName, setContestName] = useState<string>('');

  useEffect(() => {
    if (!session?.user) return;
    const fetchData = async () => {
      setLoading(true);
      // 1. virtual_contestsからcontest_idを取得
      const { data: vcData, error: vcError } = await supabase
        .from('virtual_contests')
        .select('contest_id')
        .eq('id', params.virtual_id)
        .single();
      if (vcError || !vcData) {
        setProblems([]);
        setSubmissions([]);
        setLoading(false);
        return;
      }
      // 2. contest_idに紐づく問題だけ取得
      const { data: problemsData } = await supabase
        .from('problems')
        .select('id, title, difficulty, contest_id')
        .eq('contest_id', vcData.contest_id);
      setProblems(problemsData || []);
      // 3. 提出一覧取得
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('id, problem_id, answer, is_correct, created_at')
        .eq('user_id', session.user.id)
        .eq('virtual_contest_id', params.virtual_id);
      setSubmissions(submissionsData || []);
      // 4. contestsテーブルからボーダー取得＋name取得
      const { data: contestData } = await supabase
        .from('contests')
        .select('border_a, border_b, border_c, name')
        .eq('id', vcData.contest_id)
        .single();
      if (contestData) {
        setBorders({
          a: contestData.border_a,
          b: contestData.border_b,
          c: contestData.border_c,
        });
        setContestName(contestData.name || '');
      }
      setLoading(false);
    };
    fetchData();
  }, [session, params.virtual_id, supabase]);

  if (!session?.user || loading) {
    return <Box textAlign="center" py={20}><Spinner size="xl" /></Box>;
  }

  const correctCount = submissions.filter(s => s.is_correct).length;

  // ランク判定
  let rank = '';
  if (borders) {
    if (correctCount >= borders.a) {
      rank = 'A';
    } else if (correctCount >= borders.b) {
      rank = 'B';
    } else if (correctCount >= borders.c) {
      rank = 'C';
    } else {
      rank = 'ランク外';
    }
  }

  // シェア用テキスト
  const shareText = `${contestName} バーチャルコンテストで${correctCount}完、${rank}ランクでした！ #JMOバチャ #数学オリンピック`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <Container maxW="container.lg" py={8}>
      <Heading as="h1" size="xl" mb={6}>採点結果</Heading>
      <Text fontSize="lg" color="teal.700" mb={2} fontWeight="bold">
        正解数: {correctCount} / {problems.length}
      </Text>
      {borders && (
        <Text fontSize="xl" color="blue.700" mb={4} fontWeight="bold">
          あなたは{correctCount}完なので{rank}ランクです！
        </Text>
      )}
      <Text fontSize="sm" color="gray.500" mb={2}>
        問題数: {problems.length} / 提出数: {submissions.length}
      </Text>
      <Button
        as="a"
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        leftIcon={<FaXTwitter />}
        bg="black"
        color="white"
        _hover={{ bg: '#222' }}
        fontWeight="bold"
        fontSize="lg"
        mb={4}
      >
        でシェア
      </Button>
      <VStack spacing={4} align="stretch">
        {problems.map((problem) => {
          const submission = submissions.find(s => s.problem_id === problem.id);
          return (
            <Box key={problem.id} p={4} borderWidth={1} borderRadius="md" bg="gray.50">
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">{problem.title}</Text>
                  {/* <Text color="gray.600">難易度: {problem.difficulty}</Text> */}
                </Box>
                {submission ? (
                  <VStack align="end" spacing={1}>
                    <Tag colorScheme={submission.is_correct ? 'green' : 'red'} fontSize="md">
                      {submission.is_correct ? '正解' : '不正解'}
                    </Tag>
                    <Text fontSize="sm" color="gray.500">{new Date(submission.created_at).toLocaleString()}</Text>
                    <Text fontSize="md">{submission.answer}</Text>
                  </VStack>
                ) : (
                  <Tag colorScheme="gray" fontSize="md">未提出</Tag>
                )}
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </Container>
  );
} 