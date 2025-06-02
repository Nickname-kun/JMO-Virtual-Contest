"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { Container, Heading, Text, Box, VStack, Button, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Tooltip, Flex, FormControl, FormLabel, Alert, AlertIcon,
  TableContainer, Table, Thead, Tbody, Tr, Th, Td, HStack
} from '@chakra-ui/react';
import { BlockMath, InlineMath } from 'react-katex';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { evaluate, factorial } from 'mathjs';
import { renderLatex } from '@/utils/renderLatex';

interface Problem {
  id: string;
  title: string;
  content: string;
  difficulty: number;
  answer: string;
  diagram_svg?: string;
  correct_answers?: string[];
  requires_multiple_answers: boolean;
}

interface Submission {
  id: string;
  answer: string;
  status: string;
  score: number;
  created_at: string;
}

function isCorrectAnswer(userInput: string, correctAnswer: string): boolean {
  try {
    // 数式として評価し、数値的に比較
    return evaluate(userInput) === evaluate(correctAnswer);
  } catch {
    // 評価できない場合は不正解
    return false;
  }
}

function ProblemClientContent({ problem, params, userId, virtualContest }: { problem: Problem, params: { id: string; virtual_id: string; problem_id: string }, userId: string, virtualContest: { start_time: string; end_time: string; status: string; score: number } }) {
  const toast = useToast();
  const [answers, setAnswers] = useState<string[]>(problem.requires_multiple_answers ? [''] : ['']); // 複数回答対応
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const supabase = createClientComponentClient();
  const mathfieldRefs = useRef<any[]>([]); // MathLiveのrefを複数持つ
  const [isDialogOpen, setDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [isQuitDialogOpen, setQuitDialogOpen] = useState(false);
  const [isFinishDialogOpen, setFinishDialogOpen] = useState(false);
  const quitCancelRef = useRef<HTMLButtonElement>(null);
  const finishCancelRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

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
  };

  // 解答の変更をハンドリング
  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[index] = value;
      return newAnswers;
    });
  };

  // 解答フィールドを追加
  const handleAddAnswer = () => {
    if (!problem.requires_multiple_answers) return; // 複数回答が必要な問題のみ追加可能
    setAnswers(prevAnswers => [...prevAnswers, '']);
  };

  // 解答フィールドを削除
  const handleRemoveAnswer = (index: number) => {
    if (answers.length <= (problem.requires_multiple_answers ? 1 : 1)) return; // 必須複数回答の場合は最低1つ、それ以外も最低1つ
    setAnswers(prevAnswers => prevAnswers.filter((_, i) => i !== index));
  };

  // mathliveのWeb Componentを初期化
  useEffect(() => {
    import('mathlive').then(({ MathfieldElement }) => {
      answers.forEach((_, index) => {
        const mathfield = mathfieldRefs.current[index];
        if (mathfield && !(mathfield as any).$initialized) {
          (mathfield as any).addEventListener('input', (evt: any) => {
            handleAnswerChange(index, evt.target.value);
          });

          // 仮想キーボードの設定
          // デフォルトのキーボード設定を取得し、不要なキーを削除
          const customKeyboards = JSON.parse(JSON.stringify((MathfieldElement as any).keyboards)); // ディープコピー

          // 'symbols' キーボードから e, i, 積分のキーを削除 (キーのIDを確認する必要があるかもしれません)
          const keysToRemove = ['e', 'i', '\\int_{0}^{\\infty}', '\\int']; // 削除したいキーのコマンドまたはID

          // 'symbols' キーボードのレイアウトからキーをフィルタリング
          if (customKeyboards && customKeyboards.symbols && customKeyboards.symbols.layers) {
            Object.keys(customKeyboards.symbols.layers).forEach(layerKey => {
              customKeyboards.symbols.layers[layerKey] = customKeyboards.symbols.layers[layerKey].filter((key: any) => {
                // キーが文字列の場合はコマンドとして扱う
                if (typeof key === 'string') {
                  return !keysToRemove.includes(key);
                }
                // キーがオブジェクトの場合は id または command を確認
                if (typeof key === 'object' && key !== null) {
                  return !keysToRemove.includes(key.id) && !keysToRemove.includes(key.command);
                }
                return true;
              });
            });
          }

          (mathfield as any).keyboards = customKeyboards; // カスタムキーボード設定を適用

          (mathfield as any).$initialized = true;
        }
      });
    });
  }, [answers.length]); // answersの数が変わったら再実行

  // タイマーの更新
  useEffect(() => {
    if (!virtualContest) return;
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(virtualContest.end_time);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('終了');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [virtualContest]);

  // 提出履歴の取得
  useEffect(() => {
    if (!userId) return;
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', params.problem_id)
        .eq('virtual_contest_id', params.virtual_id)
        .order('created_at', { ascending: false });
      if (!error && data) setSubmissions(data);
    };
    fetchSubmissions();
  }, [userId, params.problem_id, params.virtual_id]);

  const handleOpenDialog = () => {
    if (submissions.length > 0) {
      setError('この問題はすでに提出済みです');
      return;
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (submissions.length > 0) {
      setError('この問題はすでに提出済みです');
      setDialogOpen(false);
      return;
    }
    setLoading(true);
    setError(null);

    // 空の回答がないかチェック
    if (answers.some(ans => ans.trim() === '')) {
        setError('全ての解答欄を入力してください');
        setLoading(false);
        setDialogOpen(false);
        return;
    }

    let isCorrect = false;
    if (problem.correct_answers && Array.isArray(problem.correct_answers)) {
      try {
        // LaTeXの分数形式を正規化する関数 (submission-section.tsx と同様)
        const normalizeLatex = (latex: string): string => {
          // バックスラッシュを2個に正規化
          const cleanedLatex = latex.replace(/\\+/g, '\\\\');
          
          // コンビネーションの正規化
          // \binom{n}{k} または \binom nk の形式を C(n,k) に変換
          // _nC_k の形式も C(n,k) に変換
          const normalizedLatex = cleanedLatex
            .replace(/\\\\binom\{([^}]+)\}\{([^}]+)\}/g, 'combinations($1,$2)')
            .replace(/\\\\binom([0-9]+)([0-9]+)/g, 'combinations($1,$2)')
            .replace(/_([^C]+)C_([^}]+)/g, 'combinations($1,$2)')
            .replace(/_([^C]+)C([0-9]+)/g, 'combinations($1,$2)')
            .replace(/\\\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
            .replace(/\\\\frac([0-9]+)([0-9]+)/g, '($1)/($2)')
            .replace(/\\\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
            .replace(/\\\\sqrt([0-9]+)/g, 'sqrt($1)')
            .replace(/\\\\sin\{([^}]+)\}/g, 'sin($1)')
            .replace(/\\\\cos\{([^}]+)\}/g, 'cos($1)')
            .replace(/\\\\tan\{([^}]+)\}/g, 'tan($1)')
            .replace(/\\\\pi/g, 'pi')
            .replace(/\\\\times/g, '*')
            .replace(/\\\\cdot/g, '*');

          return normalizedLatex;
        };

        const tolerance = 1e-9; // 許容誤差

        // 数値的な比較、または文字列としての完全一致
        const isMatch = (userVal: any, correctVal: any): boolean => {
           if (typeof userVal === 'number' && typeof correctVal === 'number') {
             return Math.abs(userVal - correctVal) < tolerance;
           } else {
             // 数値でない場合は文字列として比較
             return String(userVal).trim() === String(correctVal).trim();
           }
        };

        if (problem.requires_multiple_answers) {
          // 複数回答が必要な問題の場合
          // ユーザーの入力値を正規化して評価
          const userValues = answers.map(ans => {
             try {
                const userExpression = normalizeLatex(ans);
                const evaluatedValue: any = evaluate(userExpression, { scope: { factorial } });
                 if (typeof evaluatedValue === 'number' && isFinite(evaluatedValue)) {
                  return evaluatedValue;
                } else if (typeof evaluatedValue === 'object' && evaluatedValue !== null && typeof evaluatedValue.re === 'number' && isFinite(evaluatedValue.re) && evaluatedValue.im === 0) {
                   return evaluatedValue.re;
                } else {
                  return NaN;
                }
              } catch {
                return NaN;
              }
          });

          // 正解候補を正規化して評価
          const correctValues = problem.correct_answers.map(ans => {
            try {
              const correctExpression = normalizeLatex(ans);
              const evaluatedValue: any = evaluate(correctExpression, { scope: { factorial } });
               if (typeof evaluatedValue === 'number' && isFinite(evaluatedValue)) {
                return evaluatedValue;
              } else if (typeof evaluatedValue === 'object' && evaluatedValue !== null && typeof evaluatedValue.re === 'number' && isFinite(evaluatedValue.re) && evaluatedValue.im === 0) {
                 return evaluatedValue.re;
               } else {
                 return NaN;
               }
            } catch {
              return NaN;
            }
          });

          // @ts-ignore // 一時的に型エラーを無視
          if (userValues.some(isNaN) || correctValues.some(isNaN) || userValues.length !== correctValues.length) {
               isCorrect = false;
          } else {
              const sortedUserValues = userValues.map(v => String(v)).sort();
              const sortedCorrectValues = correctValues.map(v => String(v)).sort();

              isCorrect = sortedUserValues.every((userValStr, index) => {
                  const correctValStr = sortedCorrectValues[index];
                  const userNum = parseFloat(userValStr);
                  const correctNum = parseFloat(correctValStr);

                  if (!isNaN(userNum) && !isNaN(correctNum)) {
                      return Math.abs(userNum - correctNum) < tolerance;
                  } else {
                      return userValStr === correctValStr;
                  }
              });
          }

        } else {
          // 単一回答の問題の場合
          if (answers.length !== 1 || answers[0].trim() === '') {
               isCorrect = false; // 単一回答の場合は1つだけ回答が必要
          } else {
             try {
                const userValue = evaluate(normalizeLatex(answers[0]), { scope: { factorial } }); // 最初の回答を使用
                isCorrect = problem.correct_answers.some(correctAnswer => {
                  try {
                    const correctValue = evaluate(normalizeLatex(correctAnswer), { scope: { factorial } });
                     const tolerance = 1e-9; // 許容誤差
                     if (typeof userValue === 'number' && typeof correctValue === 'number') {
                       return Math.abs(userValue - correctValue) < tolerance;
                     } else {
                       return String(userValue).trim() === String(correctValue).trim();
                     }
                  } catch {
                    return false;
                  }
                });
              } catch (e) {
                 console.error("Error during mathjs parse/compare (single answer):", e);
                 isCorrect = false;
              }
          }
        }

      } catch (evalError) {
        isCorrect = false;
        console.error('Evaluation Error:', evalError); // 評価エラーログ
      }
    } else {
      // correctAnswersが設定されていない場合は不正解とする
      isCorrect = false;
      console.warn(`Problem ${problem.id} does not have correct_answers defined.`);
    }

    // Save submission with original answer string, but determined isCorrect status
    const { data, error: submissionError } = await supabase.from('submissions').insert({
      virtual_contest_id: params.virtual_id,
      problem_id: params.problem_id,
      user_id: userId,
      answer: answers.join(' || '), // 複数回答を || で結合して保存
      is_correct: isCorrect,
    }).select().single();

    setLoading(false);
    setDialogOpen(false);

    if (submissionError) {
      toast({
        title: 'エラー',
        description: `提出に失敗しました: ${submissionError.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: '成功',
        description: '解答を提出しました',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setAnswers(['']); // Clear the input field
      // Re-fetch submissions to update the list
      const { data: newSubs, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', params.problem_id)
        .eq('virtual_contest_id', params.virtual_id)
        .order('created_at', { ascending: false });

      if (!fetchError && newSubs) {
        setSubmissions(newSubs);
      }
    }
  };

  // バーチャルコンテストをやめる
  const handleQuit = async () => {
    setLoading(true);
    // virtual_contestsテーブルから削除
    await supabase.from('virtual_contests').delete().eq('id', params.virtual_id);
    setLoading(false);
    setQuitDialogOpen(false);
    router.push('/');
  };

  // バーチャルコンテストを完了する
  const handleFinish = async () => {
    setLoading(true);
    await supabase
      .from('virtual_contests')
      .update({ status: 'finished' })
      .eq('id', params.virtual_id);
    setLoading(false);
    setFinishDialogOpen(false);
    router.push(`/contests/${params.id}/virtual/${params.virtual_id}/result`);
  };

  if (!problem) {
    return <Text>読み込み中...</Text>;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading as="h1" size="xl">
            {problem.title}
          </Heading>
          <Box>
            <Text fontSize="sm">残り時間:</Text>
            <Text fontSize="xl" fontWeight="bold" textAlign="right">{timeLeft}</Text>
          </Box>
        </Flex>
        <Tooltip label="問題一覧に戻る" placement="right">
          <Button as={Link} href={`/contests/${params.id}/virtual/${params.virtual_id}`} colorScheme="gray" variant="outline" size="sm" alignSelf="flex-start">
            問題一覧に戻る
          </Button>
        </Tooltip>

        {/* 問題文 */}
        <Text className="problem-text">{renderLatex(problem.content)}</Text>

        {/* 図形がある場合のみ表示 */}
        {problem.diagram_svg && (
          <Box display="flex" justifyContent="center">
            <div dangerouslySetInnerHTML={{ __html: problem.diagram_svg }} />
          </Box>
        )}

        {/* 回答入力欄 */}
        {submissions.length === 0 && virtualContest?.status === 'in_progress' && timeLeft !== '終了' && (
          <Box>
            <FormControl id="answer" isRequired>
              <FormLabel>解答{problem.requires_multiple_answers && " (複数解答が必要です)"}</FormLabel>
               <Text fontSize="xs" color="gray.500" mb={1}>
                右下のキーボードアイコンから分数や平方根などの数式記号を入力できます
              </Text>
              {/* 数式入力支援ボタン */}
              <HStack spacing={2} mb={2} wrap="wrap">
                <Button size="sm" onClick={() => insertLatex('\\frac{#0}{#?}')}>分数 <InlineMath math="\\frac{□}{□}" /></Button>
                <Button size="sm" onClick={() => insertLatex('\\sqrt{#0}')}>平方根 <InlineMath math="\\sqrt{□}" /></Button>
                <Button size="sm" onClick={() => insertLatex('^{#?}')}>指数 <InlineMath math="x^□" /></Button>
                <Button size="sm" onClick={() => insertLatex('\\binom{#0}{#?}')}>コンビネーション(binom) <InlineMath math="\\binom{□}{□}" /></Button>
                <Button size="sm" onClick={() => insertLatex('_{#0}C_{#?}')}>コンビネーション(_nC_k) <InlineMath math="□C□" /></Button>
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
                    {problem.requires_multiple_answers && answers.length > 1 && (
                      <Button size="sm" onClick={() => handleRemoveAnswer(index)}>
                        削除
                      </Button>
                    )}
                  </Flex>
                ))}
                {problem.requires_multiple_answers && (
                  <Button size="sm" onClick={handleAddAnswer} alignSelf="flex-start">
                    + 解答を追加
                  </Button>
                )}
              </VStack>

              {/* 解答プレビュー */} {/* 複数回答の場合は各回答のプレビューを表示 */}
                {answers.map((ans, index) => (
                  <Box key={`preview-${index}`} mt={2} p={3} border="1px solid" borderColor="gray.200" borderRadius={6} bg="gray.100">
                    <Text fontSize="xs" color="gray.500" mb={1}>解答 {index + 1} プレビュー</Text>
                    <BlockMath math={ans} />
                  </Box>
                ))}

            </FormControl>
            <Button mt={4} colorScheme="blue" onClick={handleOpenDialog} isLoading={submissions.length > 0 || loading} isDisabled={virtualContest?.status !== 'in_progress' || timeLeft === '終了' || answers.some(ans => ans.trim() === '')}>
              提出する
            </Button>
            {error && <Alert status="error" mt={4}><AlertIcon />{error}</Alert>}
          </Box>
        )}

        {/* 提出履歴 */}
        {submissions.length > 0 && (
          <Box mt={6}>
            <Text fontSize="sm" fontWeight="bold">提出履歴</Text>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>解答</Th>
                    <Th>ステータス</Th>
                    <Th>スコア</Th>
                    <Th>提出時間</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {submissions.map((submission) => (
                    <Tr key={submission.id}>
                      <Td>{renderLatex(submission.answer)}</Td>
                      <Td>{submission.status}</Td>
                      <Td>{submission.score}</Td>
                      <Td>{new Date(submission.created_at).toLocaleString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* コンテスト操作ボタン */}
        <Flex
          justify="flex-end"
          mt={8}
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
        >
          <Button
            onClick={() => setQuitDialogOpen(true)}
            colorScheme="red"
            variant="outline"
            size="sm"
            mb={{ base: 2, md: 0 }}
            mr={{ base: 0, md: 4 }}
          >
            バーチャルコンテストをやめる
          </Button>
          <Button onClick={() => setFinishDialogOpen(true)} colorScheme="green" size="sm">
            バーチャルコンテストを完了する
          </Button>
        </Flex>
      </VStack>

      {/* 提出確認ダイアログ */}
      <AlertDialog
        isOpen={isDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              解答の提出確認
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text color="red.500" fontWeight="bold" mb={4}>
                ※注意※
                <br />
                バーチャルコンテストでは、<br />
                この問題に提出できるのは**一度だけ**です。
                <br />
                本当にこれらの解答で提出しますか？
              </Text>
              {/* 提出確認ダイアログでの解答表示も複数対応 */}
              <Box
                border="1px dashed red"
                p={4}
                borderRadius="md"
                bg="red.50"
              >
                <Text fontWeight="bold" mb={2}>あなたの解答:</Text>
                {answers.map((ans, index) => (
                   <Box key={`dialog-preview-${index}`} mb={index < answers.length - 1 ? 2 : 0}>
                      <Text fontSize="sm">解答 {index + 1}:</Text>
                      <BlockMath math={ans || ''} />
                   </Box>
                ))}
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDialogOpen(false)} isDisabled={submissions.length > 0 || loading}>
                キャンセル
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit} ml={3} isLoading={loading} isDisabled={submissions.length > 0 || virtualContest?.status !== 'in_progress' || timeLeft === '終了' || answers.some(ans => ans.trim() === '')}>
                提出する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* バーチャルコンテストをやめる確認ダイアログ */}
      <AlertDialog
        isOpen={isQuitDialogOpen}
        leastDestructiveRef={quitCancelRef}
        onClose={() => setQuitDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              バーチャルコンテストを終了しますか？
            </AlertDialogHeader>

            <AlertDialogBody>
              途中で終了すると、その時点での解答状況が保存されますが、コンテストは中断扱いとなります。
              本当に終了しますか？
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={quitCancelRef} onClick={() => setQuitDialogOpen(false)} isDisabled={loading}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleQuit} ml={3} isLoading={loading}>
                終了する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* バーチャルコンテストを完了する確認ダイアログ */}
      <AlertDialog
        isOpen={isFinishDialogOpen}
        leastDestructiveRef={finishCancelRef}
        onClose={() => setFinishDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              バーチャルコンテストを完了しますか？
            </AlertDialogHeader>

            <AlertDialogBody>
              コンテストを完了すると、最終的なスコアが確定し、結果ページに移動します。
              解答中の問題がある場合、提出されずに終了となります。
              本当に完了しますか？
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={finishCancelRef} onClick={() => setFinishDialogOpen(false)} isDisabled={loading}>
                キャンセル
              </Button>
              <Button colorScheme="green" onClick={handleFinish} ml={3} isLoading={loading}>
                完了する
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

    </Container>
  );
}

export default function ProblemClient(props: { problem: Problem, params: { id: string; virtual_id: string; problem_id: string }, userId: string, virtualContest: { start_time: string; end_time: string; status: string; score: number } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProblemClientContent {...props} />
    </Suspense>
  );
} 