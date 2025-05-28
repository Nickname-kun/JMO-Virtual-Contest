"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Flex,
} from '@chakra-ui/react';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase
      .from('announcements')
      .insert([formData]);

    if (error) {
      setError(error.message);
      console.error("Error creating announcement:", error);
    } else {
      // 成功したらお知らせ一覧管理ページにリダイレクト（このページはまだ作成されていません）
      // 一旦ホームにリダイレクトするか、成功メッセージを表示するなど検討
      // ここでは仮にコンテスト管理ページにリダイレクト
      router.push('/admin/announcements'); // 後で正しい一覧ページに修正
    }
    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box maxW="xl" mx="auto" py={8} px={4}>
      <Heading as="h1" size="lg" mb={8} textAlign="center">
        お知らせ追加
      </Heading>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <FormControl isRequired>
            <FormLabel>タイトル</FormLabel>
            <Input name="title" value={formData.title} onChange={handleChange} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>内容</FormLabel>
            <Textarea name="content" value={formData.content} onChange={handleChange} rows={5} />
          </FormControl>
          <Flex justify="flex-end">
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              追加
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
} 