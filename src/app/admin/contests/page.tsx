"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Box,
  Heading,
  Text,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Container,
  useToast, // 削除通知のためにToastを使用
  Spinner,
  Alert,
  AlertIcon,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon // Accordionコンポーネントを追加
} from '@chakra-ui/react';
import Link from 'next/link';
import LoadingOverlay from "@/components/LoadingOverlay";
import { useLoading } from '@/contexts/LoadingContext';

// サーバーコンポーネントからクライアントコンポーネントに変更
export default function AdminContestsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  // データ取得をuseEffect内で行う
  useEffect(() => {
    const fetchContests = async () => {
      setLoading(true);
      showLoading(); // ローディング開始
      const { data, error } = await supabase
        .from('contests')
        .select('id, name, description, duration_minutes, year, created_at')
        .order('year', { ascending: false });

      if (error) {
        console.error("Error fetching contests:", error);
        setError("コンテストの取得中にエラーが発生しました。");
      } else {
        // コンテストを年度ごとにグループ化
        const contestsByYear: { [year: string]: any[] } = {};
        data?.forEach(contest => {
          const year = contest.year.toString();
          if (!contestsByYear[year]) {
            contestsByYear[year] = [];
          }
          contestsByYear[year].push(contest);
        });

        // 年度を降順にソート
        const sortedYears = Object.keys(contestsByYear).sort((a, b) => parseInt(b) - parseInt(a));

        // ソートされた年度順にコンテストデータを整形
        const formattedContests = sortedYears.map(year => ({
          year: parseInt(year),
          contests: contestsByYear[year]
        }));

        setContests(formattedContests || []);
      }
      setLoading(false);
      hideLoading(); // ローディング終了
    };
    fetchContests();
  }, [supabase]); // supabaseの変更に依存

  // 削除処理
  const handleDelete = async (id: string) => {
    if (window.confirm("このコンテストを削除してもよろしいですか？")) {
      setLoading(true);
      showLoading(); // ローディング開始
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting contest:", error);
        toast({
          title: '削除に失敗しました',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // 削除成功したら一覧を更新
        setContests(contests.filter(contest => contest.id !== id));
        toast({
          title: '削除しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      setLoading(false);
      hideLoading(); // ローディング終了
    }
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={8} px={4} textAlign="center">
        <Spinner size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8} px={4}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box maxW="container.lg" mx="auto" py={8} px={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">コンテスト管理</Heading>
        <Button as={Link} href="/admin/contests/new" colorScheme="blue">
          新規コンテスト作成
        </Button>
      </Flex>

      {contests && contests.length > 0 ? (
        <Accordion allowMultiple defaultIndex={[0]}> {/* 最初の年度をデフォルトで開く */}
          {contests.map((yearGroup: { year: number; contests: any[] }) => (
            <AccordionItem key={yearGroup.year}>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading as="h2" size="md">{yearGroup.year}年のコンテスト</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                {yearGroup.contests.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>名前</Th>
                        <Th>説明</Th>
                        <Th isNumeric>時間 (分)</Th>
                        <Th>開催年度</Th>
                        <Th>作成日</Th>
                        <Th>操作</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {yearGroup.contests.map((contest: any) => (
                        <Tr key={contest.id}>
                          <Td>{contest.name}</Td>
                          <Td>{contest.description}</Td>
                          <Td isNumeric>{contest.duration_minutes}</Td>
                          <Td>{contest.year}</Td>
                          <Td>{new Date(contest.created_at).toLocaleString()}</Td>
                          <Td>
                            <Button as={Link} href={`/admin/contests/${contest.id}/edit`} size="sm" mr={2}>
                              編集
                            </Button>
                            <Button size="sm" colorScheme="red" onClick={() => handleDelete(contest.id)} isLoading={loading}>
                              削除
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text>この年度のコンテストはまだ登録されていません。</Text>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Text>コンテストはまだ登録されていません。</Text>
      )}
    </Box>
  );
} 