"use client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, Suspense } from "react";
import { ChakraProvider } from '@chakra-ui/react';
import { Database } from '@/types/database';
import { LoadingProvider } from '@/contexts/LoadingContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createClientComponentClient<Database>());
  return (
    <ChakraProvider>
      <SessionContextProvider supabaseClient={supabaseClient}>
        <LoadingProvider>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </LoadingProvider>
      </SessionContextProvider>
    </ChakraProvider>
  );
} 