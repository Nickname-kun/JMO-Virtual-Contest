'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Box, Flex, Heading, Button, Text, VStack, Textarea, Tag, TagLabel, Wrap, WrapItem, HStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, IconButton, useBreakpointValue } from '@chakra-ui/react';
import { renderLatex } from '@/utils/renderLatex';
import React, { useRef } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';

type Question = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  status: 'open' | 'resolved';
  best_answer_id: string | null;
  referenced_problem_id: string | null;
  profiles: {
    username: string;
    is_admin: boolean;
  };
  question_categories: {
    categories: {
      name: string;
    };
  }[];
  referenced_problem?: {
    id: string;
    title: string;
    number: number;
    contest: {
      name: string;
    };
  };
};

type Answer = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    is_admin: boolean;
  };
  likes_count: number;
  is_liked: boolean;
};

type RawAnswer = Omit<Answer, 'likes_count' | 'is_liked'> & {
  likes_count: { count: number }[];
  is_liked: { user_id: string }[] | null;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const toast = useToast();
  const session = useSession();

  const { isOpen: isResolveAlertOpen, onOpen: onResolveAlertOpen, onClose: onResolveAlertClose } = useDisclosure();
  const { isOpen: isBestAnswerAlertOpen, onOpen: onBestAnswerAlertOpen, onClose: onBestAnswerAlertClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedAnswerIdForBestAnswer, setSelectedAnswerIdForBestAnswer] = useState<string | null>(null);

  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const { isOpen: isAnswerDeleteAlertOpen, onOpen: onAnswerDeleteAlertOpen, onClose: onAnswerDeleteAlertClose } = useDisclosure();
  const [answerToDeleteId, setAnswerToDeleteId] = useState<string | null>(null);

  const bestAnswerText = useBreakpointValue({
    base: "BA",
    md: "ベストアンサー",
  });

  useEffect(() => {
    fetchQuestion();
    fetchAnswers();
    checkOwnership();
    fetchIsAdmin();
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
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
        profiles:user_id (username, is_admin),
        question_categories (categories (name)),
        referenced_problem:referenced_problem_id (
          id,
          title,
          number,
          contest:contest_id (
            id,
            name
          )
        )
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
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { data, error } = await supabase
      .from('answers')
      .select(`
        *,
        profiles:user_id (username, is_admin),
        likes_count:answer_likes(count),
        is_liked:answer_likes!left(user_id)
      `)
      .eq('question_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching answers:', error);
      return;
    }

    // いいねの情報を整形
    const formattedAnswers = data.map((answer: RawAnswer) => ({
      ...answer,
      likes_count: answer.likes_count[0]?.count || 0,
      is_liked: answer.is_liked?.some(like => like.user_id === userId) || false
    }));

    setAnswers(formattedAnswers);
  };

  const handleDeleteQuestion = () => {
    onDeleteAlertOpen();
  };

  const confirmDeleteQuestion = async () => {
    onDeleteAlertClose();

    if (!isOwner && !isAdmin) {
      toast({
        title: '権限がありません',
        description: 'この質問を削除する権限がありません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

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

  const handleDeleteAnswer = (answerId: string) => {
    if (!isAdmin) {
      toast({
        title: '権限がありません',
        description: '回答を削除する権限がありません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setAnswerToDeleteId(answerId);
    onAnswerDeleteAlertOpen();
  };

  const confirmDeleteAnswer = async () => {
    onAnswerDeleteAlertClose();
    if (!answerToDeleteId) return;

    const { error } = await supabase
      .from('answers')
      .delete()
      .eq('id', answerToDeleteId);

    if (error) {
      console.error('Error deleting answer:', error);
      toast({
        title: '回答の削除に失敗しました',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: '回答を削除しました',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    fetchAnswers(); // 回答リストを更新
    setAnswerToDeleteId(null);
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

  const handleLike = async (answerId: string) => {
    if (!isLoggedIn) {
      toast({
        title: 'ログインが必要です',
        description: '「いいね」するにはログインしてください。',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      router.push('/auth');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;

    if (answer.is_liked) {
      // いいねを削除
      const { error } = await supabase
        .from('answer_likes')
        .delete()
        .eq('answer_id', answerId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing like:', error);
        return;
      }
    } else {
      // いいねを追加
      const { error } = await supabase
        .from('answer_likes')
        .insert([
          {
            answer_id: answerId,
            user_id: user.id,
          },
        ]);

      if (error) {
        console.error('Error adding like:', error);
        return;
      }
    }

    // 回答一覧を更新
    fetchAnswers();
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
        <Flex justify="space-between" align="start" mb={4}>
          <Heading as="h1" size="xl" color="gray.800">
            {question.title}
          </Heading>
        </Flex>

        <Flex fontSize="sm" color="gray.600" mb={4} align="center">
          <Text as="span" mr={4} color="gray.600">
            投稿者: <Link href={`/profile/${question.user_id}`}>
              <span style={{ color: question.profiles?.is_admin ? "rgb(102, 0, 153)" : undefined }}>
                {question.profiles?.username || '不明'}
              </span>
            </Link>
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

        {isOwner && (
          <Flex mt={4} justifyContent="flex-end" width="100%" fontSize="sm">
            {question.status === 'open' ? (
              <Button variant="link" colorScheme="green" onClick={handleResolveQuestion} mr={2}>
                解決済みにする
              </Button>
            ) : (
              <Tag size="md" colorScheme="green" mr={2}>
                <TagLabel>解決済み</TagLabel>
              </Tag>
            )}
            <Button as={Link} href={`/maclath/questions/${question.id}/edit`} variant="link" colorScheme="blue" mr={2}>
              編集
            </Button>
            <Button variant="link" colorScheme="red" onClick={handleDeleteQuestion}>
              削除
            </Button>
          </Flex>
        )}

        {question.referenced_problem && (
          <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50" mt={4}>
            <Text fontSize="sm" color="blue.700">
              参照元の問題: <Link href={`/problems/${question.referenced_problem.id}`} color="blue.600" style={{ textDecoration: 'underline' }}>
                {question.referenced_problem.contest.name} 問題{question.referenced_problem.number}
              </Link>
            </Text>
          </Box>
        )}
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
                  <HStack spacing={2} flexWrap="wrap">
                    <Text 
                      fontWeight="semibold" 
                      mb={{ base: 1, md: 0 }}
                    >
                      回答者: <Link href={`/profile/${answer.user_id}`}>
                        <span style={answer.profiles?.is_admin ? {
                          color: "rgb(102, 0, 153)",
                          WebkitTextStroke: "0.2px white",
                          fontWeight: "bold"
                        } : {}}>
                          {answer.profiles?.username || '不明'}
                        </span>
                      </Link>
                    </Text>
                    {question?.best_answer_id === answer.id && (
                      <Tag size="sm" colorScheme="green" bg="green.600" color="white" mb={{ base: 1, md: 0 }}>
                        <TagLabel whiteSpace="nowrap">{bestAnswerText}</TagLabel>
                      </Tag>
                    )}
                  </HStack>
                  <HStack spacing={4} flexWrap="wrap">
                    {isAdmin && (
                      <IconButton
                        aria-label="回答を削除"
                        icon={<FiTrash2 />}
                        variant="ghost"
                        color="gray.300"
                        _hover={{ color: "red.500" }}
                        onClick={() => handleDeleteAnswer(answer.id)}
                        mb={{ base: 1, md: 0 }}
                      />
                    )}
                    <HStack spacing={1} mb={{ base: 1, md: 0 }}>
                      <IconButton
                        aria-label="いいね"
                        icon={answer.is_liked ? <AiFillHeart /> : <FiHeart />}
                        variant="ghost"
                        color={answer.is_liked ? "red.300" : "white"}
                        _hover={{ color: answer.is_liked ? "red.200" : "gray.300" }}
                        onClick={() => handleLike(answer.id)}
                      />
                      <Text fontSize="sm">{answer.likes_count}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.300" mb={{ base: 1, md: 0 }}>
                    {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true, locale: ja })}
                  </Text>
                  </HStack>
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
          {isLoggedIn ? (
          <Button as={Link} href={`/maclath/questions/${params.id}/answer`} colorScheme="teal" size="lg" mt={4}>
            質問に回答する
          </Button>
          ) : (
            <Button as={Link} href="/auth" colorScheme="teal" size="lg" mt={4} variant="outline">
              ログインして質問に回答する
            </Button>
          )}
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
              ベストアンサーを設定
            </AlertDialogHeader>

            <AlertDialogBody>
              この回答をベストアンサーに設定し、質問を解決済みにしますか？
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onBestAnswerAlertClose}>
                キャンセル
              </Button>
              <Button colorScheme="green" onClick={confirmSelectBestAnswer} ml={3}>
                設定
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

      <AlertDialog
        isOpen={isAnswerDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAnswerDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              回答の削除
            </AlertDialogHeader>

            <AlertDialogBody>
              本当にこの回答を削除しますか？この操作は元に戻せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAnswerDeleteAlertClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteAnswer} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 