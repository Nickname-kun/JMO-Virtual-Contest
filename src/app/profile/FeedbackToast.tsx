"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@chakra-ui/react';

export default function FeedbackToast() {
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status && message) {
      toast({
        title: status === 'success' ? '成功' : 'エラー',
        description: decodeURIComponent(message),
        status: status === 'success' ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });

      // トースト表示後、クエリパラメータをクリアする
      // History API を使用してURLを書き換えることでページリロードを防ぐ
      const url = new URL(window.location.href);
      url.searchParams.delete('status');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, toast]);

  return null; // このコンポーネントはUIを持たず、トースト表示のみを行います
} 