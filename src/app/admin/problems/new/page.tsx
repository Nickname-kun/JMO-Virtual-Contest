'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  Checkbox,
  Text,
  Container,
  HStack,
} from '@chakra-ui/react'
import { BlockMath } from 'react-katex'
import React from 'react'
import 'mathlive'

interface NewProblemFormData {
  title: string;
  content: string;
  correct_answers: string[];
  points: number;
  number: number;
  contest_id: string;
  has_diagram: boolean;
  diagram_svg: string;
  field: string;
}

export default function NewProblemPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)
  const [contests, setContests] = useState<any[]>([])
  const [formData, setFormData] = useState<NewProblemFormData>({
    title: '',
    content: '',
    correct_answers: [''],
    points: 1,
    number: 1,
    contest_id: '',
    has_diagram: false,
    diagram_svg: '',
    field: '',
  })
  const mathfieldRefs = useRef<(any | null)[]>([])
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // コンテスト一覧を取得
    const fetchContests = async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('id, name')
        .order('name', { ascending: false })
      if (!error && data) setContests(data)
    }
    fetchContests()
  }, [supabase])

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
    e.preventDefault()
    if (!formData.contest_id) {
      setError('コンテストを選択してください')
      return
    }
    if (!formData.correct_answers || formData.correct_answers.every(answer => answer.trim() === '')) {
        setError('正解を少なくとも1つ入力してください');
        return;
    }
    setError(null);
    try {
      const dataToSend: any = {
        title: formData.title,
        content: formData.content,
        correct_answers: formData.correct_answers.filter(answer => answer.trim() !== ''),
        points: Number(formData.points),
        number: Number(formData.number),
        contest_id: formData.contest_id,
        field: formData.field,
      }
      if (formData.has_diagram && formData.diagram_svg) {
        dataToSend.diagram_svg = formData.diagram_svg;
      }
      const { error: insertError } = await supabase.from('problems').insert([
        dataToSend
      ])
      if (insertError) throw insertError
      router.push('/admin/problems')
    } catch (error: any) {
      setError(error.message || '問題の追加に失敗しました')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      // 数値型に変換する必要があるフィールドを考慮
      [name]: name === 'points' || name === 'number' ? Number(value) : value,
    }))
  }

  const handleCorrectAnswerChange = (index: number, value: string) => {
    setFormData(prev => {
      const newCorrectAnswers = [...prev.correct_answers];
      newCorrectAnswers[index] = value;
      return { ...prev, correct_answers: newCorrectAnswers };
    });
  };

  const handleAddCorrectAnswer = () => {
    setFormData(prev => ({
      ...prev,
      correct_answers: [...prev.correct_answers, ''], // 新しい空の正解フィールドを追加
    }));
  };

  const handleRemoveCorrectAnswer = (index: number) => {
    setFormData((prev: NewProblemFormData) => {
      // 正解が1つだけの時は削除できないようにする (最低1つは必要)
      if (prev.correct_answers.length <= 1) return prev;
      const indexToRemove = index; // 引数のindexを別の変数に格納
      return { ...prev, correct_answers: prev.correct_answers.filter((_: string, i: number) => i !== indexToRemove) }; // 格納した変数を参照
    });
  };

  const insertMarkdown = (format: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

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

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">
          問題追加
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {error && (
                <Alert status="error">
                    <AlertIcon />
                    {error}
                </Alert>
            )}
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
              <FormLabel>問題文</FormLabel>
              <HStack spacing={2} mb={2}>
                <Button size="sm" onClick={() => insertMarkdown('bold')}>太字</Button>
                <Button size="sm" onClick={() => insertMarkdown('italic')}>斜体</Button>
                <Button size="sm" onClick={() => insertMarkdown('list')}>リスト</Button>
              </HStack>
              <Textarea
                ref={contentTextareaRef}
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={5}
              />
            </FormControl>
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
            <FormControl isRequired>
              <FormLabel>配点</FormLabel>
              <NumberInput min={1} value={formData.points} onChange={(_, v) => setFormData((prev) => ({ ...prev, points: v }))}>
                <NumberInputField name="points" />
              </NumberInput>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>分野</FormLabel>
              <Select
                name="field"
                value={formData.field}
                onChange={handleChange}
                placeholder="分野を選択"
              >
                <option value="A">A（代数）</option>
                <option value="G">G（幾何）</option>
                <option value="C">C（組合せ）</option>
                <option value="N">N（数論）</option>
              </Select>
            </FormControl>
            <FormControl>
              <Checkbox
                isChecked={formData.has_diagram}
                onChange={(e) => setFormData(prev => ({ ...prev, has_diagram: e.target.checked }))}
              >
                図形を追加する
              </Checkbox>
            </FormControl>
            {formData.has_diagram && (
              <FormControl>
                <FormLabel>図形（SVG）</FormLabel>
                <Textarea
                  value={formData.diagram_svg}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagram_svg: e.target.value }))}
                  placeholder="<svg>...</svg>"
                  rows={10}
                  fontFamily="monospace"
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  SVGコードを直接入力してください。図形のプレビューは問題表示時に反映されます。
                </Text>
              </FormControl>
            )}
            <Flex justify="flex-end">
              <Button type="submit" colorScheme="blue" size="lg">
                問題を追加
              </Button>
            </Flex>
          </VStack>
        </form>
      </VStack>
    </Container>
  )
} 