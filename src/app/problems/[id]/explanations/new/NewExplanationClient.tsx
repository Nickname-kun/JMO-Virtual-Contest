"use client"

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  useToast,
  HStack,
  Input,
} from '@chakra-ui/react'
import Link from 'next/link'
import { renderLatex } from '@/utils/renderLatex'

interface Problem {
  id: string
  title: string
}

export default function NewExplanationClient({ problem }: { problem: Problem }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const toast = useToast()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('タイトルを入力してください。')
      return
    }
    if (!content.trim()) {
      setError('解説を入力してください。')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('Error getting user:', userError)
        setError('ユーザー情報の取得に失敗しました。再度ログインしてください。')
        setLoading(false)
        return
    }

    const { error: submitError } = await supabase
      .from('explanations')
      .insert([
        {
          problem_id: problem.id,
          content: content.trim(),
          user_id: user.id,
          title: title.trim(),
        },
      ])

    if (submitError) {
      console.error('Error submitting explanation:', submitError)
      setError('解説の投稿に失敗しました。')
      toast({
        title: 'エラー',
        description: '解説の投稿に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } else {
      toast({
        title: '成功',
        description: '解説を投稿しました。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      router.push(`/problems/${problem.id}/explanations`)
    }
    setLoading(false)
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            {problem.title}
          </Heading>
          <Text color="gray.500" fontSize="sm">
            解説を投稿
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>タイトル</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="解説のタイトルを入力してください"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>解説</FormLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="解説を入力してください。LaTeXの数式は $...$ で囲んでください。"
                minH="200px"
              />
              <FormHelperText>
                LaTeXの数式は $...$ で、Markdownも使用できます。
              </FormHelperText>
            </FormControl>

            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Heading as="h2" size="md" mb={2}>プレビュー</Heading>
              <Box>
                {renderLatex(content)}
              </Box>
            </Box>

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <HStack spacing={4}>
              <Button
                as={Link}
                href={`/problems/${problem.id}/explanations`}
                colorScheme="gray"
                variant="outline"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="投稿中..."
              >
                投稿する
              </Button>
            </HStack>
          </VStack>
        </form>

      </VStack>
    </Container>
  )
} 