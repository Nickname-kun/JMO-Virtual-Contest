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
} from '@chakra-ui/react'
import Link from 'next/link'
import { renderLatex } from '@/utils/renderLatex'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

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

  const handleDeleteExplanation = async () => {
    if (!explanationToDeleteId) return

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
                  <AccordionItem key={explanation.id}>
                    <h2>
                      <AccordionButton>
                        <Box as="span" flex='1' textAlign='left'>
                          <HStack spacing={2}>
                            <Text fontWeight="bold">{explanation.title}</Text>
                            <Text fontSize="sm" color="gray.600">by {explanation.profiles?.username || '匿名ユーザー'}</Text>
                            {explanation.is_official && (
                              <Badge colorScheme="blue" size="sm">公式解説</Badge>
                            )}
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      {editingExplanationId === explanation.id ? (
                        <VStack align="stretch" spacing={2}>
                          <Textarea
                            value={editedExplanationContent}
                            onChange={(e) => setEditedExplanationContent(e.target.value)}
                            size="sm"
                            rows={6}
                          />
                          <HStack justify="flex-end">
                            <Button size="xs" onClick={() => setEditingExplanationId(null)} variant="outline">キャンセル</Button>
                            <Button size="xs" colorScheme="blue" onClick={async () => {
                              if (editedExplanationContent.trim() === '') return;
                              const { error: updateError } = await supabase
                                .from('explanations')
                                .update({ content: editedExplanationContent.trim() })
                                .eq('id', explanation.id)

                              if (updateError) {
                                console.error('Error updating explanation:', updateError)
                                toast({
                                  title: 'エラー',
                                  description: '解説の更新に失敗しました。',
                                  status: 'error',
                                  duration: 5000,
                                  isClosable: true,
                                })
                              } else {
                                setEditingExplanationId(null)
                                const { data, error } = await supabase
                                  .from('explanations')
                                  .select('*, profiles(username)')
                                  .eq('problem_id', problem.id)
                                  .order('created_at', { ascending: true })

                                if (error) {
                                  console.error('Error fetching explanations after update:', error)
                                } else {
                                  setExplanations(data || [])
                                }
                              }
                            }}>
                              保存
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box>{renderLatex(explanation.content)}</Box>
                      )}

                      <Flex justify="flex-end" mt={2}>
                        {user && user.id === explanation.user_id && editingExplanationId !== explanation.id && (
                          <HStack spacing={2}>
                            <Button size="xs" onClick={() => {
                              setEditingExplanationId(explanation.id)
                              setEditedExplanationContent(explanation.content)
                            }} variant="outline">編集</Button>
                            <Button size="xs" colorScheme="red" onClick={() => {
                              setExplanationToDeleteId(explanation.id)
                              setDeleteDialogOpen(true)
                            }}>削除</Button>
                          </HStack>
                        )}

                        {isAdmin && editingExplanationId !== explanation.id && (
                          <Button
                            size="xs"
                            ml={user && user.id === explanation.user_id ? 2 : 0}
                            colorScheme={explanation.is_official ? "gray" : "blue"}
                            onClick={() =>
                              handleToggleOfficial(explanation.id, explanation.is_official)
                            }
                          >
                            {explanation.is_official
                              ? "公式解説を解除"
                              : "公式解説として設定"}
                          </Button>
                        )}
                      </Flex>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </VStack>
        )}
      </VStack>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">解説の削除</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              この解説を完全に削除してもよろしいですか？ この操作は元に戻せません。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteDialogOpen(false)} disabled={deletingExplanation}>キャンセル</Button>
              <Button colorScheme="red" onClick={handleDeleteExplanation} ml={3} isLoading={deletingExplanation}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
} 