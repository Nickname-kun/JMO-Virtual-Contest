import { Button } from '@chakra-ui/react';
import { FaTwitter } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const TwitterAuthButton = () => {
  const supabase = createClientComponentClient<Database>();

  const handleTwitterLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Twitter認証エラー:', error);
    }
  };

  return (
    <Button
      leftIcon={<FaTwitter />}
      bgColor="#1DA1F2"
      color="white"
      _hover={{
        bgColor: "#1A94E0",
      }}
      onClick={handleTwitterLogin}
      w="full"
    >
      Twitterでログイン
    </Button>
  );
}; 