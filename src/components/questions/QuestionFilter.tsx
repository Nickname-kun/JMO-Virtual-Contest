'use client';

import {
  Box,
  HStack,
  Select,
  Input,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function QuestionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    router.push(`/questions?${params.toString()}`);
  };

  return (
    <Box>
      <HStack spacing={4}>
        <Select
          placeholder="カテゴリを選択"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxW="200px"
        >
          <option value="algebra">代数</option>
          <option value="geometry">幾何</option>
          <option value="combinatorics">組合せ論</option>
          <option value="number-theory">整数論</option>
        </Select>
        <Input
          placeholder="質問を検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="300px"
        />
        <Button colorScheme="blue" onClick={handleFilter}>
          検索
        </Button>
      </HStack>
    </Box>
  );
} 