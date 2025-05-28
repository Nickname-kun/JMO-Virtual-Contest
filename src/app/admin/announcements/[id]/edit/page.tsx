"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  Spinner,
  Text,
} from "@chakra-ui/react";

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // お知らせID
  const announcementId = params?.id as string;

  useEffect(() => {
    // お知らせデータ取得
    const fetchAnnouncement = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", announcementId)
        .single();
      if (error || !data) {
        setError("お知らせの取得に失敗しました");
      } else {
        setFormData({
          title: data.title,
          content: data.content,
        });
      }
      setLoading(false);
    };
    if (announcementId) fetchAnnouncement();
  }, [announcementId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .update(formData)
        .eq("id", announcementId);
      if (error) throw error;
      // 成功したらお知らせ一覧管理ページにリダイレクト
      router.push("/admin/announcements");
    } catch (error) {
      setError(error instanceof Error ? error.message : "お知らせの更新に失敗しました");
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

  if (loading) {
    return (
      <Box py={20} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box maxW="xl" mx="auto" py={8} px={4}>
      <Heading as="h1" size="lg" mb={8} textAlign="center">
        お知らせの編集
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
              保存
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
} 