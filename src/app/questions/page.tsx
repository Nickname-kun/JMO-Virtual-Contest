'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Box, Flex, Heading, Button, Select, Text, VStack, Tag, TagLabel, Wrap, WrapItem, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

type Question = {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  status: 'open' | 'resolved';
  profiles: {
    username: string;
  };
  question_categories: {
    categories: {
      name: string;
      id: string;
    };
  }[];
};

type Category = {
  id: string;
  name: string;
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tabIndex, setTabIndex] = useState(0); // 0: 回答募集中, 1: 解決済み
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // tabIndexに基づいて現在のステータスを決定
  const currentStatus = tabIndex === 0 ? 'open' : 'resolved';

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, [selectedCategory, currentStatus]);

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
  };

  const fetchQuestions = async () => {
    setLoading(true);
    let query = supabase
      .from('questions')
      .select(`
        *,
        profiles:user_id (username),
        question_categories!inner (categories (name, id))
      `)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.filter('question_categories.category_id', 'eq', selectedCategory);
    }

    // tabIndexに基づいてステータスでフィルタリング
    query = query.eq('status', currentStatus);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    setQuestions(data || []);
    setLoading(false);
  };

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">質問一覧</Heading>
        <Button as={Link} href="/questions/new" colorScheme="blue">
          新規質問
        </Button>
      </Flex>

      <Box mb={6}>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          width={{ base: "full", md: "64" }}
          mb={4}
        >
          <option value="all">全てのカテゴリ</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {/* ステータスフィルターをTabsに置き換え */}
        <Tabs index={tabIndex} onChange={setTabIndex} isFitted variant="enclosed">
          <TabList>
            <Tab>回答募集中</Tab>
            <Tab>解決済み</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              {loading ? (
                <Text textAlign="center" py={8}>読み込み中...</Text>
              ) : questions.length === 0 ? (
                <Text textAlign="center" py={8}>質問がありません</Text>
              ) : (
                <VStack spacing={4} align="stretch" pt={4}>
                  {questions.map((question) => (
                    <Box
                      key={question.id}
                      as={Link}
                      href={`/questions/${question.id}`}
                      p={5}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      bg="whiteAlpha.900"
                      boxShadow="lg"
                      _hover={{
                        bg: "gray.100",
                        transform: 'translateY(-2px)',
                        boxShadow: "xl",
                      }}
                      transition="all 0.2s ease-in-out"
                    >
                      <Flex justify="space-between" align="flex-start" mb={2}>
                        <Box>
                          <Heading as="h2" size="md" mb={1} fontWeight="semibold">{question.title}</Heading>
                          <Text fontSize="sm" color="gray.600">
                            投稿者: {question.profiles?.username || '不明'}
                          </Text>
                        </Box>
                        <Tag
                          size="md"
                          colorScheme={question.status === 'resolved' ? 'green' : 'blue'}
                        >
                          <TagLabel>{question.status === 'resolved' ? '解決済み' : '回答募集中'}</TagLabel>
                        </Tag>
                      </Flex>
                      <Wrap spacing={2} mb={3}>
                        {question.question_categories.map((qc, index) => (
                          <WrapItem key={index}>
                            <Tag
                              size="md"
                              colorScheme="yellow"
                              cursor="pointer"
                              onClick={() => setSelectedCategory(qc.categories.id)}
                            >
                              <TagLabel>{qc.categories.name}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                      <Text fontSize="xs" color="gray.500">
                        {formatDistanceToNow(new Date(question.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </TabPanel>
            <TabPanel p={0}>
              {loading ? (
                <Text textAlign="center" py={8}>読み込み中...</Text>
              ) : questions.length === 0 ? (
                <Text textAlign="center" py={8}>質問がありません</Text>
              ) : (
                <VStack spacing={4} align="stretch" pt={4}>
                  {questions.map((question) => (
                    <Box
                      key={question.id}
                      as={Link}
                      href={`/questions/${question.id}`}
                      p={5}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      bg="whiteAlpha.900"
                      boxShadow="lg"
                      _hover={{
                        bg: "gray.100",
                        transform: 'translateY(-2px)',
                        boxShadow: "xl",
                      }}
                      transition="all 0.2s ease-in-out"
                    >
                      <Flex justify="space-between" align="flex-start" mb={2}>
                        <Box>
                          <Heading as="h2" size="md" mb={1} fontWeight="semibold">{question.title}</Heading>
                          <Text fontSize="sm" color="gray.600">
                            投稿者: {question.profiles?.username || '不明'}
                          </Text>
                        </Box>
                        <Tag
                          size="md"
                          colorScheme={question.status === 'resolved' ? 'green' : 'blue'}
                        >
                          <TagLabel>{question.status === 'resolved' ? '解決済み' : '回答募集中'}</TagLabel>
                        </Tag>
                      </Flex>
                      <Wrap spacing={2} mb={3}>
                        {question.question_categories.map((qc, index) => (
                          <WrapItem key={index}>
                            <Tag
                              size="md"
                              colorScheme="yellow"
                              cursor="pointer"
                              onClick={() => setSelectedCategory(qc.categories.id)}
                            >
                              <TagLabel>{qc.categories.name}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                      <Text fontSize="xs" color="gray.500">
                        {formatDistanceToNow(new Date(question.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
} 