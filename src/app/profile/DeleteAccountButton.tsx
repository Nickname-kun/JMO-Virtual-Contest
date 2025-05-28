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
      // プロフィールデータを削除
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) throw profileError;

      // アカウントを削除
      const { error: deleteError } = await (supabase.auth as any).deleteUser();

      if (deleteError) throw deleteError;

      toast({
        title: 'アカウントを削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // トップページにリダイレクト
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'エラー',
        description: 'アカウントの削除に失敗しました。',
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