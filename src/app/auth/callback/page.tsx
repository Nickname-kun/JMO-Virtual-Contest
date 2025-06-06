"use client";

import { Box, Text, Spinner, VStack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';
import { redirect } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        redirect('/auth');
      }
    };

    handleAuthCallback();
  }, [supabase]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      bgColor="gray.100"
    >
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="xl" color="gray.700">
          認証処理中です...
        </Text>
      </VStack>
    </Box>
  );
} 
