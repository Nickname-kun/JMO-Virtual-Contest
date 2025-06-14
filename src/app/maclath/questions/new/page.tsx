'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Flex, Heading, Button, Input, Textarea, VStack, Text, FormControl, FormLabel, Stack, FormHelperText, Checkbox } from '@chakra-ui/react';
import { renderLatex } from '@/utils/renderLatex';
import { useToast } from '@chakra-ui/react';

type Category = {
  id: string;
  name: string;
};

export default function NewQuestionPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'ログインが必要です',
          description: '質問を投稿するにはログインしてください。',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        router.push('/auth');
      }
    };

    checkAuth();
    fetchCategories();
  }, [supabase, router, toast]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      return;
    }
    
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: '認証エラー',
        description: 'ログインが必要です。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/login');
      return;
    }

    // カテゴリが選択されているか確認
    if (selectedCategoryIds.length === 0) {
      toast({
        title: '入力エラー',
        description: 'カテゴリを1つ以上選択してください。',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert([
        {
          title,
          content,
          user_id: user.id,
        },
      ])
      .select();

    if (questionError) {
      alert('質問の作成に失敗しました');
      setLoading(false);
      return;
    }

    const newQuestionId = questionData[0].id;

    const categoryInserts = selectedCategoryIds.map(categoryId => ({
      question_id: newQuestionId,
      category_id: categoryId,
    }));

    if (categoryInserts.length > 0) {
      const { error: categoryError } = await supabase
        .from('question_categories')
        .insert(categoryInserts);

      if (categoryError) {
        alert('カテゴリの紐付けに失敗しました');
        setLoading(false);
        return;
      }
    }

    router.push('/maclath/questions');
    router.refresh();
  };

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">新規質問</Heading>
        <Button as={Link} href="/maclath/questions" variant="link" colorScheme="blue">
          質問一覧に戻る
        </Button>
      </Flex>

      <VStack as="form" onSubmit={handleSubmit} spacing={6} align="stretch" p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" borderColor="gray.200" bg="whiteAlpha.900">
        <FormControl id="question-title" isRequired>
          <FormLabel>タイトル</FormLabel>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="質問のタイトルを入力してください"
            focusBorderColor="blue.500"
            borderRadius="md"
          />
        </FormControl>

        <FormControl id="question-categories">
          <FormLabel>カテゴリ</FormLabel>
          <Stack spacing={4}>
            {categories.map((category) => (
              <Box key={category.id}>
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={() => {
                    if (selectedCategoryIds.includes(category.id)) {
                      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                    } else {
                      setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor={`category-${category.id}`}>
                {category.name}
                </label>
              </Box>
            ))}
          </Stack>
          <FormHelperText mt={2}>
            選択中のカテゴリ: {selectedCategoryIds.length > 0 
              ? selectedCategoryIds
                  .map(id => categories.find(cat => cat.id === id)?.name || id)
                  .join(', ') 
              : 'なし'}
          </FormHelperText>
        </FormControl>

        <FormControl>
          <Flex justify="space-between" align="center" mb={1}>
            <FormLabel mb={0}>内容</FormLabel>
            <Button
              type="button"
              onClick={() => setPreview(!preview)}
              variant="link"
              colorScheme="blue"
            >
              {preview ? '編集' : 'プレビュー'}
            </Button>
          </Flex>
          {preview ? (
            <Box p={4} borderWidth="1px" borderRadius="md" minH="300px" whiteSpace="pre-wrap" boxShadow="sm" bg="gray.100">
              {renderLatex(content)}
            </Box>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minH="300px"
              placeholder="質問の内容を入力してください。LaTeXの数式は $...$ で囲んでください。"
              required
              focusBorderColor="blue.500"
              borderRadius="md"
            />
          )}
          <FormHelperText mt={1}>
            LaTeXの数式は $...$ で、Markdownも使用できます。
          </FormHelperText>
        </FormControl>

        <Flex justify="flex-end" gap={4}>
          <Button as={Link} href="/maclath/questions" variant="outline" colorScheme="gray">
            キャンセル
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            loadingText="送信中..."
          >
            投稿
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 