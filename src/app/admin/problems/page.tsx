'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Table, Thead, Tbody, Tr, Th, Td, Box, Heading, Button, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react'

type Problem = {
  id: string
  title: string
  year: number
  number: number
  points: number
  created_at: string
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data, error } = await supabase
          .from('problems')
          .select('*, contest:contest_id(name)')

        if (error) throw error
        setProblems(data || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : '問題の取得に失敗しました')
      }
    }

    fetchProblems()
  }, [supabase])

  // 年度（コンテスト名）ごとにグループ化
  const grouped = problems.reduce((acc: Record<string, any[]>, p) => {
    const year = p.contest?.name || '不明'
    if (!acc[year]) acc[year] = []
    acc[year].push(p)
    return acc
  }, {})
  // 各年度ごとにnumber順でsort
  Object.values(grouped).forEach((plist: any[]) => {
    plist.sort((a, b) => a.number - b.number)
  })

  return (
    <Box maxW="4xl" mx="auto" py={8}>
      <Heading size="lg" mb={6}>問題一覧</Heading>
      <Box mb={4}>
        <Button as={Link} href="/admin/problems/new" colorScheme="teal">新規問題を追加</Button>
      </Box>
      {error && (
        <Box mb={4} p={4} bg="red.50" color="red.700" borderRadius="md">{error}</Box>
      )}
      {Object.keys(grouped).length === 0 && !error && (
        <Box color="gray.500" textAlign="center" py={8}>問題がありません</Box>
      )}
      {/* 年度（year）を新しい順に降順ソート */}
      <Accordion allowMultiple>
        {Object.entries(grouped)
          .sort(([a], [b]) => {
            // 年度名が数値の場合は数値で比較、それ以外は文字列比較
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
            return b.localeCompare(a, 'ja');
          })
          .map(([year, plist]) => (
            <AccordionItem key={year} mb={4} borderRadius="md" border="1px solid #e2e8f0" overflow="hidden">
              <h2>
                <AccordionButton _expanded={{ bg: 'teal.50' }}>
                  <Box as="span" flex="1" textAlign="left" fontWeight="bold">{year}</Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Table variant="striped" size="md">
                  <Thead>
                    <Tr>
                      <Th>問題番号</Th>
                      <Th>タイトル</Th>
                      <Th>配点</Th>
                      <Th>編集</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {plist.map(problem => (
                      <Tr key={problem.id}>
                        <Td>第{problem.number}問</Td>
                        <Td>{problem.title}</Td>
                        <Td>{problem.points}点</Td>
                        <Td>
                          <Button as={Link} href={`/admin/problems/${problem.id}/edit`} size="sm" colorScheme="blue" variant="outline">
                            編集
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </AccordionPanel>
            </AccordionItem>
          ))}
      </Accordion>
    </Box>
  )
} 