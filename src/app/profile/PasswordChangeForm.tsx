'use client';

import { useState } from 'react';
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

export default function PasswordChangeForm() {
  const supabase = createClientComponentClient();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
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
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
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
        title: 'パスワード変更完了',
        description: 'パスワードが変更されました。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <Box mt={8} w="full">
      <Heading as="h2" size="lg" mb={4}>パスワード変更</Heading>
      <VStack spacing={4} align="start">
        <FormControl id="new-password">
          <FormLabel>新しいパスワード</FormLabel>
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
        </FormControl>
        <FormControl id="confirm-password">
          <FormLabel>新しいパスワード（確認用）</FormLabel>
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
        </FormControl>
        <Button
          colorScheme="blue"
          onClick={handleChangePassword}
          isLoading={isLoading}
        >
          パスワードを変更
        </Button>
      </VStack>
    </Box>
  );
} 