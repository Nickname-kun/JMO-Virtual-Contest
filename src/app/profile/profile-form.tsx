"use client";

import { Box, VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface ProfileFormProps {
  initialProfile: { username: string | null } | null;
  updateUsernameAction: (formData: FormData) => Promise<{ status: string; message: string }>;
}

export default function ProfileForm({
  initialProfile,
  updateUsernameAction,
}: ProfileFormProps) {
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [submitState, setSubmitState] = useState<{ status: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (submitState?.status) {
      toast({
        title: submitState.status === 'success' ? '成功' : 'エラー',
        description: submitState.message,
        status: submitState.status === 'success' ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      if (submitState.status === 'success' && submitState.message === 'ユーザー名が更新されました！') {
        // ページの再読み込みや、新しいユーザー名をどこかに反映させる処理など
        // 今回はシンプルにトースト表示のみで完了とします
      }
      setSubmitState(null);
    }
  }, [submitState, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await updateUsernameAction(formData);

    setSubmitState(result);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="start">
        <FormControl id="username">
          <FormLabel>ユーザー名</FormLabel>
          <Input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          ユーザー名を更新
        </Button>
      </VStack>
    </form>
  );
} 