"use client";

import { Box, VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface ProfileFormProps {
  initialUsername: string;
  userId: string;
}

export default function ProfileForm({
  initialUsername,
  userId,
}: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          username,
        }),
      });

      const result = await response.json();

      toast({
        title: result.status === 'success' ? '成功' : 'エラー',
        description: result.message,
        status: result.status === 'success' ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'ユーザー名の更新に失敗しました。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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