"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback, Suspense } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeedbackToast from '@/app/profile/FeedbackToast';
import { useLoading } from '@/contexts/LoadingContext';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading } = useLoading();
  const supabase = createClientComponentClient();
  const user = useUser();

  useEffect(() => {
    const createProfileIfMissing = async () => {
      if (user) {
        // Check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') { // PGRST116 indicates no row found
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                username: user.email ? user.email.split('@')[0] : null, // 例: メールアドレスからユーザー名を生成
                is_admin: false, // デフォルトで非管理者に設定
              },
            ]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            console.log('Profile created for user:', user.id);
          }
        } else if (error) {
          console.error('Error checking profile:', error);
        }
      }
    };

    createProfileIfMissing();
  }, [user, supabase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {isLoading && <LoadingOverlay />}
      <main style={{ flexGrow: 1 }}>{children}</main>
      <Footer />
      <Suspense fallback={<div>Loading...</div>}>
        <FeedbackToast />
      </Suspense>
    </div>
  );
} 