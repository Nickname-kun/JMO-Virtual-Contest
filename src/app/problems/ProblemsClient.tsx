"use client"
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Button, ButtonGroup, Input } from '@chakra-ui/react'

const PROBLEM_LABELS = ['1','2','3','4','5','6','7','8','9','10','11','12']
const FIELDS = ['ALL', 'A', 'G', 'C', 'N']

export default function ProblemsClient({ problemsByContest, correctProblemIds }: { problemsByContest: any[], correctProblemIds: string[] }) {
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
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th fontSize="lg">年度</Th>
              {PROBLEM_LABELS.map((label) => (
                <Th key={label} textAlign="center" fontSize="lg">{label}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredProblemsByContest.map(({ contest, problems }) => (
              <Tr key={contest.id} _hover={{ bg: 'gray.50' }}>
                <Td fontWeight="bold">{contest.name}</Td>
                {PROBLEM_LABELS.map((label, idx) => {
                  const problem = problems[idx]
                  const isCorrect = problem && correctProblemIds.includes(problem.id)
                  return (
                    <Td key={label} textAlign="center" bg={isCorrect ? 'green.100' : undefined}>
                      {problem ? (
                        <Link href={`/problems/${problem.id}`} style={{ color: '#3182ce', fontWeight: 500 }}>
                          {label}
                        </Link>
                      ) : (
                        <Text color="gray.400">-</Text>
                      )}
                    </Td>
                  )
                })}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  )
} 