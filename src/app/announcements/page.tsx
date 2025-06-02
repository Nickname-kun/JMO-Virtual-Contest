import { Box, Container, Heading, Text, VStack, Divider, Flex } from '@chakra-ui/react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function AnnouncementsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // お知らせを取得
  const { data: announcements } = await supabase
    .from('announcements')
    .select('title, content, created_at')
    .order('created_at', { ascending: false });

  return (
    <Container maxW="4xl" py={10} px={4}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        お知らせ一覧
      </Heading>
      
      <Box bg="white" borderRadius="xl" boxShadow="md" p={{ base: 4, md: 6 }} borderWidth={1}>
        {announcements && announcements.length > 0 ? (
          <VStack align="stretch" spacing={4} divider={<Divider borderColor="gray.400" />}>
            {announcements.map((announcement: any) => (
              <Box key={announcement.created_at}>
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="start">
                  <Text fontSize="md" color="gray.700" mr={4}>
                    {new Date(announcement.created_at) >= new Date(new Date().setDate(new Date().getDate() - 2)) && (
                      <Text as="span" mr={2} fontSize="sm" color="red.500" fontWeight="normal">
                        new!
                      </Text>
                    )}
                    {announcement.content}
                  </Text>
                  <Text fontSize="xs" color="gray.500" flexShrink={0}>
                    {new Date(announcement.created_at).toLocaleString()}
                  </Text>
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text color="gray.700">現在、お知らせはありません。</Text>
        )}
      </Box>
    </Container>
  );
} 