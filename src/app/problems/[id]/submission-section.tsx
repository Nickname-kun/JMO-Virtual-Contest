"use client"
import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@supabase/auth-helpers-react'
import { BlockMath, InlineMath } from 'react-katex'
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
import { create, all } from 'mathjs'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}

interface Submission {
  id: string
  answer: string
  created_at: string
  is_correct: boolean
}

interface ProblemDataForSubmission {
  correct_answers?: string[];
  requires_multiple_answers: boolean;
}

const math = create(all, { number: 'BigNumber' })
const evaluate = math.evaluate
const factorial = math.factorial

export default function SubmissionSection({ problemId, correctAnswers, requires_multiple_answers }: { problemId: string, correctAnswers: string[] | null, requires_multiple_answers: boolean }) {
  const [answers, setAnswers] = useState<string[]>([''])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const user = useUser()
  const supabase = createClientComponentClient()
  const mathfieldRefs = useRef<any[]>([])
  const [showAll, setShowAll] = useState(false)

  // 解答の変更をハンドリング
  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers]
      newAnswers[index] = value
      return newAnswers
    })
  }

  // 解答フィールドを追加
  const handleAddAnswer = () => {
    if (!requires_multiple_answers) return;
    setAnswers(prevAnswers => [...prevAnswers, ''])
  }

  // 解答フィールドを削除
  const handleRemoveAnswer = (index: number) => {
    setAnswers(prevAnswers => prevAnswers.filter((_, i) => i !== index))
  }

  // mathliveのWeb Componentを初期化
  useEffect(() => {
    import('mathlive').then(({ MathfieldElement }) => {
      answers.forEach((_, index) => {
        const mathfield = mathfieldRefs.current[index]
        if (mathfield && !(mathfield as any).$initialized) {
          const handler = (evt: any) => {
            handleAnswerChange(index, evt.target.value)
          }
          (mathfield as any).addEventListener('input', handler)

          // クリーンアップ関数でイベントリスナーを削除
          return () => {
            (mathfield as any).removeEventListener('input', handler)
          }
        }
      })
    })
  }, [answers, handleAnswerChange])

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
    // @ts-ignore
    if (correctAnswers && Array.isArray(correctAnswers)) {
      try {
        // LaTeXの分数形式を正規化する関数
        const normalizeLatexFraction = (latex: string): string => {
          // MathLiveの出力に含まれる可能性のある不要な文字を除去
          // 例: UnicodeのU+2060 (Word Joiner) や警告で示された文字など
          let cleanedLatex = latex.trim();
          cleanedLatex = cleanedLatex.replace(/[⁠⁡⁢⁣⁤ ​﻿⎱-⎳□]/g, ''); // 不要な制御文字や'□'を除去
          
          // コンビネーションの正規化
          // \\binom{n}{k} または \\binom nk の形式を combinations(n,k) に変換
          // _nC_k, _nCk 系の形式を combinations(n,k) に変換 (MathLive出力対応含む)
          cleanedLatex = cleanedLatex
            .replace(/\\binom\{([^}]+)\}\{([^}]+)\}/g, "combinations($1,$2)") // \\binom{n}{k} -> combinations(n,k)
            .replace(/\\binom([0-9]+)([0-9]+)/g, "combinations($1,$2)") // \\binom nk -> combinations(n,k)
            // _nC_k variations including with or without braces and with C or \\mathrm{C}
            .replace(/_([0-9]+|\{([0-9]+)\})\s*(C|\\mathrm\{C\})\s*_?([0-9]+|\{([0-9]+)\})/g, (match, nGroup, nBraced, cPart, kGroup, kBraced) => {
              const n = nBraced || nGroup;
              const k = kBraced || kGroup;
              return `combinations(${n},${k})`;
            });

          // 指数形式の正規化 (base^{exponent} -> pow(base, exponent))
          // キャレットの直前の要素 (変数、数字、), ], } など) を底としてマッチ
          cleanedLatex = cleanedLatex.replace(/([a-zA-Z0-9\)\]\}])\^\{([^}]+)\}/g, 'pow($1,$2)');

          cleanedLatex = cleanedLatex
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
            .replace(/\\frac([0-9]+)([0-9]+)/g, '($1)/($2)')
            .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
            .replace(/\\sqrt([0-9]+)/g, 'sqrt($1)')
            .replace(/\\sin\{([^}]+)\}/g, 'sin($1)')
            .replace(/\\cos\{([^}]+)\}/g, 'cos($1)')
            .replace(/\\tan\{([^}]+)\}/g, 'tan($1)')
            .replace(/\\pi/g, 'pi')
            .replace(/\\times/g, '*')
            .replace(/\\cdot/g, '*');

          return cleanedLatex;
        };

        // ユーザーの複数の入力値を正規化して評価
        const userValues = answers.map(ans => {
          try {
            const userExpression = normalizeLatexFraction(ans);
            // evaluateは数値または複素数を返すことが期待されるが、念のためanyで受ける
            const evaluatedValue: any = evaluate(userExpression, { scope: { factorial } });
            // 評価結果が有限な数値であることを確認
            if (typeof evaluatedValue === 'number' && isFinite(evaluatedValue)) {
              return evaluatedValue;
            } else if (typeof evaluatedValue === 'object' && evaluatedValue !== null && typeof evaluatedValue.re === 'number' && isFinite(evaluatedValue.re) && evaluatedValue.im === 0) {
               // 虚数部が0の複素数も数値として扱う
               return evaluatedValue.re;
            } else {
              // 数値として評価できない場合はNaNとして扱う
              return NaN;
            }
          } catch {
            // 評価中のエラーもNaNとして扱う
            return NaN;
          }
        });

        // 正解候補を正規化して評価
        const correctValues = correctAnswers.map(ans => {
          try {
            const correctExpression = normalizeLatexFraction(ans);
            const evaluatedValue: any = evaluate(correctExpression, { scope: { factorial } });
             if (typeof evaluatedValue === 'number' && isFinite(evaluatedValue)) {
              return evaluatedValue;
            } else if (typeof evaluatedValue === 'object' && evaluatedValue !== null && typeof evaluatedValue.re === 'number' && isFinite(evaluatedValue.re) && evaluatedValue.im === 0) {
               // 虚数部が0の複素数も数値として扱う
               return evaluatedValue.re;
            } else {
              // 数値として評価できない場合はNaNとして扱う
              return NaN;
            }
          } catch {
            return NaN;
          }
        });

        const tolerance = 1e-9; // 許容誤差

        // 数値的な比較、または文字列としての完全一致
        const isMatch = (userVal: any, correctVal: any): boolean => {
           // mathjsのBigNumberであるかを確認
           const isUserBigNumber = math.isBigNumber(userVal);
           const isCorrectBigNumber = math.isBigNumber(correctVal);

           if (isUserBigNumber && isCorrectBigNumber) {
             // 両方BigNumberの場合はequals()で厳密比較
             return userVal.equals(correctVal);
           } else if (typeof userVal === 'number' && typeof correctVal === 'number') {
             // 両方標準の数値の場合は許容誤差を考慮して比較
             const tolerance = 1e-9; // 許容誤差
             return Math.abs(userVal - correctVal) < tolerance;
           } else {
             // それ以外（文字列や異なる型）の場合は文字列として比較
             return String(userVal).trim() === String(correctVal).trim();
           }
        };

        // === 新しい採点ロジック ===
        // ユーザーが提出した回答が全て有効な数値/文字列であり、かつ
        // 必須複数回答の場合は回答数が正解数と一致する必要がある
        // @ts-ignore
        if (userValues.some(isNaN) || correctValues.some(isNaN) || (!requires_multiple_answers && userValues.length !== 1) || (requires_multiple_answers && userValues.length !== correctValues.length)) {
             isCorrect = false;
        } else {
            // ソートして比較（セットとしての一致を確認）
            // 数値と文字列が混在する可能性を考慮し、文字列に変換してソート
            const sortedUserValues = userValues.map(v => String(v)).sort();
            const sortedCorrectValues = correctValues.map(v => String(v)).sort();

            if (sortedUserValues.length !== sortedCorrectValues.length) {
                isCorrect = false; // 回答数は上記でチェック済みだが念のため
            } else {
                // 各要素が一致するか確認
                isCorrect = sortedUserValues.every((userValStr, index) => {
                    const correctValStr = sortedCorrectValues[index];
                    // 文字列として比較するか、数値として評価して比較するかを判断
                    const userNum = parseFloat(userValStr);
                    const correctNum = parseFloat(correctValStr);

                    if (!isNaN(userNum) && !isNaN(correctNum)) {
                         // 両方数値に変換可能なら数値として比較
                        return Math.abs(userNum - correctNum) < tolerance;
                    } else {
                         // それ以外は文字列として比較
                        return userValStr === correctValStr;
                    }
                });
            }
        }

        // === 既存の採点ロジック（コメントアウトまたは削除） ===
        // isCorrect = userValues.length > 0 && !userValues.some(isNaN) && userValues.every(userValue =>
        //   correctAnswers.some(correctAnswer => {
        //     try {
        //       const correctExpression = normalizeLatexFraction(correctAnswer);
        //       const correctValue: any = evaluate(correctExpression, { scope: { factorial } });
        //       const tolerance = 1e-9; // 許容誤差

        //       // 数値的な比較、または文字列としての完全一致
        //       const isMatch = (userVal: any, correctVal: any): boolean => {
        //          if (typeof userVal === 'number' && typeof correctVal === 'number') {
        //            return Math.abs(userVal - correctVal) < tolerance;
        //          } else {
        //            // 数値でない場合は文字列として比較
        //            return String(userVal).trim() === String(correctVal).trim();
        //          }
        //       };

        //       return isMatch(userValue, correctValue);

        //     } catch {
        //       // 正解候補の評価エラー
        //       return false;
        //     }
        //   })
        // );

      } catch (evalError) {
        isCorrect = false;
        console.error('Evaluation Error:', evalError); // 評価エラーログ
      }
    } else {
      // correctAnswersが設定されていない場合は不正解とする
      isCorrect = false;
      console.warn(`Problem ${problemId} does not have correctAnswers defined.`);
    }

    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      problem_id: problemId,
      answer: answers.join(' || '),
      is_correct: isCorrect,
    })
    if (error) {
      setError('提出に失敗しました')
    } else {
      setAnswers([''])
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
    // アクティブな（フォーカスされている）math-fieldに挿入
    const activeMathfield = mathfieldRefs.current.find(mf => mf === document.activeElement);
    if (activeMathfield) {
      (activeMathfield as any).executeCommand('insert', cmd);
    } else if (mathfieldRefs.current[0]) {
      // フォーカスされていなければ最初のフィールドに挿入
      (mathfieldRefs.current[0] as any).executeCommand('insert', cmd);
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
                {requires_multiple_answers && "（この問題は複数の解答が必要です）"}
              </Text>
              {/* 数式入力支援ボタン */}
              <HStack spacing={2} mb={2} wrap="wrap">
                <Button size="sm" onClick={() => insertLatex('\\frac{#0}{#?}')}>分数 <InlineMath math="\\frac{□}{□}" /></Button>
                <Button size="sm" onClick={() => insertLatex('\\sqrt{#0}')}>平方根 <InlineMath math="\\sqrt{□}" /></Button>
                <Button size="sm" onClick={() => insertLatex('^{#?}')}>指数 <InlineMath math="x^□" /></Button>
                <Button size="sm" onClick={() => insertLatex('\\binom{#0}{#?}')}>コンビネーション(binom) <InlineMath math="\\binom{□}{□}" /></Button>
                <Button size="sm" onClick={() => insertLatex('_{#0}\\mathrm{C}_{#?}')}>コンビネーション(_nC_k) <InlineMath math="□C□" /></Button>
                <Button size="sm" onClick={() => insertLatex('!')}>階乗 (!)</Button>
              </HStack>
              <VStack spacing={2} align="stretch">
                {answers.map((ans, index) => (
                  <Flex key={index} gap={2} align="center">
                    <Box
                      flex="1"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius={6}
                      bg="gray.50"
                      p={2}
                    >
                      {/* @ts-ignore */}
                      <math-field
                        ref={(el: any) => { mathfieldRefs.current[index] = el; }}
                        value={ans}
                        onInput={(evt: any) => handleAnswerChange(index, evt.target.value)}
                        math-virtual-keyboard-policy="manual"
                        style={{
                          width: '100%',
                          minHeight: 40,
                          fontSize: 18,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          padding: 4,
                        }}
                        aria-placeholder={`解答 ${index + 1}`}
                      >{ans}</math-field>
                    </Box>
                    {requires_multiple_answers && answers.length > 1 && (
                      <Button size="sm" onClick={() => handleRemoveAnswer(index)}>
                        削除
                      </Button>
                    )}
                  </Flex>
                ))}
                {requires_multiple_answers && (
                  <Button size="sm" onClick={handleAddAnswer} alignSelf="flex-start">
                    + 解答を追加
                  </Button>
                )}
              </VStack>
              {answers.map((ans, index) => (
                <Box key={`preview-${index}`} mt={2} p={3} border="1px solid" borderColor="gray.200" borderRadius={6} bg="gray.100">
                  <Text fontSize="xs" color="gray.500" mb={1}>解答 {index + 1} プレビュー</Text>
                  <BlockMath math={ans} />
                </Box>
              ))}
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