'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Spinner,
  Text,
  Select,
  IconButton,
  HStack,
  Tooltip,
} from "@chakra-ui/react";
import ColoredUserName from '@/components/ColoredUserName';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 20;

async function getProfiles(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from("profiles")
    .select("id, username, created_at, is_admin, affiliation", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  return { data, error, count };
}

async function getExplanationCounts(userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase
    .from('explanations')
    .select('user_id')
    .in('user_id', userIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    counts[row.user_id] = (counts[row.user_id] || 0) + 1;
  });
  return counts;
}

async function getBestAnswerCounts(userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  // 1. questionsテーブルからbest_answer_idがnullでない全レコードを取得
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('best_answer_id')
    .not('best_answer_id', 'is', null);
  if (qError || !questions) return {};
  const bestAnswerIds = questions.map((q: any) => q.best_answer_id).filter((id: any) => !!id);
  if (bestAnswerIds.length === 0) return {};
  // 2. best_answer_idに対応するanswersのuser_idを取得
  const { data: answers, error: aError } = await supabase
    .from('answers')
    .select('id, user_id')
    .in('id', bestAnswerIds);
  if (aError || !answers) return {};
  // 3. user_idごとにカウント
  const counts: Record<string, number> = {};
  answers.forEach((row: any) => {
    if (userIds.includes(row.user_id)) {
      counts[row.user_id] = (counts[row.user_id] || 0) + 1;
    }
  });
  return counts;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanationCounts, setExplanationCounts] = useState<Record<string, number>>({});
  const [bestAnswerCounts, setBestAnswerCounts] = useState<Record<string, number>>({});
  const [no1ExplanationUsers, setNo1ExplanationUsers] = useState<string[]>([]);
  const [no1BestAnswerUsers, setNo1BestAnswerUsers] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<'created_at' | 'explanation' | 'best_answer'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setLoading(true);
    getProfiles(page).then(async ({ data, error, count }) => {
      if (error) {
        setError(error.message);
        setProfiles([]);
        setCount(0);
        setExplanationCounts({});
        setBestAnswerCounts({});
        setNo1ExplanationUsers([]);
        setNo1BestAnswerUsers([]);
      } else {
        setProfiles(data || []);
        setCount(count || 0);
        setError(null);
        // 追加: 解説数・ベストアンサー数・No.1
        const userIds = (data || []).map((u: any) => u.id);
        const [exCounts, baCounts] = await Promise.all([
          getExplanationCounts(userIds),
          getBestAnswerCounts(userIds)
        ]);
        setExplanationCounts(exCounts);
        setBestAnswerCounts(baCounts);
        // 管理人を除外したuserIdリスト
        const nonAdminUserIds = (data || []).filter((u: any) => !u.is_admin).map((u: any) => u.id);
        let maxEx = -1;
        let maxBa = -1;
        let exNo1Users: string[] = [];
        let baNo1Users: string[] = [];
        for (const uid of nonAdminUserIds) {
          const exCount = exCounts[uid] || 0;
          const baCount = baCounts[uid] || 0;
          if (exCount > maxEx) {
            maxEx = exCount;
            exNo1Users = [uid];
          } else if (exCount === maxEx) {
            exNo1Users.push(uid);
          }
          if (baCount > maxBa) {
            maxBa = baCount;
            baNo1Users = [uid];
          } else if (baCount === maxBa) {
            baNo1Users.push(uid);
          }
        }
        setNo1ExplanationUsers(maxEx >= 1 ? exNo1Users : []);
        setNo1BestAnswerUsers(maxBa >= 1 ? baNo1Users : []);
      }
      setLoading(false);
    });
  }, [page]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  // ソート処理
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (sortKey === 'explanation') {
      const aCount = explanationCounts[a.id] || 0;
      const bCount = explanationCounts[b.id] || 0;
      return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
    } else if (sortKey === 'best_answer') {
      const aCount = bestAnswerCounts[a.id] || 0;
      const bCount = bestAnswerCounts[b.id] || 0;
      return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
    } else {
      // created_at
      return sortOrder === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <Box maxW="2xl" mx="auto" py={8}>
      <Heading as="h1" size="lg" mb={6}>
        ユーザー一覧
      </Heading>
      {/* 並び替えUI */}
      <HStack mb={4} spacing={2}>
        <Text fontWeight="bold">並び替え:</Text>
        <Select size="sm" value={sortKey} onChange={e => setSortKey(e.target.value as any)} w="auto">
          <option value="created_at">登録日</option>
          <option value="explanation">解説投稿数</option>
          <option value="best_answer">ベストアンサー数</option>
        </Select>
        <IconButton
          aria-label={sortOrder === 'asc' ? '昇順' : '降順'}
          icon={sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          variant="ghost"
        />
        <Text fontSize="sm" color="gray.500">
          現在：{sortKey === 'created_at' ? '登録日' : sortKey === 'explanation' ? '解説投稿数' : 'ベストアンサー数'}（{sortOrder === 'asc' ? '昇順' : '降順'}）
        </Text>
      </HStack>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      <Box overflowX={{ base: 'auto', md: 'visible' }} borderRadius="md" boxShadow="md" bg="white" w="100%">
        <Table variant="simple" whiteSpace="nowrap" w="100%">
          <Thead>
            <Tr>
              <Th>ユーザー名</Th>
              <Th>所属</Th>
              {/* 解説投稿数・ベストアンサー数の列は非表示に */}
              <Th textAlign="right">
                {sortKey === 'created_at' ? '登録日' : sortKey === 'explanation' ? '解説投稿数' : 'ベストアンサー数'}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <Spinner size="lg" />
                </Td>
              </Tr>
            ) : sortedProfiles.length > 0 ? (
              sortedProfiles.map((user) => (
                <Tr key={user.id} _hover={{ bg: "gray.50" }}>
                  <Td>
                    <ColoredUserName
                      userId={user.id}
                      username={user.username || user.id}
                      isAdmin={user.is_admin}
                      explanationCount={explanationCounts[user.id] || 0}
                      bestAnswerCount={bestAnswerCounts[user.id] || 0}
                      isExplanationNo1={!user.is_admin && no1ExplanationUsers.includes(user.id)}
                      isBestAnswerNo1={!user.is_admin && no1BestAnswerUsers.includes(user.id)}
                    />
                  </Td>
                  <Td>
                    {user.affiliation && user.affiliation.length > 15 ? (
                      <Tooltip label={user.affiliation}>
                        <span style={{ cursor: 'pointer' }}>
                          {user.affiliation.slice(0, 15) + '…'}
                        </span>
                      </Tooltip>
                    ) : (
                      user.affiliation || "-"
                    )}
                  </Td>
                  {/* 解説投稿数・ベストアンサー数の列は非表示に */}
                  <Td textAlign="right">
                    {sortKey === 'created_at'
                      ? formatDate(user.created_at)
                      : sortKey === 'explanation'
                        ? explanationCounts[user.id] || 0
                        : bestAnswerCounts[user.id] || 0}
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  ユーザーが見つかりません
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
      {/* ページネーション */}
      <Flex justify="center" align="center" gap={2} mt={6}>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page === 1}
        >
          前へ
        </Button>
        <Text>
          {page} / {totalPages || 1}
        </Text>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          isDisabled={page === totalPages || totalPages === 0}
        >
          次へ
        </Button>
      </Flex>
    </Box>
  );
} 