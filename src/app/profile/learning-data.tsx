"use client";

import { Box, Heading, Text, VStack, SimpleGrid, Stat, StatLabel, StatNumber, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Link as ChakraLink, Progress } from '@chakra-ui/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';

// problemsテーブルとcontestsテーブルの関連部分の型定義 (page.tsxのselectに合わせています)
interface SubmissionProblem {
  id: string;
  title: string;
  number: number;
  field: string;
}

interface Submission {
  id: string;
  problem_id: string;
  answer: string;
  is_correct: boolean;
  submitted_at: string;
  problems: SubmissionProblem[]; // 配列として定義
}

interface VirtualContestContest {
  id: string;
  name: string;
}

interface VirtualContest {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  score: number;
  contest_id: string | null;
  contests: VirtualContestContest[] | null; // 配列として定義
}

interface LearningDataProps {
  submissions: Submission[];
  virtualContests: VirtualContest[];
}

export default function LearningData({
  submissions,
  virtualContests,
}: LearningDataProps) {
  console.log("Submissions data received in LearningData:", submissions);

  // 分野ごとの正答率を計算
  const calculateCorrectnessByField = (): { field: string; total: number; correct: number; rate: number }[] => {
    const stats: { [key: string]: { total: number; correct: number } } = {};

    submissions.forEach(submission => {
      // 提出に含まれる問題の情報から分野を取得（配列として処理）
      if (Array.isArray(submission.problems)) {
        submission.problems.forEach(problem => {
          const field = problem.field || '不明な分野';
          if (!stats[field]) {
            stats[field] = { total: 0, correct: 0 };
          }
          stats[field].total++;
          // 注意：提出全体が正解か不正解かで判定しているため、
          // 問題ごとの正誤が必要であればsupabaseのクエリやテーブル構造の見直しが必要です。
          // ここでは提出全体の正誤を各問題に単純に加算しています。
          if (submission.is_correct) {
            stats[field].correct++;
          }
        });
      } else if (submission.problems && typeof submission.problems === 'object') {
        // 万が一オブジェクト単体でproblemsが来る場合のフォールバック（型定義とは異なるが安全のため）
        const field = (submission.problems as SubmissionProblem).field || '不明な分野'; // 型アサーション
        if (!stats[field]) {
          stats[field] = { total: 0, correct: 0 };
        }
        stats[field].total++;
        if (submission.is_correct) {
          stats[field].correct++;
        }
        console.warn("submission.problems is an object instead of an array:", submission.problems);
      } else {
        // 問題情報が完全に取得できない場合のフォールバック
        const field = '不明な分野';
        if (!stats[field]) {
          stats[field] = { total: 0, correct: 0 };
        }
        stats[field].total++;
        if (submission.is_correct) {
          stats[field].correct++;
        }
        console.error("submission.problems is missing or not an expected type:", submission.problems);
      }
    });

    // 正答率の計算とソート（分野名でソート）
    return Object.entries(stats)
      .map(([field, { total, correct }]) => ({
        field,
        total,
        correct,
        rate: total > 0 ? (correct / total) * 100 : 0,
      }))
      .sort((a, b) => a.field.localeCompare(b.field)); // 分野名でソート
  };

  const correctnessStats = calculateCorrectnessByField();

  // 提出履歴の表示部分を分野別正答率表示に変更
  const renderCorrectnessStats = () => {
    if (correctnessStats.length === 0) {
      return <Text>まだ問題を提出していません。</Text>;
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
        {correctnessStats.map(stat => (
          <Box key={stat.field} p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Stat>
              <StatLabel fontSize="lg">{stat.field}</StatLabel>
              <StatNumber fontSize="2xl">{stat.correct} / {stat.total}</StatNumber>
              <Text fontSize="sm" color="gray.600">正答率: {stat.rate.toFixed(1)}%</Text>
              <Progress value={stat.rate} size="sm" colorScheme={stat.rate >= 80 ? 'green' : stat.rate >= 50 ? 'yellow' : 'red'} mt={2} />
            </Stat>
          </Box>
        ))}
      </SimpleGrid>
    );
  };

  // バーチャルごとの問題数を取得
  const [problemCounts, setProblemCounts] = useState<{ [virtualContestId: string]: number }>({});
  useEffect(() => {
    const fetchCounts = async () => {
      const supabase = createClientComponentClient();
      const counts: { [virtualContestId: string]: number } = {};
      await Promise.all(virtualContests.map(async (vc) => {
        if (!vc.contest_id) return;
        const { count } = await supabase
          .from('problems')
          .select('id', { count: 'exact', head: true })
          .eq('contest_id', vc.contest_id);
        counts[vc.id] = count ?? 0;
      }));
      setProblemCounts(counts);
    };
    if (virtualContests.length > 0) fetchCounts();
  }, [virtualContests]);

  // バーチャルごとの正解数を取得
  const [correctCounts, setCorrectCounts] = useState<{ [virtualContestId: string]: number }>({});
  useEffect(() => {
    const fetchCorrectCounts = async () => {
      const supabase = createClientComponentClient();
      const counts: { [virtualContestId: string]: number } = {};
      await Promise.all(virtualContests.map(async (vc) => {
        const { count } = await supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .eq('virtual_contest_id', vc.id)
          .eq('is_correct', true);
        counts[vc.id] = count ?? 0;
      }));
      setCorrectCounts(counts);
    };
    if (virtualContests.length > 0) fetchCorrectCounts();
  }, [virtualContests]);

  // ランク分布集計用state
  const [rankCounts, setRankCounts] = useState<{ A: number; B: number; C: number }>({ A: 0, B: 0, C: 0 });
  useEffect(() => {
    const fetchRanks = async () => {
      const supabase = createClientComponentClient();
      let a = 0, b = 0, c = 0;
      await Promise.all(virtualContests.map(async (vc) => {
        if (!vc.contest_id) return;
        // ボーダー取得
        const { data: contest } = await supabase
          .from('contests')
          .select('border_a, border_b, border_c')
          .eq('id', vc.contest_id)
          .single();
        if (!contest) return;
        const score = correctCounts[vc.id] ?? 0;
        if (score >= contest.border_a) a++;
        else if (score >= contest.border_b) b++;
        else if (score >= contest.border_c) c++;
        // ランク外はカウントしない
      }));
      setRankCounts({ A: a, B: b, C: c });
    };
    if (virtualContests.length > 0 && Object.keys(correctCounts).length > 0) fetchRanks();
  }, [virtualContests, correctCounts]);

  // グラフ用データ
  const rankData = [
    { rank: 'A', count: rankCounts.A, color: '#3182ce' },   // 青
    { rank: 'B', count: rankCounts.B, color: '#f6ad55' },   // オレンジ
    { rank: 'C', count: rankCounts.C, color: '#38a169' },   // 緑
  ];

  // バーチャルコンテスト履歴の表示
  const renderVirtualContests = () => {
    if (virtualContests.length === 0) {
      return <Text>まだバーチャルコンテストに参加していません。</Text>;
    }

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>開始日時</Th>
              <Th>コンテスト名</Th>
              <Th>ステータス</Th>
              <Th>スコア</Th>
              <Th>結果</Th>
            </Tr>
          </Thead>
          <Tbody>
            {virtualContests.map((vc) => (
              <Tr key={vc.id}>
                <Td>{format(new Date(vc.start_time), 'yyyy/MM/dd HH:mm', { locale: ja })}</Td>
                <Td>
                  {vc.contest_id ? (
                    <ChakraLink as={Link} href={`/contests/${vc.contest_id}/virtual/${vc.id}`}>
                      {vc.contests?.[0]?.name || 'N/A'}
                    </ChakraLink>
                  ) : 'N/A'}
                </Td>
                <Td>{vc.status}</Td>
                <Td>{correctCounts[vc.id] ?? 0} / {problemCounts[vc.id] ?? 'N/A'}</Td>
                <Td>
                  {vc.status === 'finished' ? (
                    <ChakraLink as={Link} href={`/contests/${vc.contest_id}/virtual/${vc.id}/result`}>結果を見る</ChakraLink>
                  ) : '-'}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <VStack spacing={8} align="start" w="full">
      <Box w="full">
        <Heading as="h3" size="md" mb={4}>分野別正答率</Heading>
        {renderCorrectnessStats()}
      </Box>

      <Box w="full">
        <Heading as="h3" size="md" mb={4}>バーチャルコンテスト履歴</Heading>
        {renderVirtualContests()}
      </Box>

      {/* ランク分布グラフ */}
      <Box w="full" mt={8}>
        <Heading as="h2" size="lg" mb={4}>バーチャルコンテスト ランク分布</Heading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rankData} barCategoryGap="30%" margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rank" tick={{ fontSize: 18, fontWeight: 'bold' }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="count" position="top" fontSize={18} fontWeight="bold" />
              {rankData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

    </VStack>
  );
} 