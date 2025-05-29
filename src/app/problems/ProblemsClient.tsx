"use client"
import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Button, ButtonGroup, Input } from '@chakra-ui/react'

const PROBLEM_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
const FIELDS = ['ALL', 'A', 'G', 'C', 'N']

function ProblemsClientContent({ problemsByContest, correctProblemIds }: { problemsByContest: any[], correctProblemIds: string[] }) {
  const [selectedField, setSelectedField] = useState('ALL')
  const [search, setSearch] = useState('')

  const filteredProblemsByContest = useMemo(() => {
    return problemsByContest
      .filter(({ contest }) => contest.name.includes(search))
      .map(({ contest, problems }) => {
        const filteredProblems = problems.filter((p: any) => {
          if (!p) return false;
          const fieldMatch = selectedField === 'ALL' || p.field === selectedField;
          // 問題のタイトルや内容での検索は、年度での検索と組み合わせる必要はないため削除
          return fieldMatch;
        });
        return { contest, problems: filteredProblems };
      });
  }, [problemsByContest, selectedField, search]);

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
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>年度</Th>
              {PROBLEM_NUMBERS.map(number => (
                <Th key={number} isNumeric>{number}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredProblemsByContest.map(({ contest, problems }) => (
              <Tr key={contest.id}>
                <Td>{contest.name}</Td>
                {PROBLEM_NUMBERS.map(number => {
                  const problem = problems.find((p: any) => p.number === number);
                  const isCorrect = problem ? correctProblemIds.includes(problem.id) : false;
                  return (
                    <Td key={number} isNumeric>
                      {problem ? (
                        <Link href={`/problems/${problem.id}`}>
                          <Text color={isCorrect ? "green.500" : "gray.500"} fontWeight="bold">
                            {problem.number}
                          </Text>
                        </Link>
                      ) : (
                        <Text>-</Text>
                      )}
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </Tbody>
        </Table>
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