'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Box, Heading, Button, Textarea, VStack, Flex, Text, FormHelperText, FormControl, FormLabel } from '@chakra-ui/react';
import { renderLatex } from '@/utils/renderLatex';

export default function AnswerPage({
  params,
}: {
  params: { id: string };
}) {
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('ログインが必要です');
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('answers').insert([
      {
        question_id: params.id,
        content: newAnswer,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error('Error submitting answer:', error);
      alert('回答の投稿に失敗しました');
      setSubmitting(false);
      return;
    }

    setNewAnswer('');
    setSubmitting(false);
    router.push(`/questions/${params.id}`); // 回答後、質問詳細ページに戻る
  };

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      <Heading as="h1" size="xl" mb={6}>回答を投稿</Heading>
      <VStack as="form" onSubmit={handleSubmitAnswer} spacing={4} align="stretch" p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" borderColor="gray.200" bg="whiteAlpha.900">
        <FormControl>
          <Flex justify="space-between" align="center" mb={1}>
            <FormLabel mb={0}>回答内容</FormLabel>
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
            <Box p={4} borderWidth="1px" borderRadius="md" minH="200px" whiteSpace="pre-wrap" boxShadow="sm" bg="gray.100">
              {renderLatex(newAnswer)}
            </Box>
          ) : (
            <Textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              minH="200px"
              placeholder="回答の内容を入力してください。LaTeXの数式は $...$ で囲んでください。"
              required
              focusBorderColor="blue.500"
              borderRadius="md"
            />
          )}
          <FormHelperText mt={1}>
            LaTeXの数式は $...$ で、Markdownも使用できます。
          </FormHelperText>
        </FormControl>
        <Flex justify="flex-end">
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={submitting}
            loadingText="送信中..."
            boxShadow="md"
          >
            回答を投稿
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 