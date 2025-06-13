"use client";

import { useState, FormEvent } from 'react';
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
  NumberInput,
  NumberInputField,
  VStack,
  Alert,
  AlertIcon,
  Flex,
  useToast,
} from '@chakra-ui/react';

export default function NewContestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 180, // デフォルト値
    year: new Date().getFullYear(), // 新しくyearフィールドを追加
    border_a: '',
    border_b: '',
    border_c: '',
  });
  const toast = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from('contests')
      .insert([
        {
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          year: formData.year, // yearフィールドを追加
          border_a: formData.border_a ? parseInt(formData.border_a) : null,
          border_b: formData.border_b ? parseInt(formData.border_b) : null,
          border_c: formData.border_c ? parseInt(formData.border_c) : null,
        },
      ])
      .select()
      .single();

    if (error) {
      setError(error.message);
      console.error("Error creating contest:", error);
      toast({
        title: 'コンテスト作成エラー',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else if (data) {
      toast({
        title: 'コンテスト作成成功',
        description: '新しいコンテストが作成されました。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/admin/contests');
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

  const handleNumberChange = (name: string) => (_: string, valueAsNumber: number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: valueAsNumber,
    }));
  };

  return (
    <Box maxW="xl" mx="auto" py={8} px={4}>
      <Heading as="h1" size="lg" mb={8} textAlign="center">
        新規コンテスト作成
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
            <FormLabel>コンテスト名</FormLabel>
            <Input name="name" value={formData.name} onChange={handleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>説明</FormLabel>
            <Textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>開催年度</FormLabel>
            <NumberInput min={1900} value={formData.year} onChange={handleNumberChange("year")}>
              <NumberInputField name="year" />
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>試験時間 (分)</FormLabel>
            <NumberInput min={1} value={formData.duration_minutes} onChange={handleNumberChange("duration_minutes")}>
              <NumberInputField name="duration_minutes" />
            </NumberInput>
          </FormControl>
          <FormControl id="border_a">
            <FormLabel>ボーダーA</FormLabel>
            <Input type="number" name="border_a" value={formData.border_a} onChange={handleChange} />
          </FormControl>
          <FormControl id="border_b">
            <FormLabel>ボーダーB</FormLabel>
            <Input type="number" name="border_b" value={formData.border_b} onChange={handleChange} />
          </FormControl>
          <FormControl id="border_c">
            <FormLabel>ボーダーC</FormLabel>
            <Input type="number" name="border_c" value={formData.border_c} onChange={handleChange} />
          </FormControl>
          <Flex justify="flex-end">
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              作成
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
} 