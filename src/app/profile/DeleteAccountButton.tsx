'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Input,
} from '@chakra-ui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DeleteAccountButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const toast = useToast();
  const supabase = createClientComponentClient();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'エラー',
        description: '確認のため、DELETE と入力してください。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // ユーザー情報取得
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        // すでにセッションが切れている等の場合はそのままリダイレクト
        router.push('/');
        return;
      }
      // 提出データを削除
      await supabase.from('submissions').delete().eq('user_id', userData.user.id);
      // バーチャルコンテスト履歴を削除
      await supabase.from('virtual_contests').delete().eq('user_id', userData.user.id);
      // プロフィールデータを削除
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userData.user.id);

      if (profileError) throw profileError;

      toast({
        title: 'アカウントデータを削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // サインアウト
      await supabase.auth.signOut();

      // トップページにリダイレクト
      router.push('/');

      // 管理者に通知を送信
      await supabase.from('notifications').insert({
        user_id: '83eb3c48-9ad6-4725-8d83-da0abe6efb6d',
        type: 'user_deleted',
        message: `${userData.user.email} がアカウントを削除しました`,
        related_entity_id: userData.user.id
      });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'エラー',
        description: error?.message || String(error),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <>
      <Button
        colorScheme="red"
        variant="outline"
        onClick={onOpen}
        mt={4}
      >
        アカウントを削除
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>アカウントの削除</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                この操作は取り消せません。アカウントを削除すると、すべてのデータが完全に削除されます。
              </Text>
              <Text>
                削除を実行するには、下の入力欄に「DELETE」と入力してください。
              </Text>
              <Input
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              キャンセル
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isLoading}
              isDisabled={confirmText !== 'DELETE'}
            >
              アカウントを削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 