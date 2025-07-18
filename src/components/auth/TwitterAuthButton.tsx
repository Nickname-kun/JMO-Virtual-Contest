import { Button } from '@chakra-ui/react';
import { FaXTwitter } from 'react-icons/fa6';
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
          scopes: 'email',
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
      leftIcon={<FaXTwitter />}
      bgColor="#000000"
      color="white"
      _hover={{
        bgColor: "#333333",
      }}
      onClick={handleTwitterLogin}
      w="full"
    >
      Twitterでログイン
    </Button>
  );
}; 
