'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 20;

async function getProfiles(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from("profiles")
    .select("id, username, created_at, is_admin, affiliation", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  return { data, error, count };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProfiles(page).then(({ data, error, count }) => {
      if (error) {
        setError(error.message);
        setProfiles([]);
        setCount(0);
      } else {
        setProfiles(data || []);
        setCount(count || 0);
        setError(null);
      }
      setLoading(false);
    });
  }, [page]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <Box maxW="2xl" mx="auto" py={8}>
      <Heading as="h1" size="lg" mb={6}>
        ユーザー一覧
      </Heading>
      {error && <Text color="red.500" mb={4}>{error}</Text>}
      <Box overflowX="auto" borderRadius="md" boxShadow="md" bg="white">
        <Table variant="simple" whiteSpace="nowrap">
          <Thead>
            <Tr>
              <Th>ユーザー名</Th>
              <Th>所属</Th>
              <Th>登録日</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={3} textAlign="center" py={8}>
                  <Spinner size="lg" />
                </Td>
              </Tr>
            ) : profiles.length > 0 ? (
              profiles.map((user) => (
                <Tr key={user.id} _hover={{ bg: "gray.50" }}>
                  <Td>
                    <Link href={`/profile/${user.id}`}>
                      <Text
                        as="span"
                        style={user.is_admin ? { color: "rgb(102, 0, 153)", WebkitTextStroke: "0.2px white", fontWeight: "bold" } : {}}
                        _hover={{ textDecoration: "underline", cursor: "pointer" }}
                      >
                        {user.username || user.id}
                      </Text>
                    </Link>
                  </Td>
                  <Td>{user.affiliation || "-"}</Td>
                  <Td>{formatDate(user.created_at)}</Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={3} textAlign="center" py={8}>
                  ユーザーが見つかりません
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
      {/* ページネーション */}
      <Flex justify="center" align="center" gap={2} mt={6}>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page === 1}
        >
          前へ
        </Button>
        <Text>
          {page} / {totalPages || 1}
        </Text>
        <Button
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          isDisabled={page === totalPages || totalPages === 0}
        >
          次へ
        </Button>
      </Flex>
    </Box>
  );
} 