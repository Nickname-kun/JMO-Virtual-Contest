"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  NumberInput,
  NumberInputField,
  VStack,
  Alert,
  AlertIcon,
  Flex,
  Select,
  Spinner,
  Text,
  HStack,
  Checkbox,
} from "@chakra-ui/react";
import { BlockMath, InlineMath } from 'react-katex';
import React from "react";
import 'mathlive';
import { useLoading } from '@/contexts/LoadingContext';
import { renderLatex } from '@/utils/renderLatex';

interface EditProblemFormData {
  title: string;
  content: string;
  correct_answers: string[];
  number: number;
  contest_id: string;
  diagram_svg: string;
  field: string;
  points: number;
  requires_multiple_answers: boolean;
}

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState<any[]>([]);
  const [formData, setFormData] = useState<EditProblemFormData>({
    title: "",
    content: "",
    correct_answers: [''],
    number: 1,
    contest_id: "",
    diagram_svg: "",
    field: "",
    points: 1,
    requires_multiple_answers: false,
  });
  const mathfieldRefs = useRef<(any | null)[]>([]);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { showLoading, hideLoading } = useLoading();

  // 問題ID
  const problemId = params?.id as string;

  useEffect(() => {
    // コンテスト一覧を取得
    const fetchContests = async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("id, name")
        .order("name", { ascending: false });
      if (!error && data) setContests(data);
    };
    fetchContests();
  }, [supabase]);

  useEffect(() => {
    // 問題データ取得
    const fetchProblem = async () => {
      setLoading(true);
      showLoading();
      const { data, error } = await supabase
        .from("problems")
        .select("*, correct_answers")
        .eq("id", problemId)
        .single();
      if (error || !data) {
        setError("問題の取得に失敗しました");
      } else {
        setFormData({
          title: data.title,
          content: data.content,
          correct_answers: (data.correct_answers && Array.isArray(data.correct_answers)) ? data.correct_answers : [''],
          number: data.number,
          contest_id: data.contest_id,
          diagram_svg: data.diagram_svg ?? "",
          field: data.field ?? "",
          points: data.points ?? 1,
          requires_multiple_answers: data.requires_multiple_answers ?? false,
        });
      }
      setLoading(false);
      hideLoading();
    };
    if (problemId) fetchProblem();
  }, [problemId, supabase]);

  useEffect(() => {
    // 数式入力エディタの初期化
    mathfieldRefs.current.forEach((ref, index) => {
      if (ref && !(ref as any).$initialized) {
        (ref as any).addEventListener('input', (evt: any) => {
          setFormData((prev) => {
            const newCorrectAnswers = [...prev.correct_answers];
            newCorrectAnswers[index] = evt.target.value;
            return { ...prev, correct_answers: newCorrectAnswers };
          });
        });
        (ref as any).$initialized = true;
      }
    });
  }, [formData.correct_answers.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contest_id) {
      setError("コンテストを選択してください");
      return;
    }
    if (!formData.correct_answers || formData.correct_answers.every(answer => answer.trim() === '')) {
      setError('正解を少なくとも1つ入力してください');
      return;
    }
    setError(null);
    setLoading(true);
    showLoading();
    try {
      const dataToUpdate: any = {
        title: formData.title,
        content: formData.content,
        correct_answers: formData.correct_answers.filter(answer => answer.trim() !== ''),
        number: Number(formData.number),
        field: formData.field,
        points: Number(formData.points),
        requires_multiple_answers: formData.requires_multiple_answers,
      };
      dataToUpdate.diagram_svg = formData.diagram_svg || null;

      const { error: updateError } = await supabase
        .from("problems")
        .update(dataToUpdate)
        .eq("id", problemId);
      if (updateError) throw updateError;
      router.push("/admin/problems");
    } catch (error: any) {
      setError(error.message || "問題の更新に失敗しました");
    }
    setLoading(false);
    hideLoading();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "number" || name === "points" ? Number(value) : value,
    }));
  };

  const handleCorrectAnswerChange = (index: number, value: string) => {
    setFormData((prev: EditProblemFormData) => {
      const newCorrectAnswers = [...prev.correct_answers];
      newCorrectAnswers[index] = value;
      return { ...prev, correct_answers: newCorrectAnswers };
    });
  };

  const handleAddCorrectAnswer = () => {
    setFormData((prev: EditProblemFormData) => ({
      ...prev,
      correct_answers: [...prev.correct_answers, ''],
    }));
  };

  const handleRemoveCorrectAnswer = (index: number) => {
    setFormData((prev: EditProblemFormData) => {
      if (prev.correct_answers.length <= 1) return prev;
      const indexToRemove = index;
      return { ...prev, correct_answers: prev.correct_answers.filter((_: string, i: number) => i !== indexToRemove) };
    });
  };

  const insertMarkdown = (format: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    let prefix = '';
    let suffix = '';
    let selectedText = value.substring(start, end);

    switch (format) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        if (!selectedText) selectedText = '太字';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        if (!selectedText) selectedText = '斜体';
        break;
      case 'list':
        prefix = '- ';
        suffix = '';
        if (selectedText) {
          selectedText = selectedText.split('\n').map(line => '- ' + line).join('\n');
          prefix = '';
        } else {
          selectedText = '';
        }
        break;
      // 他の書式設定のケースもここに追加
    }

    const newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

    setFormData(prev => ({ ...prev, content: newValue }));

    // カーソル位置を調整
    // 次のレンダリングで値が更新された後に実行されるように少し遅延させる
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = start + prefix.length + selectedText.length;
      }
    }, 0);
  };

  if (loading) {
    return (
      <Box py={20} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box maxW="2xl" mx="auto" py={8} px={4}>
      <Heading as="h1" size="lg" mb={8} textAlign="center">
        問題の編集
      </Heading>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <FormControl isRequired>
            <FormLabel>コンテスト</FormLabel>
            <Select
              name="contest_id"
              value={formData.contest_id}
              onChange={handleChange}
              placeholder="コンテストを選択"
            >
              {contests.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>問題番号</FormLabel>
            <NumberInput min={1} max={12} value={formData.number} onChange={(_, v) => setFormData((prev) => ({ ...prev, number: v }))}>
              <NumberInputField name="number" />
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>タイトル</FormLabel>
            <Input name="title" value={formData.title} onChange={handleChange} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>分野</FormLabel>
            <Select name="field" value={formData.field} onChange={handleChange} placeholder="分野を選択">
              <option value="A">A - 代数</option>
              <option value="G">G - 幾何</option>
              <option value="C">C - 組合せ</option>
              <option value="N">N - 数論</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>問題文</FormLabel>
            <HStack spacing={2} mb={2}>
              <Button size="sm" onClick={() => insertMarkdown('bold')}>太字</Button>
              <Button size="sm" onClick={() => insertMarkdown('italic')}>斜体</Button>
              <Button size="sm" onClick={() => insertMarkdown('list')}>リスト</Button>
              {/* 他の書式設定ボタンもここに追加 */}
            </HStack>
            <Text fontSize="sm" color="gray.500" mt={1}>Markdown記法が利用可能です（太字: **太字**, 斜体: *斜体*, リスト: - リスト項目）</Text>
            <Textarea
              name="content"
              ref={contentTextareaRef}
              value={formData.content}
              onChange={handleChange}
              rows={5}
            />
          </FormControl>
          {/* 問題文プレビュー */}
          {formData.content && (
            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text fontSize="sm" fontWeight="bold" mb={2}>プレビュー:</Text>
              <Box className="problem-text">
                {renderLatex(formData.content)}
              </Box>
            </Box>
          )}
          <FormControl isRequired>
            <FormLabel>正解 (複数可)</FormLabel>
            <VStack spacing={2} align="stretch">
              {formData.correct_answers.map((answer, index) => (
                <Flex key={index} gap={2} align="center">
                  <math-field
                    {...{
                      ref: (el: any) => { mathfieldRefs.current[index] = el },
                      value: answer,
                      style: { width: '100%', height: '40px', border: 'none' }
                    } as any}
                  />
                  {formData.correct_answers.length > 1 && (
                    <Button size="sm" onClick={() => handleRemoveCorrectAnswer(index)}>
                      削除
                    </Button>
                  )}
                </Flex>
              ))}
              <Button size="sm" onClick={handleAddCorrectAnswer} alignSelf="flex-start">
                + 正解を追加
              </Button>
            </VStack>
          </FormControl>
          <FormControl>
            <FormLabel>図形 (SVG)</FormLabel>
            <Textarea
              name="diagram_svg"
              value={formData.diagram_svg}
              onChange={handleChange}
              placeholder="ここにSVGコードを入力"
              rows={10}
            />
          </FormControl>
          {formData.diagram_svg && (
            <Box mt={2} p={3} border="1px solid" borderColor="gray.200" borderRadius={6} bg="gray.100">
              <Text fontSize="xs" color="gray.500" mb={1}>図形プレビュー</Text>
              <Box dangerouslySetInnerHTML={{ __html: formData.diagram_svg }} />
            </Box>
          )}
          <FormControl isRequired>
            <FormLabel>配点</FormLabel>
            <NumberInput min={1} value={formData.points} onChange={(_, v) => setFormData((prev) => ({ ...prev, points: v }))}>
              <NumberInputField name="points" />
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel>複数回答が必要</FormLabel>
            <Checkbox
              isChecked={formData.requires_multiple_answers}
              onChange={(e) => setFormData(prev => ({ ...prev, requires_multiple_answers: e.target.checked }))}
            >
              この問題は複数の解答を必要とします
            </Checkbox>
            <Text fontSize="sm" color="gray.500" mt={1}>
              チェックを入れると、ユーザーは複数の解答を提出できるようになります
            </Text>
          </FormControl>
          <Flex justify="flex-end">
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              保存
            </Button>
          </Flex>
        </VStack>
      </form>
    </Box>
  );
} 