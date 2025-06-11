'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Box, Flex, Heading, Button, Text, VStack, Textarea, Tag, TagLabel, Wrap, WrapItem, HStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure } from '@chakra-ui/react';
import { renderLatex } from '@/utils/renderLatex';
import React, { useRef } from 'react';
import { useSession } from '@supabase/auth-helpers-react';

type Question = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  status: 'open' | 'resolved';
  best_answer_id: string | null;
  profiles: {
    username: string;
  };
  question_categories: {
    categories: {
      name: string;
    };
  }[];
};

type Answer = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
};

export default function QuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const toast = useToast();
  const session = useSession();

  const { isOpen: isResolveAlertOpen, onOpen: onResolveAlertOpen, onClose: onResolveAlertClose } = useDisclosure();
  const { isOpen: isBestAnswerAlertOpen, onOpen: onBestAnswerAlertOpen, onClose: onBestAnswerAlertClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedAnswerIdForBestAnswer, setSelectedAnswerIdForBestAnswer] = useState<string | null>(null);

  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
    checkOwnership();
    fetchIsAdmin();
  }, [params.id, question]);

  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (question && user) {
      setIsOwner(question.user_id === user.id);
    }
  };

  const fetchIsAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!error && profile) {
        setIsAdmin(profile.is_admin);
      }
    }
  };

  const fetchQuestion = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        profiles:user_id (username),
        question_categories (categories (name))
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      return;
    }

    setQuestion(data);
    setLoading(false);
    checkOwnership();
  };

  const fetchAnswers = async () => {
    const { data, error } = await supabase
      .from('answers')
      .select(`
        *,
        profiles:user_id (username)
      `)
      .eq('question_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching answers:', error);
      return;
    }

    setAnswers(data || []);
  };

  const handleDeleteQuestion = () => {
    onDeleteAlertOpen();
  };

  const confirmDeleteQuestion = async () => {
    onDeleteAlertClose();

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting question:', error);
      toast({
        title: '質問の削除に失敗しました',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: '質問を削除しました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    router.push('/maclath/questions');
  };

  const handleResolveQuestion = () => {
    if (!question) return;
    onResolveAlertOpen();
  };

  const confirmResolveQuestion = async () => {
    onResolveAlertClose();
    if (!question) return;

    const { error } = await supabase
      .from('questions')
      .update({ status: 'resolved' })
      .eq('id', question.id);

    if (error) {
      console.error('Error resolving question:', error);
      toast({
        title: '質問の解決に失敗しました',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setQuestion((prev) => prev ? { ...prev, status: 'resolved' } : null);
    toast({
      title: '質問を解決済みにしました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSelectBestAnswer = (answerId: string) => {
    if (!question || !isOwner && !isAdmin) return;
    setSelectedAnswerIdForBestAnswer(answerId);
    onBestAnswerAlertOpen();
  };

  const confirmSelectBestAnswer = async () => {
    onBestAnswerAlertClose();
    if (!question || !selectedAnswerIdForBestAnswer) return;

    const selectedAnswer = answers.find(answer => answer.id === selectedAnswerIdForBestAnswer);

    // 自分で投稿した質問に、自分で回答したベストアンサーを設定できないようにする
    if (question.user_id === selectedAnswer?.user_id) {
      toast({
        title: '設定エラー',
        description: '自問自答にはベストアンサーを設定できません。',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ best_answer_id: selectedAnswerIdForBestAnswer, status: 'resolved' })
      .eq('id', question.id);

    if (error) {
      console.error('Error setting best answer:', error);
      toast({
        title: 'ベストアンサーの設定に失敗しました',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setQuestion((prev) => prev ? { ...prev, best_answer_id: selectedAnswerIdForBestAnswer, status: 'resolved' } : null);
    toast({
      title: 'ベストアンサーを設定しました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setSelectedAnswerIdForBestAnswer(null);
  };

  if (loading) {
    return <Text textAlign="center" py={8}>読み込み中...</Text>;
  }

  if (!question) {
    return <Text textAlign="center" py={8}>質問が見つかりません</Text>;
  }

  return (
    <Box maxW="container.md" mx="auto" px={4} py={8}>
      {/* 質問一覧に戻るボタン */}
      <Button as={Link} href="/maclath/questions" variant="outline" colorScheme="gray" mb={6}>
        質問一覧に戻る
      </Button>

      {/* 質問の詳細 */}
      <Box mb={8} p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" borderColor="gray.200" bg="whiteAlpha.900">
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading as="h1" size="xl" fontWeight="semibold">{question.title}</Heading>
          <Flex gap={2}>
            {(isOwner || isAdmin) && question.status !== 'resolved' && (
              <Button
                onClick={handleResolveQuestion}
                colorScheme="green"
                size="sm"
                variant="link"
              >
                解決済みにする
              </Button>
            )}
            {(isOwner || isAdmin) && question.status !== 'resolved' && (
              <>
                <Button as={Link} href={`/maclath/questions/${params.id}/edit`} variant="link" colorScheme="blue" size="sm">
                  編集
                </Button>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={handleDeleteQuestion}
                  variant="link"
                >
                  削除
                </Button>
              </>
            )}
          </Flex>
        </Flex>

        <Flex fontSize="sm" color="gray.600" mb={4} align="center">
          <Text as="span" mr={4}>
            投稿者: {question.profiles?.username || '不明'}
          </Text>
          <Tag
            size="md"
            colorScheme={question.status === 'resolved' ? 'green' : 'blue'}
            mr={4}
          >
            <TagLabel>{question.status === 'resolved' ? '解決済み' : '回答募集中'}</TagLabel>
          </Tag>
          <Wrap spacing={2} mr={4}>
            {question.question_categories.map((qc, index) => (
              <WrapItem key={index}>
                <Link href={`/maclath/questions?category=${encodeURIComponent(qc.categories.name)}`} passHref>
                  <Tag size="md" colorScheme="purple" cursor="pointer" _hover={{ bg: "purple.200" }}>
                    <TagLabel>{qc.categories.name}</TagLabel>
                  </Tag>
                </Link>
              </WrapItem>
            ))}
          </Wrap>
          <Text as="span" fontSize="xs" color="gray.500">
            {formatDistanceToNow(new Date(question.created_at), {
              addSuffix: true,
              locale: ja,
            })}
          </Text>
        </Flex>

        <Box whiteSpace="pre-wrap" p={4} borderRadius="md" bg="gray.100" boxShadow="sm">
          {renderLatex(question.content)}
        </Box>
      </Box>

      {/* 回答一覧 */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          回答 ({answers.length})
        </Heading>
        <VStack spacing={6} align="stretch">
          {answers.map((answer) => (
            <Box 
              key={answer.id} 
              borderRadius="lg"
              boxShadow="lg"
              overflow="hidden"
            >
              {/* Green Blackboard Area for Answer Content */}
              <Box p={6} bg="green.800" color="white"
                {...(question?.best_answer_id === answer.id && {
                  border: "2px solid",
                  borderColor: "green.400",
                })}
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack spacing={2}>
                    <Text fontWeight="semibold">回答者: {answer.profiles?.username || '不明'}</Text>
                    {question?.best_answer_id === answer.id && (
                      <Tag size="sm" colorScheme="green" bg="green.600" color="white">ベストアンサー</Tag>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.300">
                    {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true, locale: ja })}
                  </Text>
                </Flex>
                <Box mt={3} p={4} whiteSpace="pre-wrap" sx={{ '& *': { color: 'white' } }}>
                  {renderLatex(answer.content)}
                </Box>
              </Box>

              {/* Orange Chalk Holder / Eraser Area */}
              <Flex justify="flex-end" p={2} bg="orange.600" alignItems="center" borderBottomRadius="lg">
                {(isOwner || isAdmin) && question?.status !== 'resolved' && question?.best_answer_id !== answer.id && (
                  <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={() => handleSelectBestAnswer(answer.id)}
                    bg="teal.600"
                    color="white"
                    _hover={{ bg: "teal.700" }}
                    mr={4}
                  >
                    ベストアンサーに選ぶ
                  </Button>
                )}
                {/* Decorative Chalk and Eraser */}
                <HStack spacing={2}>
                    {/* Chalks */}
                    <HStack spacing="1px">
                      <Box bg="white" w="16px" h="4px" borderRadius="full" borderWidth="1px" borderColor="gray.400"></Box>
                      <Box bg="pink.300" w="16px" h="4px" borderRadius="full" borderWidth="1px" borderColor="pink.400"></Box>
                      <Box bg="yellow.300" w="16px" h="4px" borderRadius="full" borderWidth="1px" borderColor="yellow.400"></Box>
                    </HStack>
                    {/* Eraser */}
                    <Box position="relative" w="50px" h="30px" borderRadius="6px" overflow="hidden">
                      {/* Orange body */}
                      <Box bg="orange.500" w="full" h="22px" position="absolute" top="0"></Box>
                      {/* Blue felt */}
                      <Box bg="blue.600" w="full" h="10px" position="absolute" bottom="0"></Box>
                      {/* Buttons */}
                      <Box bg="gray.700" w="6px" h="6px" borderRadius="full" position="absolute" top="16px" left="10px"></Box>
                      <Box bg="gray.700" w="6px" h="6px" borderRadius="full" position="absolute" top="16px" right="10px"></Box>
                    </Box>
                </HStack>
              </Flex>
            </Box>
          ))}
          <Button as={Link} href={`/maclath/questions/${params.id}/answer`} colorScheme="teal" size="lg" mt={4}>
            質問に回答する
          </Button>
        </VStack>
      </Box>

      {/* 質問解決確認用AlertDialog */}
      <AlertDialog
        isOpen={isResolveAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onResolveAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              質問を解決済みにしますか？
            </AlertDialogHeader>

            <AlertDialogBody>
              この操作は元に戻せません。この質問は解決済みとマークされ、ベストアンサーが選択されていない場合は「回答募集中」の質問一覧には表示されなくなります。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onResolveAlertClose}>
                キャンセル
              </Button>
              <Button colorScheme="green" onClick={confirmResolveQuestion} ml={3}>
                解決済みにする
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* ベストアンサー設定確認用AlertDialog */}
      <AlertDialog
        isOpen={isBestAnswerAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onBestAnswerAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              この回答をベストアンサーに設定しますか？
            </AlertDialogHeader>

            <AlertDialogBody>
              ベストアンサーに設定すると、この質問は自動的に「解決済み」になります。この操作は元に戻せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onBestAnswerAlertClose}>
                キャンセル
              </Button>
              <Button colorScheme="purple" onClick={confirmSelectBestAnswer} ml={3}>
                ベストアンサーに設定
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* 質問削除確認ダイアログ */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              質問を削除
            </AlertDialogHeader>

            <AlertDialogBody>
              この質問を本当に削除してもよろしいですか？
              この操作は元に戻せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteQuestion} ml={3} variant="link">
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 