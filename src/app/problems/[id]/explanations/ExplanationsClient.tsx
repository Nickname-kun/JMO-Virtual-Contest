"use client"

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  Badge,
  Flex,
  Alert,
  AlertIcon,
  useToast,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Link as ChakraLink,
} from '@chakra-ui/react'
import Link from 'next/link'
import { renderLatex } from '@/utils/renderLatex'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { FiTrash2 } from 'react-icons/fi'

interface Problem {
  id: string
  title: string
  content: string
}

interface Explanation {
  id: string
  problem_id: string
  user_id: string
  title: string
  content: string
  is_official: boolean
  created_at: string
  updated_at: string
  profiles?: {
    username: string | null
  }
}

export default function ExplanationsClient({ problem }: { problem: Problem }) {
  const supabase = createClientComponentClient()
  const user = useUser()
  const router = useRouter()
  const toast = useToast()
  const [explanations, setExplanations] = useState<Explanation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingExplanationId, setEditingExplanationId] = useState<string | null>(null)
  const [editedExplanationContent, setEditedExplanationContent] = useState('')
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [explanationToDeleteId, setExplanationToDeleteId] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [deletingExplanation, setDeletingExplanation] = useState(false)
  const [explanationAuthors, setExplanationAuthors] = useState<{ [key: string]: { username: string; is_admin: boolean; is_public?: boolean } }>({});

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      }
    }
    checkAdminStatus()
  }, [user, supabase])

  useEffect(() => {
    const fetchExplanations = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('explanations')
        .select('*, profiles(username)')
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching explanations:', error)
        setError('解説の読み込みに失敗しました。')
      } else {
        setExplanations(data || [])
      }
      setLoading(false)
    }

    fetchExplanations()
  }, [problem.id, supabase])

  useEffect(() => {
    const fetchExplanationAuthors = async () => {
      const authorIds = explanations.map(explanation => explanation.user_id);
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, is_admin, is_public')
          .in('id', authorIds);
        
        if (profiles) {
          const authorsMap = profiles.reduce((acc, profile) => ({
            ...acc,
            [profile.id]: { username: profile.username, is_admin: profile.is_admin, is_public: profile.is_public }
          }), {});
          setExplanationAuthors(authorsMap);
        }
      }
    };

    fetchExplanationAuthors();
  }, [explanations, supabase]);

  const handleToggleOfficial = async (explanationId: string, currentStatus: boolean) => {
    if (!isAdmin) return

    const { error } = await supabase
      .from('explanations')
      .update({ is_official: !currentStatus })
      .eq('id', explanationId)

    if (error) {
      console.error('Error toggling official status:', error)
      toast({
        title: 'エラー',
        description: '解説のステータス更新に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } else {
      setExplanations(prev =>
        prev.map(exp =>
          exp.id === explanationId
            ? { ...exp, is_official: !currentStatus }
            : exp
        )
      )
    }
  }

  const handleUpdateExplanation = async (explanationId: string, newContent: string) => {
    if (!user || newContent.trim() === '') return;

    const { error } = await supabase
      .from('explanations')
      .update({ content: newContent.trim() })
      .eq('id', explanationId)
      .eq('user_id', user.id); // 投稿者のみ更新可能

    if (error) {
      console.error('Error updating explanation:', error);
      toast({
        title: 'エラー',
        description: '解説の更新に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: '成功',
        description: '解説を更新しました。',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEditingExplanationId(null);
      // 更新後、解説一覧を再取得して表示を更新
      const { data, error: fetchError } = await supabase
        .from('explanations')
        .select('*, profiles(username)')
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching explanations after update:', fetchError);
      } else {
        setExplanations(data || []);
      }
    }
  };

  const handleDeleteExplanation = async () => {
    if (!explanationToDeleteId) return

    const explanation = explanations.find(exp => exp.id === explanationToDeleteId);
    if (!explanation) return;

    if (!isAdmin && user?.id !== explanation.user_id) {
      toast({
        title: '権限がありません',
        description: 'この解説を削除する権限がありません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setDeletingExplanation(false);
      setExplanationToDeleteId(null);
      setDeleteDialogOpen(false);
      return;
    }

    setDeletingExplanation(true)
    setDeleteDialogOpen(false)

    const { error } = await supabase
      .from('explanations')
      .delete()
      .eq('id', explanationToDeleteId)

    setDeletingExplanation(false)
    setExplanationToDeleteId(null)

    if (error) {
      console.error('Error deleting explanation:', error)
      toast({
        title: 'エラー',
        description: '解説の削除に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } else {
      toast({
        title: '成功',
        description: '解説を削除しました。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      // 削除後、解説一覧を再取得して表示を更新
      const { data, error: fetchError } = await supabase
        .from('explanations')
        .select('*, profiles(username)')
        .eq('problem_id', problem.id)
        .order('created_at', { ascending: true })

      if (fetchError) {
        console.error('Error fetching explanations after deletion:', fetchError)
      } else {
        setExplanations(data || [])
      }
    }
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            {problem.title}
          </Heading>
          <Text color="gray.500" fontSize="sm">
            解説一覧
          </Text>
        </Box>

        <HStack spacing={4}>
          <Button as={Link} href={`/problems/${problem.id}`} colorScheme="gray" variant="outline">
            問題に戻る
          </Button>
          {user && (
            <Button
              as={Link}
              href={`/problems/${problem.id}/explanations/new`}
              colorScheme="blue"
            >
              解説を投稿
            </Button>
          )}
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <Text>解説を読み込み中...</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {explanations.length === 0 ? (
              <Text color="gray.500" fontSize="sm">
                まだ解説はありません。
              </Text>
            ) : (
              <Accordion allowMultiple>
                {explanations.map((explanation) => (
                  <AccordionItem key={explanation.id} borderWidth="1px" borderRadius="lg" shadow="md" mb={4} p={4} bg="white">
                    <h2>
                      <AccordionButton _expanded={{ bg: 'gray.100' }} py={4}>
                        <Box flex="1" textAlign="left">
                          <HStack spacing={2} alignItems="center" flexWrap="wrap">
                            <Text fontWeight="semibold" fontSize="md" mb={{ base: 1, md: 0 }}>
                              {explanation.title}
                            </Text>
                            {explanation.is_official && (
                              <Badge colorScheme="green" mb={{ base: 1, md: 0 }}>公式解説</Badge>
                            )}
                            <Text fontSize="sm" color="gray.500" mb={{ base: 1, md: 0 }}>
                              by {explanationAuthors[explanation.user_id]?.is_public
                                ? (
                                  <ChakraLink
                                    as={Link}
                                    href={`/profile/${explanation.user_id}`}
                                    color={explanationAuthors[explanation.user_id]?.is_admin ? "rgb(102, 0, 153)" : undefined}
                                    _hover={{ textDecoration: 'underline' }}
                                    display="inline"
                                  >
                                    {explanationAuthors[explanation.user_id]?.username || '不明'}
                                  </ChakraLink>
                                )
                                : (
                                  <Text as="span" color={explanationAuthors[explanation.user_id]?.is_admin ? "rgb(102, 0, 153)" : undefined}>
                                    {explanationAuthors[explanation.user_id]?.username || '不明'}
                                  </Text>
                                )}
                            </Text>
                            <Text fontSize="sm" color="gray.500" mb={{ base: 1, md: 0 }}>
                              {formatDistanceToNow(new Date(explanation.created_at), { addSuffix: true, locale: ja })}
                            </Text>
                            {(isAdmin || user?.id === explanation.user_id) && (
                              <IconButton
                                aria-label="解説を削除"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExplanationToDeleteId(explanation.id);
                                  setDeleteDialogOpen(true);
                                }}
                              />
                            )}
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Box p={4} borderRadius="md" bg="gray.50">
                        {renderLatex(explanation.content)}
                      </Box>
                      <HStack mt={4} justifyContent="flex-end">
                        {isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => handleToggleOfficial(explanation.id, explanation.is_official)}
                            colorScheme={explanation.is_official ? 'orange' : 'green'}
                          >
                            {explanation.is_official ? '公式解説解除' : '公式解説に設定'}
                          </Button>
                        )}
                        {user && explanation.user_id === user.id && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingExplanationId(explanation.id)
                              setEditedExplanationContent(explanation.content)
                            }}
                            colorScheme="blue"
                          >
                            編集
                          </Button>
                        )}
                      </HStack>
                      {editingExplanationId === explanation.id && (
                        <Box mt={4}>
                          <Textarea
                            value={editedExplanationContent}
                            onChange={(e) => setEditedExplanationContent(e.target.value)}
                            placeholder="解説を編集"
                            size="sm"
                            mb={2}
                          />
                          <HStack justifyContent="flex-end">
                            <Button size="sm" onClick={() => setEditingExplanationId(null)}>
                              キャンセル
                            </Button>
                            <Button size="sm" colorScheme="green" onClick={() => handleUpdateExplanation(explanation.id, editedExplanationContent)}>
                              更新
                            </Button>
                          </HStack>
                        </Box>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </VStack>
        )}
      </VStack>

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              解説の削除
            </AlertDialogHeader>
            <AlertDialogBody>
              本当にこの解説を削除しますか？この操作は元に戻せません。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteDialogOpen(false)}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDeleteExplanation} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
} 