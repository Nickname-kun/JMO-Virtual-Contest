"use client"
import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { BlockMath } from 'react-katex'
import Link from 'next/link'
import {
  Box,
  FormControl,
  FormLabel,
  Button,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Input,
  Divider,
  HStack,
  Badge,
  List,
  ListItem,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react'
import { evaluate, factorial } from 'mathjs'

interface Submission {
  id: string
  answer: string
  created_at: string
  is_correct: boolean
}

interface ProblemDataForSubmission {
  correct_answers?: string[];
}

export default function SubmissionSection({ problemId, correctAnswers }: { problemId: string, correctAnswers: string[] | null }) {
  const [answer, setAnswer] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const user = useUser()
  const supabase = createClientComponentClient()
  const mathfieldRef = useRef<any>(null)
  const [showAll, setShowAll] = useState(false)

  // mathliveのWeb Componentを初期化
  useEffect(() => {
    import('mathlive').then(({ MathfieldElement }) => {
      if (mathfieldRef.current && !(mathfieldRef.current as any).$initialized) {
        (mathfieldRef.current as any).addEventListener('input', (evt: any) => {
          setAnswer(evt.target.value)
        })
        ;(mathfieldRef.current as any).$initialized = true
      }
    })
  }, [])

  // 提出履歴の取得
  useEffect(() => {
    if (!user) return
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })
      if (!error && data) setSubmissions(data)
    }
    fetchSubmissions()
  }, [user, problemId])

  // 提出処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (!user) {
      setError('ログインしてください')
      setLoading(false)
      return
    }
    // 採点ロジック (複数の正解候補と比較)
    let isCorrect = false;
    if (correctAnswers && Array.isArray(correctAnswers)) {
      try {
        // LaTeXの分数形式を正規化する関数
        const normalizeLatexFraction = (latex: string): string => {
          // バックスラッシュを2個に正規化
          const cleanedLatex = latex.replace(/\\+/g, '\\\\');
          // \frac{分子}{分母} または \frac分子分母 の形式を (分子)/(分母) に変換
          // \sqrt{数} または \sqrt数 の形式を sqrt(数) に変換
          // 三角関数を正規化
          // 掛け算記号 \times を * に変換
          return cleanedLatex
            .replace(/\\\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
            .replace(/\\\\frac([0-9]+)([0-9]+)/g, '($1)/($2)')
            .replace(/\\\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
            .replace(/\\\\sqrt([0-9]+)/g, 'sqrt($1)')
            .replace(/\\\\sin\{([^}]+)\}/g, 'sin($1)')
            .replace(/\\\\cos\{([^}]+)\}/g, 'cos($1)')
            .replace(/\\\\tan\{([^}]+)\}/g, 'tan($1)')
            .replace(/\\\\pi/g, 'pi')
            .replace(/\\\\times/g, '*');
        };

        // ユーザーの入力値を正規化して評価
        const userExpression = normalizeLatexFraction(answer);
        const userValue = evaluate(userExpression, { scope: { factorial } });

        isCorrect = correctAnswers.some(correctAnswer => {
          try {
            // 管理者設定の正解も正規化して評価
            const correctExpression = normalizeLatexFraction(correctAnswer);
            const correctValue = evaluate(correctExpression, { scope: { factorial } });
            // 数値的な比較
            // 小数点誤差を考慮して比較
            const tolerance = 1e-9; // 許容誤差
            return Math.abs(userValue - correctValue) < tolerance;
          } catch {
            return false;
          }
        });
      } catch {
        isCorrect = false;
      }
    } else {
      // correctAnswersが設定されていない場合は不正解とする
      isCorrect = false;
      console.warn(`Problem ${problemId} does not have correctAnswers defined.`);
    }

    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      problem_id: problemId,
      answer,
      is_correct: isCorrect,
    })
    if (error) {
      setError('提出に失敗しました')
    } else {
      setAnswer('')
      // 再取得
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false })
      if (data) setSubmissions(data)
    }
    setLoading(false)
  }

  // LaTeXコマンド挿入
  const insertLatex = (cmd: string) => {
    if (mathfieldRef.current) {
      (mathfieldRef.current as any).executeCommand('insert', cmd)
    }
  }

  const waBg = useColorModeValue('#ffb3b3', 'red.400')
  const caBg = useColorModeValue('#b9fbc0', 'green.300')

  return (
    <Box mt={6}>
      {user ? (
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>解答</FormLabel>
              <Text fontSize="xs" color="gray.500" mb={1}>
                右下のキーボードアイコンから分数や平方根などの数式記号を入力できます
              </Text>
              <Box
                border="1px solid"
                borderColor="gray.300"
                borderRadius={6}
                bg="gray.50"
                p={2}
                mb={2}
              >
                <math-field
                  ref={mathfieldRef}
                  style={{
                    width: '100%',
                    minHeight: 40,
                    fontSize: 18,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: 4,
                  }}
                  aria-placeholder="ここに数式を入力"
                >{answer}</math-field>
              </Box>
              <Box mt={2} p={3} border="1px solid" borderColor="gray.200" borderRadius={6} bg="gray.100">
                <Text fontSize="xs" color="gray.500" mb={1}>プレビュー</Text>
                <BlockMath math={answer} />
              </Box>
            </FormControl>
            {error && (
              <Alert status="error" fontSize="sm">
                <AlertIcon />
                {error}
              </Alert>
            )}
            <Flex justify="flex-end">
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="提出中..."
                px={8}
                size="md"
              >
                提出する
              </Button>
            </Flex>
          </VStack>
        </form>
      ) : (
        <Box p={6} borderWidth={1} borderRadius={8} bg="gray.50">
          <VStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold">解答を提出するにはログインが必要です</Text>
            <Text color="gray.600">ログインすると、解答の提出や提出履歴の確認ができます。</Text>
            <Button as={Link} href="/auth" colorScheme="blue" size="md">
              ログインする
            </Button>
          </VStack>
        </Box>
      )}
      <Divider my={6} />
      <Box>
        <Text fontWeight="bold" mb={2}>提出履歴</Text>
        {!user ? (
          <Text color="gray.500" fontSize="sm">ログインすると提出履歴を確認できます。</Text>
        ) : submissions.length === 0 ? (
          <Text color="gray.500" fontSize="sm">まだ提出はありません。</Text>
        ) : (
          <List spacing={2}>
            {(showAll ? submissions : submissions.slice(0, 5)).map((s) => (
              <ListItem key={s.id}>
                <Flex align="center" gap={3} p={2} borderWidth={1} borderRadius={6} bg="gray.50">
                  <Text fontFamily="mono" fontSize="md">{s.answer}</Text>
                  <Text color="gray.400" fontSize="sm">{new Date(s.created_at).toLocaleString()}</Text>
                  <Badge
                    px={3}
                    py={1}
                    borderRadius={6}
                    fontWeight="bold"
                    fontSize="md"
                    colorScheme={s.is_correct ? 'green' : 'red'}
                    bg={s.is_correct ? caBg : waBg}
                    color="#222"
                  >
                    {s.is_correct ? 'CA' : 'WA'}
                  </Badge>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
        {user && submissions.length > 5 && (
          <Button
            mt={2}
            size="xs"
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '最新の5件を表示' : 'すべて表示'}
          </Button>
        )}
      </Box>
    </Box>
  )
} 