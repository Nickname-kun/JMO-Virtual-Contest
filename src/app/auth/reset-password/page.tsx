'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Input,
  Heading,
  Stack,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get the code from the URL (e.g., /auth/reset-password?code=...) when the page loads
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCode(codeFromUrl);
    } else {
      // If no code is present, redirect to login or show an error
      toast({
        title: 'エラー',
        description: '無効なリセットリンクです。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.push('/auth'); // Redirect to login page
    }
  }, [searchParams, router, toast]);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'エラー',
        description: '新しいパスワードと確認用パスワードが一致しません。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!newPassword) {
       toast({
         title: 'エラー',
         description: '新しいパスワードを入力してください。',
         status: 'error',
         duration: 5000,
         isClosable: true,
       });
       return;
    }

    setIsLoading(true);
    // Use the code to update the user's password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    }, { emailRedirectTo: '/auth' }); // Optional: redirect after successful password update
    setIsLoading(false);

    if (error) {
      toast({
        title: 'エラー',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'パスワードをリセットしました',
        description: '新しいパスワードでログインしてください。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/auth'); // Redirect to login page after success
    }
  };

  // Don't render the form until the code is extracted from the URL
  if (!code) {
    return <Text textAlign="center">リセット情報を読み込み中...</Text>;
  }

  return (
    <Box p={8} maxW="md" mx="auto" mt={10}>
      <Stack spacing={4}>
        <Heading as="h1" size="lg" textAlign="center">パスワード再設定</Heading>
        <Text textAlign="center">新しいパスワードを入力してください。</Text>
        <InputGroup size="md">
          <Input
            placeholder="新しいパスワード"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            pr="4.5rem"
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h="1.75rem" size="sm"
              onClick={() => setShowNewPassword(v => !v)}
              icon={showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              variant="ghost"
            />
          </InputRightElement>
        </InputGroup>
        <InputGroup size="md">
          <Input
            placeholder="新しいパスワード（確認用）"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            pr="4.5rem"
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h="1.75rem" size="sm"
              onClick={() => setShowConfirmPassword(v => !v)}
              icon={showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              variant="ghost"
            />
          </InputRightElement>
        </InputGroup>
        <Button
          colorScheme="blue"
          onClick={handleResetPassword}
          isLoading={isLoading}
          width="full"
        >
          パスワードを再設定
        </Button>
      </Stack>
    </Box>
  );
} 