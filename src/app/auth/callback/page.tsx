"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { Box, Text, Spinner, VStack } from '@chakra-ui/react';

export default function AuthCallbackPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 1000);

      return () => clearTimeout(timer);
    } else if (session === null) {
      console.log('Session not established after callback.');
    }
  }, [session, router]);

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
