'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Box, Flex, Heading, Button, Select, Text, VStack, Tag, TagLabel, Wrap, WrapItem, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';

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
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ
  const [totalQuestions, setTotalQuestions] = useState(0); // 総質問数
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const toast = useToast();

  const PAGE_SIZE = 10; // 1ページあたりの質問数

  // tabIndexに基づいて現在のステータスを決定
  const currentStatus = tabIndex === 0 ? 'open' : 'resolved';

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
    fetchCategories();
    fetchQuestions();
  }, [selectedCategory, currentStatus, currentPage, supabase]);

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

    // まず、総質問数を取得
    let countQuery = supabase
      .from('questions')
      .select('*', { count: 'exact', head: true }); // count: 'exact' と head: true を使用

    if (selectedCategory !== 'all') {
      countQuery = countQuery.filter('question_categories.category_id', 'eq', selectedCategory);
    }
    countQuery = countQuery.eq('status', currentStatus);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error fetching questions count:', countError);
      setLoading(false);
      return;
    }
    setTotalQuestions(count || 0);

    // 次に、現在のページに表示する質問データを取得
    let dataQuery = supabase
      .from('questions')
      .select(`
        *,
        profiles:user_id (username),
        question_categories!inner (categories (name, id))
      `)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      dataQuery = dataQuery.filter('question_categories.category_id', 'eq', selectedCategory);
    }
    dataQuery = dataQuery.eq('status', currentStatus);

    // ページネーションを適用
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    dataQuery = dataQuery.range(from, to);

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      console.error('Error fetching questions data:', dataError);
      setLoading(false);
      return;
    }

    setQuestions(data || []);
    setLoading(false);
  };

  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // 表示する最大ページ数

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">質問一覧</Heading>
        {isLoggedIn ? (
          <Button as={Link} href="/maclath/questions/new" colorScheme="blue">
            新規質問
          </Button>
        ) : (
          <Button as={Link} href="/auth" colorScheme="blue" variant="outline">
            ログインして質問を投稿
          </Button>
        )}
      </Flex>

      <Box mb={6}>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          width={{ base: "full", md: "64" }}
          mb={4}
          borderColor="blue.500"
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
          <TabList borderColor="transparent">
            <Tab
              _selected={{ color: 'red.800', borderColor: 'red.500', borderBottomColor: 'red.800' }}
              borderColor="blue.500"
            >回答募集中</Tab>
            <Tab
              _selected={{ color: 'red.800', borderColor: 'red.500', borderBottomColor: 'red.800' }}
              borderColor="blue.500"
            >解決済み</Tab>
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
                      href={`/maclath/questions/${question.id}`}
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
              {totalPages > 1 && (
                <Flex justify="center" mt={8} gap={2}>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    isDisabled={currentPage === 1}
                    variant="outline"
                    colorScheme="purple"
                  >
                    前へ
                  </Button>
                  {getPageNumbers().map((page, index) => (
                    <Button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      variant={page === currentPage ? 'solid' : 'outline'}
                      colorScheme={page === currentPage ? 'purple' : 'gray'}
                      isDisabled={typeof page !== 'number'}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    isDisabled={currentPage === totalPages}
                    variant="outline"
                    colorScheme="purple"
                  >
                    次へ
                  </Button>
                </Flex>
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
                      href={`/maclath/questions/${question.id}`}
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
              {totalPages > 1 && (
                <Flex justify="center" mt={8} gap={2}>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    isDisabled={currentPage === 1}
                    variant="outline"
                    colorScheme="purple"
                  >
                    前へ
                  </Button>
                  {getPageNumbers().map((page, index) => (
                    <Button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      variant={page === currentPage ? 'solid' : 'outline'}
                      colorScheme={page === currentPage ? 'purple' : 'gray'}
                      isDisabled={typeof page !== 'number'}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    isDisabled={currentPage === totalPages}
                    variant="outline"
                    colorScheme="purple"
                  >
                    次へ
                  </Button>
                </Flex>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
} 