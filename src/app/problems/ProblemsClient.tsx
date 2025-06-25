"use client"
import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Text, Button, ButtonGroup, Input, HStack } from '@chakra-ui/react'

const PROBLEM_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
const FIELDS = ['ALL', 'A', 'G', 'C', 'N']

// コンテスト名からカテゴリを判定する関数
function getContestCategory(contestName: string): string {
  if (contestName.includes('日本ジュニア数学オリンピック') || contestName.includes('JJMO')) {
    return 'JJMO';
  } else if (contestName.includes('日本数学オリンピック') || contestName.includes('JMO')) {
    return 'JMO';
  } else if (contestName.includes('JMO模試') || contestName.includes('数学オリンピック模試')) {
    return 'JMO模試';
  } else {
    return 'その他';
  }
}

function ProblemsClientContent({ problemsByContest, correctProblemIds }: { problemsByContest: any[], correctProblemIds: string[] }) {
  const [selectedField, setSelectedField] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [contestCategory, setContestCategory] = useState('ALL');
  const CONTEST_CATEGORIES = ['ALL', 'JMO', 'JJMO', 'JMO模試', 'その他'];

  const filteredProblemsByContest = useMemo(() => {
    return problemsByContest
      .filter(({ contest }) => {
        if (contestCategory === 'ALL') return true;
        return getContestCategory(contest.name) === contestCategory;
      })
      // コンテスト名での検索を削除し、問題のタイトルと内容での検索のみを行う
      // .filter(({ contest }) => contest.name.includes(search))
      .map(({ contest, problems }) => {
        const filteredProblems = problems.filter((p: any) => {
          if (!p) return false;
          const fieldMatch = selectedField === 'ALL' || p.field === selectedField;
          // 問題のタイトルや内容での検索機能を追加
          const textMatch = p.title.includes(search) || p.content.includes(search);
          
          // フィールドで絞り込み、かつ検索テキストに一致するもの
          if (search) { // 検索テキストがある場合のみテキスト検索を適用
            return fieldMatch && textMatch;
          } else { // 検索テキストがない場合はフィールド検索のみ
            return fieldMatch;
          }
        });
        return { contest, problems: filteredProblems };
      });
  }, [problemsByContest, selectedField, search, contestCategory]);

  // ページネーション用: フィルタ後の年度リストをページごとに分割
  const totalPages = Math.ceil(filteredProblemsByContest.length / PAGE_SIZE) || 1;
  const pagedProblemsByContest = filteredProblemsByContest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box maxW="100vw" px={{ base: 2, md: 8 }} py={10}>
      <Text fontSize="3xl" fontWeight="bold" mb={8} textAlign="center">
        問題一覧
      </Text>
      <Box mb={4} display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <HStack wrap="wrap" spacing={2} mb={{ base: 2, md: 0 }}>
          {CONTEST_CATEGORIES.map(cat => (
            <Button key={cat} size="sm" onClick={() => { setContestCategory(cat); setPage(1); }} colorScheme={contestCategory === cat ? 'purple' : 'gray'}>{cat === 'ALL' ? 'すべて' : cat}</Button>
          ))}
        </HStack>
        <HStack wrap="wrap" spacing={2} mb={{ base: 2, md: 0 }}>
          {FIELDS.map(field => (
            <Button key={field} size="sm" onClick={() => setSelectedField(field)} colorScheme={selectedField === field ? 'blue' : 'gray'}>{field === 'ALL' ? '全分野' : field}</Button>
          ))}
        </HStack>
        <Input
          placeholder="年度や問題文で検索"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          maxW={300}
          ml={4}
          size="sm"
        />
      </Box>
      {/* ページネーションコントロール */}
      <Box mb={2} display="flex" justifyContent="center" alignItems="center" gap={2}>
        <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} isDisabled={page === 1}>前へ</Button>
        <Text>{page} / {totalPages}</Text>
        <Button size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} isDisabled={page === totalPages}>次へ</Button>
      </Box>
      <TableContainer overflowX="auto" bg="white" borderRadius="xl" boxShadow="md" p={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th textAlign="center" borderRight="1px solid #E2E8F0">年度</Th>
              {PROBLEM_NUMBERS.map(number => (
                <Th key={number} isNumeric textAlign="center" borderRight="1px solid #E2E8F0">{number}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {pagedProblemsByContest.map(({ contest, problems }) => (
              <Tr key={contest.id}>
                <Td borderRight="1px solid #E2E8F0">{contest.name}</Td>
                {PROBLEM_NUMBERS.map(number => {
                  const problem = problems.find((p: any) => p.number === number);
                  const isCorrect = problem ? correctProblemIds.includes(problem.id) : false;
                  return (
                    <Td key={number} bg={isCorrect ? "green.100" : "transparent"} textAlign="center" borderRight="1px solid #E2E8F0">
                      {problem ? (
                        <Link href={`/problems/${problem.id}`}>
                          <Text color="gray.800" fontWeight="bold" textDecoration={isCorrect ? "none" : "underline"} _hover={{ textDecoration: "underline" }}>
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
      {/* 下部にもページネーションコントロール */}
      <Box mt={2} display="flex" justifyContent="center" alignItems="center" gap={2}>
        <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} isDisabled={page === 1}>前へ</Button>
        <Text>{page} / {totalPages}</Text>
        <Button size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} isDisabled={page === totalPages}>次へ</Button>
      </Box>
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