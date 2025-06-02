"use client"

import { Suspense } from 'react'
import SubmissionSection from './submission-section'
import { InlineMath, BlockMath } from 'react-katex'
import { remark } from 'remark';
import html from 'remark-html';
import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  SimpleGrid,
  Badge,
  Flex,
  Container,
  Button,
} from '@chakra-ui/react'
import Link from 'next/link'

function renderLatex(text: string) {
  // MarkdownをHTMLに変換
  const processedHtml = remark().use(html).processSync(text).toString();

  // HTMLの中からLaTeX部分を探し、KaTeXコンポーネントに置換
  const parts = processedHtml.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      return <BlockMath key={i} math={math} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return <InlineMath key={i} math={math} />;
    } else {
      // LaTeX部分以外のHTMLを表示
      return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
    }
  });
}

interface Problem {
  id: string
  title: string
  content: string
  correct_answers?: string[];
  has_diagram: boolean
  diagram_svg: string
  // ... other fields
}

function ProblemClientContent({ problem }: { problem: Problem }) {
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">
          {problem.title}
        </Heading>
        <Button as={Link} href="/problems" colorScheme="gray" variant="outline" size="sm" alignSelf="flex-start">
          問題一覧へ戻る
        </Button>
        
        {/* 問題文（Boxラッパーを外して直接表示） */}
        <Text whiteSpace="pre-wrap" className="problem-text">{renderLatex(problem.content)}</Text>

        {/* 図形がある場合のみ表示（ボックスなしで表示） */}
        {problem.diagram_svg && (
          <Box display="flex" justifyContent="center">
            <div dangerouslySetInnerHTML={{ __html: problem.diagram_svg }} />
          </Box>
        )}

        {/* 解答欄・提出履歴 */}
        <SubmissionSection problemId={problem.id} correctAnswers={problem.correct_answers || null} />
      </VStack>
    </Container>
  )
}

export default function ProblemClient(props: { problem: Problem }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProblemClientContent {...props} />
    </Suspense>
  )
} 