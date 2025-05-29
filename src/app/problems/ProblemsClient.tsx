"use client"
import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Button, ButtonGroup, Input } from '@chakra-ui/react'

const PROBLEM_LABELS = ['1','2','3','4','5','6','7','8','9','10','11','12']
const FIELDS = ['ALL', 'A', 'G', 'C', 'N']

function ProblemsClientContent({ problemsByContest, correctProblemIds }: { problemsByContest: any[], correctProblemIds: string[] }) {
  const [selectedField, setSelectedField] = useState('ALL')
  const [search, setSearch] = useState('')

  const filteredProblemsByContest = useMemo(() => {
    return problemsByContest.map(({ contest, problems }) => {
      const contestMatch = contest.name.includes(search)
      const filteredProblems = problems.map((p: any) => {
        if (!p) return null
        const titleMatch = p.title && p.title.includes(search)
        const contentMatch = p.content && p.content.includes(search)
        const fieldMatch = selectedField === 'ALL' || p.field === selectedField
        return (titleMatch || contentMatch || contestMatch) && fieldMatch ? p : null
      })
      return { contest, problems: filteredProblems }
    })
  }, [problemsByContest, selectedField, search])

  return (
    <Box maxW="100vw" px={{ base: 2, md: 8 }} py={10}>
      <Text fontSize="3xl" fontWeight="bold" mb={8} textAlign="center">
        問題一覧
      </Text>
      <Box mb={4} display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <ButtonGroup>
          {FIELDS.map(field => (
            <Button key={field} onClick={() => setSelectedField(field)} colorScheme={selectedField === field ? 'blue' : 'gray'}>{field === 'ALL' ? 'すべて' : field}</Button>
          ))}
        </ButtonGroup>
        <Input
          placeholder="年度や問題文で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          maxW={300}
          ml={4}
        />
      </Box>
      <TableContainer overflowX="auto" bg="white" borderRadius="xl" boxShadow="md" p={4}>
        {filteredProblemsByContest.map(({ contest, problems }) => (
          <Box key={contest.id} mb={8}>
            <Text fontSize="2xl" fontWeight="bold" mb={4}>
              {contest.name}
            </Text>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>番号</Th>
                  <Th>問題</Th>
                  <Th>分野</Th>
                  <Th>状態</Th>
                </Tr>
              </Thead>
              <Tbody>
                {problems.map((problem: any, index: number) => {
                  if (!problem) return null;
                  const isCorrect = correctProblemIds.includes(problem.id);
                  return (
                    <Tr key={problem.id}>
                      <Td>{PROBLEM_LABELS[index]}</Td>
                      <Td>
                        <Link href={`/problems/${problem.id}`}>
                          {problem.title}
                        </Link>
                      </Td>
                      <Td>{problem.field}</Td>
                      <Td>
                        {isCorrect ? (
                          <Text color="green.500">正解</Text>
                        ) : (
                          <Text color="gray.500">未解答</Text>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        ))}
      </TableContainer>
    </Box>
  );
}

export default function ProblemsClient(props: { problemsByContest: any[], correctProblemIds: string[] }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProblemsClientContent {...props} />
    </Suspense>
  );
} 