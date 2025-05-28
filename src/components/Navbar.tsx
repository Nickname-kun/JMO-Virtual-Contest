'use client'

import { Box, Flex, Heading, Spacer, Link as ChakraLink, Button, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import { useEffect, useState, useRef } from 'react';
import { Profile } from '@/types/database';
import { MdMenu, MdKeyboardArrowDown } from 'react-icons/md';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        if (!error && data?.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    fetchProfile();
  }, [session, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <Box as="nav" bg="blue.600" color="white" px={6} py={4} boxShadow="sm">
      <Flex align="center">
        <Heading as={Link} href="/" size="md" color="white" _hover={{ textDecoration: 'none', color: 'blue.200' }}>
          JMO Virtual Contest
        </Heading>
        <Spacer />
        {/* PC表示 */}
        <Flex gap={4} display={{ base: 'none', md: 'flex' }}>
          <ChakraLink as={Link} href="/" _hover={{ color: 'blue.200' }}>
            HOME
          </ChakraLink>
          <ChakraLink as={Link} href="/problems" _hover={{ color: 'blue.200' }}>
            問題一覧
          </ChakraLink>
          <ChakraLink as={Link} href="/contests" _hover={{ color: 'blue.200' }}>
            コンテスト一覧
          </ChakraLink>
          <ChakraLink as={Link} href="/rules" _hover={{ color: 'blue.200' }}>
            ルール
          </ChakraLink>
          {session ? (
            <>
              <ChakraLink as={Link} href="/profile" _hover={{ color: 'blue.200' }}>
                マイページ
              </ChakraLink>
              {isAdmin && (
                <Menu>
                  <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme="teal" variant="solid" ml={2}>
                    管理者メニュー
                  </MenuButton>
                  <MenuList bg="blue.800">
                    <MenuItem as={Link} href="/admin/problems" bg="blue.800">問題管理</MenuItem>
                    <MenuItem as={Link} href="/admin/contests" bg="blue.800">コンテスト管理</MenuItem>
                    <MenuItem as={Link} href="/admin/announcements" bg="blue.800">お知らせ管理</MenuItem>
                  </MenuList>
                </Menu>
              )}
              <Button onClick={handleSignOut} size="sm" colorScheme="whiteAlpha" variant="outline">
                ログアウト
              </Button>
            </>
          ) : (
            <Button as={Link} href="/auth" size="sm" colorScheme="whiteAlpha" variant="outline">
              ログイン
            </Button>
          )}
        </Flex>
        {/* モバイル表示: ハンバーガーメニュー */}
        <IconButton
          ref={btnRef}
          aria-label="メニューを開く"
          icon={<MdMenu />}
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="ghost"
          colorScheme="whiteAlpha"
          ml={2}
        />
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={btnRef}>
          <DrawerOverlay />
          <DrawerContent bg="blue.700" color="white">
            <DrawerCloseButton />
            <DrawerHeader>メニュー</DrawerHeader>
            <DrawerBody>
              <Stack spacing={4}>
                <ChakraLink as={Link} href="/" onClick={onClose} _hover={{ color: 'blue.200' }}>
                  HOME
                </ChakraLink>
                <ChakraLink as={Link} href="/problems" onClick={onClose} _hover={{ color: 'blue.200' }}>
                  問題一覧
                </ChakraLink>
                <ChakraLink as={Link} href="/contests" onClick={onClose} _hover={{ color: 'blue.200' }}>
                  コンテスト一覧
                </ChakraLink>
                <ChakraLink as={Link} href="/rules" onClick={onClose} _hover={{ color: 'blue.200' }}>
                  ルール
                </ChakraLink>
                {session ? (
                  <>
                    <ChakraLink as={Link} href="/profile" onClick={onClose} _hover={{ color: 'blue.200' }}>
                      マイページ
                    </ChakraLink>
                    {isAdmin && (
                      <Menu>
                        <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme="teal" variant="solid" ml={2} onClick={(e) => e.stopPropagation()}>
                          管理者メニュー
                        </MenuButton>
                        <MenuList bg="blue.800">
                          <MenuItem as={Link} href="/admin/problems" onClick={onClose} bg="blue.800">問題管理</MenuItem>
                          <MenuItem as={Link} href="/admin/contests" onClick={onClose} bg="blue.800">コンテスト管理</MenuItem>
                          <MenuItem as={Link} href="/admin/announcements" onClick={onClose} bg="blue.800">お知らせ管理</MenuItem>
                        </MenuList>
                      </Menu>
                    )}
                    <Button onClick={() => { onClose(); handleSignOut(); }} size="sm" colorScheme="whiteAlpha" variant="outline">
                      ログアウト
                    </Button>
                  </>
                ) : (
                  <Button as={Link} href="/auth" size="sm" colorScheme="whiteAlpha" variant="outline" onClick={onClose}>
                    ログイン
                  </Button>
                )}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Box>
  );
} 