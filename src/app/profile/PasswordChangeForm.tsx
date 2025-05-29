'use client';

import { useState, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Stack,
  Text,
  useToast,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'; // react-iconsを使用

function PasswordChangeFormContent() {
  const supabase = createClientComponentClient();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = async () => {
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

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

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
        title: 'パスワードを変更しました',
        description: '新しいパスワードでログインしてください。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsLoading(false);
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="md" mx="auto" width="100%">
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="md">パスワード変更</Heading>
        <FormControl width="full">
          <FormLabel>新しいパスワード</FormLabel>
          <InputGroup>
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              width="full"
            />
            <InputRightElement>
              <IconButton
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                icon={showNewPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                onClick={() => setShowNewPassword(!showNewPassword)}
                variant="ghost"
                size="sm"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <FormControl width="full">
          <FormLabel>新しいパスワード（確認用）</FormLabel>
          <InputGroup>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              width="full"
            />
            <InputRightElement>
              <IconButton
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                icon={showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="ghost"
                size="sm"
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Button
          colorScheme="blue"
          onClick={handlePasswordChange}
          isLoading={isLoading}
          width="full"
        >
          パスワードを変更
        </Button>
      </VStack>
    </Box>
  );
}

export default function PasswordChangeForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordChangeFormContent />
    </Suspense>
  );
} 