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
        .select('id, name, description, duration_minutes, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching contests:", error);
        setError("コンテストの取得中にエラーが発生しました。");
      } else {
        setContests(data || []);
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
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>名前</Th>
              <Th>説明</Th>
              <Th isNumeric>時間 (分)</Th>
              <Th>作成日</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {contests.map((contest) => (
              <Tr key={contest.id}>
                <Td>{contest.name}</Td>
                <Td>{contest.description}</Td>
                <Td isNumeric>{contest.duration_minutes}</Td>
                <Td>{new Date(contest.created_at).toLocaleString()}</Td>
                <Td>
                  <Button as={Link} href={`/admin/contests/${contest.id}/edit`} size="sm" mr={2}>
                    編集
                  </Button>
                  {/* 削除ボタンにonClickイベントを追加 */}
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(contest.id)} isLoading={loading}>
                    削除
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Text>コンテストはまだ登録されていません。</Text>
      )}
    </Box>
  );
} 