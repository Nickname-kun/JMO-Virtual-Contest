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
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useLoading } from '@/contexts/LoadingContext';

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      showLoading();
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, content, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
        setError("お知らせの取得中にエラーが発生しました。");
      } else {
        setAnnouncements(data || []);
      }
      setLoading(false);
      hideLoading();
    };
    fetchAnnouncements();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    if (window.confirm("このお知らせを削除してもよろしいですか？")) {
      setLoading(true);
      showLoading();
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting announcement:", error);
        toast({
          title: '削除に失敗しました',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setAnnouncements(announcements.filter(announcement => announcement.id !== id));
        toast({
          title: '削除しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      setLoading(false);
      hideLoading();
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
    <Container maxW="container.lg" py={8} px={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">お知らせ管理</Heading>
        <Button as={Link} href="/admin/announcements/new" colorScheme="blue">
          新規お知らせ追加
        </Button>
      </Flex>

      {announcements && announcements.length > 0 ? (
        <Box bg="white" borderRadius="md" boxShadow="sm" overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>タイトル</Th>
                <Th>内容</Th>
                <Th>作成日</Th>
                <Th>操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {announcements.map((announcement) => (
                <Tr key={announcement.id}>
                  <Td>{announcement.title}</Td>
                  <Td>{announcement.content.substring(0, 100)}{announcement.content.length > 100 ? '...' : ''}</Td>
                  <Td>{new Date(announcement.created_at).toLocaleString()}</Td>
                  <Td>
                    <Button as={Link} href={`/admin/announcements/${announcement.id}/edit`} size="sm" mr={2}>
                      編集
                    </Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleDelete(announcement.id)} isLoading={loading}>
                      削除
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Text>お知らせはまだ登録されていません。</Text>
      )}
    </Container>
  );
} 