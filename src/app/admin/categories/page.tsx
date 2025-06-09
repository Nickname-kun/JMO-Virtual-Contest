'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Box, Flex, Heading, Button, Input, Textarea, VStack, Text, FormControl, FormLabel } from '@chakra-ui/react';

type Category = {
  id: string;
  name: string;
  description: string | null;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    setCategories(data || []);
    setLoading(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('categories')
      .insert([newCategory]);

    if (error) {
      console.error('Error creating category:', error);
      return;
    }

    setNewCategory({ name: '', description: '' });
    fetchCategories();
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const { error } = await supabase
      .from('categories')
      .update({
        name: editingCategory.name,
        description: editingCategory.description,
      })
      .eq('id', editingCategory.id);

    if (error) {
      console.error('Error updating category:', error);
      return;
    }

    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('このカテゴリを削除してもよろしいですか？')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return;
    }

    fetchCategories();
  };

  if (loading) {
    return <Text textAlign="center" py={8}>読み込み中...</Text>;
  }

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      <Heading as="h1" size="xl" mb={6}>カテゴリ管理</Heading>

      {/* 新規カテゴリ作成フォーム */}
      <Box mb={8} p={4} borderWidth="1px" borderRadius="md">
        <Heading as="h2" size="lg" mb={4}>新規カテゴリ作成</Heading>
        <VStack as="form" onSubmit={handleCreateCategory} spacing={4} align="stretch">
          <FormControl id="new-category-name" isRequired>
            <FormLabel>カテゴリ名</FormLabel>
            <Input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="カテゴリ名を入力してください"
            />
          </FormControl>
          <FormControl id="new-category-description">
            <FormLabel>説明</FormLabel>
            <Textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="カテゴリの説明を入力してください"
              rows={3}
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="blue"
            alignSelf="flex-end"
          >
            作成
          </Button>
        </VStack>
      </Box>

      {/* カテゴリ一覧 */}
      <VStack spacing={4} align="stretch">
        {categories.map((category) => (
          <Box key={category.id} p={4} borderWidth="1px" borderRadius="md">
            {editingCategory?.id === category.id ? (
              <VStack as="form" onSubmit={handleUpdateCategory} spacing={4} align="stretch">
                <FormControl id="edit-category-name" isRequired>
                  <FormLabel>カテゴリ名</FormLabel>
                  <Input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl id="edit-category-description">
                  <FormLabel>説明</FormLabel>
                  <Textarea
                    value={editingCategory.description || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, description: e.target.value })
                    }
                    rows={3}
                  />
                </FormControl>
                <Flex gap={2} justify="flex-end">
                  <Button
                    type="submit"
                    colorScheme="green"
                  >
                    保存
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    colorScheme="gray"
                  >
                    キャンセル
                  </Button>
                </Flex>
              </VStack>
            ) : (
              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading as="h3" size="md">{category.name}</Heading>
                  <Flex gap={2}>
                    <Button
                      onClick={() => setEditingCategory(category)}
                      variant="link"
                      colorScheme="blue"
                    >
                      編集
                    </Button>
                    <Button
                      onClick={() => handleDeleteCategory(category.id)}
                      variant="link"
                      colorScheme="red"
                    >
                      削除
                    </Button>
                  </Flex>
                </Flex>
                {category.description && (
                  <Text color="gray.600">{category.description}</Text>
                )}
              </Box>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
} 