import { Box, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function ContestsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: contests } = await supabase
    .from('contests')
    .select('*')
    .order('name', { ascending: false });

  return (
    <Box maxW="4xl" mx="auto" py={10} px={4}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        コンテスト一覧
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {contests?.map((c: any) => (
          <Box
            key={c.id}
            bg="white"
            borderRadius="xl"
            boxShadow="md"
            p={6}
            borderWidth={1}
            _hover={{ boxShadow: 'lg' }}
            transition="box-shadow 0.2s"
          >
            <VStack align="start" spacing={2}>
              <Heading as={Link} href={`/contests/${c.id}`} size="md" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                {c.name}
              </Heading>
              <Text color="gray.600" fontSize="sm">{c.description}</Text>
              <Text fontSize="sm">
                <b>制限時間：</b>{c.duration_minutes}分
              </Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
} 