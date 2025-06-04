'use client';

import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  Heading,
} from '@chakra-ui/react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function QuestionForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('questions').insert({
        title,
        content,
        category_id: categoryId,
      });

      if (error) throw error;

      router.push('/questions');
    } catch (error) {
      console.error('Error submitting question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">新しい質問を投稿</Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>タイトル</FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="質問のタイトルを入力してください"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>カテゴリ</FormLabel>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="カテゴリを選択"
                >
                  <option value="algebra">代数</option>
                  <option value="geometry">幾何</option>
                  <option value="combinatorics">組合せ論</option>
                  <option value="number-theory">整数論</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>質問内容</FormLabel>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="質問の内容を入力してください"
                  minH="300px"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isSubmitting}
                alignSelf="flex-end"
              >
                質問を投稿
              </Button>
            </VStack>
          </form>
        </VStack>
      </CardBody>
    </Card>
  );
} 