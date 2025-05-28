'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Input,
  Heading,
  Stack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightElement,
  IconButton,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function AuthPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const toast = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleSignUp = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword });
    if (error) {
      toast({
        title: 'エラー',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          is_admin: false,
          username: null,
        });
      }
      toast({
        title: '確認メールを送信しました',
        description: 'メールを確認してください',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      toast({
        title: 'エラー',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast({
        title: 'エラー',
        description: 'パスワードリセット用のメールを送信します。ログインフォームのメールアドレス欄に登録済みのメールアドレスを入力し、再度リンクをクリックしてください。',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    // Supabase will send a reset email to the provided email address.
    // We don't check if the email exists for security reasons.
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password` // Replace with your actual reset password page URL
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
        title: 'パスワードリセットメールを送信しました',
        description: '入力されたメールアドレスを確認してください。',
        status: 'success',
        duration: 10000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8} maxW="md" mx="auto">
      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab>ログイン</Tab>
          <Tab>サインアップ</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Stack direction="column" spacing={4}>
              <Heading mb={4} size="md">ログイン</Heading>
              <Input
                placeholder="メールアドレス"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                type="email"
              />
              <InputGroup size="md">
                <Input
                  placeholder="パスワード"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  type={showLoginPassword ? 'text' : 'password'}
                  pr="4.5rem"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem" size="sm"
                    onClick={() => setShowLoginPassword(v => !v)}
                    icon={showLoginPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
              <ChakraLink color="blue.500" href="#" onClick={handleForgotPassword} fontSize="sm" mt={1} textAlign="right">
                パスワードを忘れた場合
              </ChakraLink>
              <Button
                colorScheme="blue"
                onClick={handleSignIn}
                isLoading={isLoading}
                width="full"
              >
                ログイン
              </Button>
            </Stack>
          </TabPanel>
          <TabPanel>
            <Stack direction="column" spacing={4}>
              <Heading mb={4} size="md">サインアップ</Heading>
              <Input
                placeholder="メールアドレス"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                type="email"
              />
              <InputGroup size="md">
                <Input
                  placeholder="パスワード"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  type={showSignupPassword ? 'text' : 'password'}
                  pr="4.5rem"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem" size="sm"
                    onClick={() => setShowSignupPassword(v => !v)}
                    icon={showSignupPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
              <Button
                colorScheme="teal"
                onClick={handleSignUp}
                isLoading={isLoading}
                width="full"
              >
                サインアップ
              </Button>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 