'use client'

import { Box, Flex, Heading, Spacer, Link as ChakraLink, Button, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Text, Collapse, Tag, HStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import { useEffect, useState, useRef } from 'react';
import { Profile } from '@/types/database';
import { MdMenu, MdKeyboardArrowDown } from 'react-icons/md';
import { FiBell } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

type Notification = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_entity_id: string;
  is_read: boolean;
  created_at: string;
};

export default function Navbar() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isOpen: isNotificationsOpen, onOpen: onNotificationsOpen, onClose: onNotificationsClose } = useDisclosure();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin, username')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          setIsAdmin(data.is_admin);
          setUsername(data.username);
        } else {
          setIsAdmin(false);
          setUsername(null);
        }
      } else {
        setIsAdmin(false);
        setUsername(null);
      }
    };
    fetchProfile();
  }, [session, supabase]);

  useEffect(() => {
    if (!session?.user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    };

    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        payload => {
          console.log('Realtime notification payload:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabase]);

  const handleMarkAllAsRead = async () => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    router.push('/');
    router.refresh();
  };

  return (
    <Box as="nav" bg="blue.600" color="white" px={6} py={4} boxShadow="sm">
      <Flex align="center">
        <Heading as={Link} href="/" size="md" color="white" _hover={{ textDecoration: "none", color: "blue.200" }}>
          JMO Virtual Contest
        </Heading>
        <Spacer />
        <Flex gap={4} display={{ base: 'none', md: 'flex' }} alignItems="center">
          <ChakraLink as={Link} href="/" _hover={{ color: 'blue.200' }}>
            HOME
          </ChakraLink>
          <ChakraLink as={Link} href="/maclath" _hover={{ color: 'blue.200' }}>
            Maclath
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
            <HStack spacing={4}>
              <Menu>
                <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme="whiteAlpha" variant="outline" color="white">
                  Hi, {username || session.user.email}
                </MenuButton>
                <MenuList bg="blue.800">
                  <MenuItem as={Link} href="/profile" bg="blue.800">マイページ</MenuItem>
                  <MenuItem onClick={handleSignOut} bg="blue.800">ログアウト</MenuItem>
                </MenuList>
              </Menu>
              <Box position="relative">
                <IconButton
                  aria-label="通知"
                  icon={<FiBell size="20px" />}
                  variant="ghost"
                  color="white"
                  _hover={{ color: 'blue.200' }}
                  onClick={onNotificationsOpen}
                  ref={notificationButtonRef}
                />
                {unreadCount > 0 && (
                  <Tag
                    size="sm"
                    borderRadius="full"
                    variant="solid"
                    colorScheme="red"
                    position="absolute"
                    top="-5px"
                    right="-5px"
                  >
                    {unreadCount}
                  </Tag>
                )}
              </Box>
              {isAdmin && (
                <Menu>
                  <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme="teal" variant="solid" ml={2}>
                    管理者メニュー
                  </MenuButton>
                  <MenuList bg="blue.800">
                    <MenuItem as={Link} href="/admin/problems" bg="blue.800">問題管理</MenuItem>
                    <MenuItem as={Link} href="/admin/contests" bg="blue.800">コンテスト管理</MenuItem>
                    <MenuItem as={Link} href="/admin/announcements" bg="blue.800">お知らせ管理</MenuItem>
                    <MenuItem as={Link} href="/admin/categories" bg="blue.800">カテゴリ管理</MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          ) : (
            <Button as={Link} href="/auth" size="sm" colorScheme="whiteAlpha" variant="outline">
              ログイン
            </Button>
          )}
        </Flex>
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
        <Drawer isOpen={isOpen} placement="right" onClose={() => { onClose(); setIsUserMenuOpen(false); }} finalFocusRef={btnRef}>
          <DrawerOverlay />
          <DrawerContent bg="blue.700" color="white">
            <DrawerCloseButton />
            <DrawerHeader>メニュー</DrawerHeader>
            <DrawerBody>
              <Stack spacing={4}>
                <ChakraLink as={Link} href="/" onClick={onClose} _hover={{ color: 'blue.200' }}>
                  HOME
                </ChakraLink>
                <ChakraLink as={Link} href="/maclath" onClick={onClose} _hover={{ color: 'blue.200' }}>
                  Maclath
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
                    <Flex 
                      align="center"
                      justify="space-between"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      cursor="pointer"
                      py={2}
                      _hover={{ color: 'blue.200' }}
                    >
                      {username && (
                        <Text fontSize="lg" fontWeight="bold">Hi, {username}</Text>
                      )}
                      <MdKeyboardArrowDown style={{ transform: `rotate(${isUserMenuOpen ? 180 : 0}deg)`, transition: 'transform 0.2s' }} />
                    </Flex>
                    <Flex align="center" py={2} _hover={{ color: 'blue.200' }}
                      cursor="pointer"
                      onClick={() => { onNotificationsOpen(); onClose(); }}
                    >
                      <FiBell size="20px" style={{ color: 'white' }} />
                      <Text ml={2}>通知</Text>
                      {unreadCount > 0 && (
                        <Tag
                          size="sm"
                          borderRadius="full"
                          variant="solid"
                          colorScheme="red"
                          ml={2}
                        >
                          {unreadCount}
                        </Tag>
                      )}
                    </Flex>
                    <Collapse in={isUserMenuOpen} animateOpacity>
                      <Stack pl={4} borderLeft="1px solid white" spacing={2}>
                         <ChakraLink as={Link} href="/profile" onClick={() => { onClose(); setIsUserMenuOpen(false); }} _hover={{ color: 'blue.200' }}>
                      マイページ
                    </ChakraLink>
                    {isAdmin && (
                      <Menu>
                             <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme="teal" variant="solid" w="full" justifyContent="flex-start" onClick={(e) => e.stopPropagation()}>
                          管理者メニュー
                        </MenuButton>
                        <MenuList bg="blue.800">
                               <MenuItem as={Link} href="/admin/problems" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg="blue.800">問題管理</MenuItem>
                               <MenuItem as={Link} href="/admin/contests" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg="blue.800">コンテスト管理</MenuItem>
                               <MenuItem as={Link} href="/admin/announcements" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg="blue.800">お知らせ管理</MenuItem>
                               <MenuItem as={Link} href="/admin/categories" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg="blue.800">カテゴリ管理</MenuItem>
                        </MenuList>
                      </Menu>
                    )}
                         <Button onClick={() => { onClose(); handleSignOut(); setIsUserMenuOpen(false); }} size="sm" colorScheme="red" variant="solid" w="full" justifyContent="flex-start" mt={2}>
                      ログアウト
                    </Button>
                      </Stack>
                    </Collapse>
                  </>
                ) : (
                  <Button as={Link} href="/auth" size="sm" colorScheme="whiteAlpha" variant="outline" onClick={onClose} w="full">
                    ログイン
                  </Button>
                )}
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>

      <Drawer
        isOpen={isNotificationsOpen}
        placement="right"
        onClose={onNotificationsClose}
        finalFocusRef={notificationButtonRef}
      >
        <DrawerOverlay />
        <DrawerContent bg="blue.700" color="white">
          <DrawerCloseButton />
          <DrawerHeader>通知</DrawerHeader>
          <DrawerBody>
            <Stack spacing={4}>
              {notifications.length === 0 ? (
                <Text>新しい通知はありません。</Text>
              ) : (
                <>
                  <Button size="sm" colorScheme="teal" onClick={handleMarkAllAsRead}>全て既読にする</Button>
                  {notifications.map(notification => (
                    <Box
                      key={notification.id}
                      p={3}
                      bg={notification.is_read ? "blue.600" : "blue.500"}
                      borderRadius="md"
                      _hover={{ bg: "blue.400" }}
                      cursor="pointer"
                      onClick={async () => {
                        await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
                        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                        setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
                        onNotificationsClose();
                        if (notification.type === 'new_answer' || notification.type === 'best_answer') {
                          router.push(`/questions/${notification.related_entity_id}`);
                        }
                      }}
                    >
                      <Text fontWeight={notification.is_read ? "normal" : "bold"}>{notification.message}</Text>
                      <Text fontSize="xs" color="gray.300">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ja })}
                      </Text>
                    </Box>
                  ))}
                </>
              )}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
} 