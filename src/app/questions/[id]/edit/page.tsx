'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Flex, Heading, Button, Input, Textarea, VStack, Text, FormControl, FormLabel, Stack, FormHelperText } from '@chakra-ui/react';
import { renderLatex } from '@/utils/renderLatex';

type Category = {
  id: string;
  name: string;
};

type Question = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  question_categories: {
    category_id: string;
  }[];
};

export default function EditQuestionPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchQuestion();
  }, []);

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

  const fetchQuestion = async () => {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        question_categories (
          category_id
        )
      `)
      .eq('id', params.id)
      .single();

    if (questionError) {
      alert('質問の取得に失敗しました');
      router.push('/questions');
      return;
    }

    if (question.status === 'resolved') {
      alert('解決済みの質問は編集できません');
      router.push(`/questions/${params.id}`);
      return;
    }

    setTitle(question.title);
    setContent(question.content);
    setSelectedCategoryIds(question.question_categories.map((qc: any) => qc.category_id));
    setInitialLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログインが必要です');
      router.push('/login');
      return;
    }

    // 質問の更新
    const { error: questionError } = await supabase
      .from('questions')
      .update({
        title,
        content,
      })
      .eq('id', params.id);

    if (questionError) {
      alert('質問の更新に失敗しました');
      setLoading(false);
      return;
    }

    // 既存のカテゴリ紐付けを削除
    const { error: deleteError } = await supabase
      .from('question_categories')
      .delete()
      .eq('question_id', params.id);

    if (deleteError) {
      alert('カテゴリの更新に失敗しました');
      setLoading(false);
      return;
    }

    // 新しいカテゴリ紐付けを作成
    const categoryInserts = selectedCategoryIds.map(categoryId => ({
      question_id: params.id,
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

    router.push(`/questions/${params.id}`);
  };

  if (initialLoading) {
    return (
      <Box maxW="container.md" mx="auto" px={4} py={8}>
        <Text>読み込み中...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">質問を編集</Heading>
        <Button as={Link} href={`/questions/${params.id}`} variant="link" colorScheme="blue">
          質問に戻る
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
          <Button as={Link} href={`/questions/${params.id}`} variant="outline" colorScheme="gray">
            キャンセル
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            loadingText="更新中..."
          >
            更新
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 