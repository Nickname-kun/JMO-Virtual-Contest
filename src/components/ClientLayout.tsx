"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback, Suspense } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeedbackToast from '@/app/profile/FeedbackToast';
import { useLoading } from '@/contexts/LoadingContext';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@supabase/auth-helpers-react";
import { Box, useTheme, Text } from '@chakra-ui/react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading } = useLoading();
  const supabase = createClientComponentClient();
  const session = useSession();
  const theme = useTheme();

  const isMaclathRelatedPage = pathname.startsWith('/maclath');

  useEffect(() => {
    const createProfileIfMissing = async () => {
      // console.log('Checking profile for session:', session);
      if (session?.user) {
        // Check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        // console.log('Profile check result:', { data, error });

        if (error && error.code === 'PGRST116') { // PGRST116 indicates no row found
          // console.log('Profile not found, creating new profile');
          // console.log('User metadata:', session.user.user_metadata);
          
          const username = session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`;
          // console.log('Generated username:', username);

          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                username: username,
                is_admin: false,
              },
            ]);

          if (insertError) {
            // console.error('Error creating profile:', insertError);
          } else {
            // console.log('Profile created successfully for user:', session.user.id);
          }
        } else if (error) {
          // console.error('Error checking profile:', error);
        }
      }
    };

    createProfileIfMissing();

    // body の背景色を動的に設定
    if (isMaclathRelatedPage) {
      document.body.style.backgroundColor = theme.colors.purple['100'];
    } else {
      document.body.style.backgroundColor = theme.colors.white;
    }

    // クリーンアップ関数
    return () => {
      document.body.style.backgroundColor = ''; // 背景色をリセット
    };
  }, [session, supabase, isMaclathRelatedPage, theme.colors.purple, theme.colors.white]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {isLoading && <LoadingOverlay />}
      <Box as="main" flexGrow={1} bg={isMaclathRelatedPage ? 'purple.100' : 'white'}>{children}</Box>
      <Footer />
      <Box bg="gray.800" py={4} textAlign="center">
        <Text fontSize="sm" color="gray.300" mb={1}>
          ※ JMOおよびJJMOの問題の著作権は数学オリンピック財団に帰属します。
        </Text>
        <Text fontSize="sm" color="gray.400">
          &copy; {new Date().getFullYear()}, JMO Virtual Contest
        </Text>
      </Box>
      <FeedbackToast />
    </div>
  );
} 