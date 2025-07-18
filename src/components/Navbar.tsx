'use client'

import { Box, Flex, Heading, Spacer, Link as ChakraLink, Button, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Text, Collapse, Tag, HStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import { useEffect, useState, useRef } from 'react';
import { Profile } from '@/types/database';
import { MdMenu, MdKeyboardArrowDown } from 'react-icons/md';
import { FiBell } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';
import ColoredUserName from './ColoredUserName';

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
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [explanationCount, setExplanationCount] = useState(0);
  const [bestAnswerCount, setBestAnswerCount] = useState(0);
  const [isExplanationNo1, setIsExplanationNo1] = useState(false);
  const [isBestAnswerNo1, setIsBestAnswerNo1] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isOpen: isNotificationsOpen, onOpen: onNotificationsOpen, onClose: onNotificationsClose } = useDisclosure();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const isMaclathPage = pathname.startsWith('/maclath');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, is_admin')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
          setIsAdmin(profile.is_admin);
        }
        // 解説数
        const { data: explanations } = await supabase
          .from('explanations')
          .select('id')
          .eq('user_id', session.user.id);
        setExplanationCount(explanations?.length || 0);
        // ベストアンサー数
        const { data: bestAnswerQuestions } = await supabase
          .from('questions')
          .select('best_answer_id')
          .not('best_answer_id', 'is', null);
        let baCount = 0;
        if (bestAnswerQuestions) {
          const { data: myAnswers } = await supabase
            .from('answers')
            .select('id, user_id');
          const myAnswerIds = myAnswers?.filter(a => a.user_id === session.user.id).map(a => a.id) || [];
          baCount = bestAnswerQuestions.filter(q => myAnswerIds.includes(q.best_answer_id)).length;
        }
        setBestAnswerCount(baCount);
        // No.1バッジ
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, is_admin');
        const { data: allExplanations } = await supabase
          .from('explanations')
          .select('user_id');
        const explanationCountMap = {};
        allExplanations?.forEach(e => {
          if (!allProfiles?.find(p => p.id === e.user_id)?.is_admin) {
            explanationCountMap[e.user_id] = (explanationCountMap[e.user_id] || 0) + 1;
          }
        });
        const maxExplanation = Math.max(...Object.values(explanationCountMap), 0);
        const no1ExplanationUsers = Object.entries(explanationCountMap)
          .filter(([_, cnt]) => cnt === maxExplanation)
          .map(([uid]) => uid);
        setIsExplanationNo1(!profile?.is_admin && no1ExplanationUsers.includes(session.user.id));
        // ベストアンサーNo.1
        const { data: allAnswers } = await supabase
          .from('answers')
          .select('id, user_id');
        const { data: allBestAnswerQuestions } = await supabase
          .from('questions')
          .select('best_answer_id')
          .not('best_answer_id', 'is', null);
        const bestAnswerCountMap = {};
        allBestAnswerQuestions?.forEach(q => {
          const ans = allAnswers?.find(a => a.id === q.best_answer_id);
          if (ans && !allProfiles?.find(p => p.id === ans.user_id)?.is_admin) {
            bestAnswerCountMap[ans.user_id] = (bestAnswerCountMap[ans.user_id] || 0) + 1;
          }
        });
        const maxBestAnswer = Math.max(...Object.values(bestAnswerCountMap), 0);
        const no1BestAnswerUsers = Object.entries(bestAnswerCountMap)
          .filter(([_, cnt]) => cnt === maxBestAnswer)
          .map(([uid]) => uid);
        setIsBestAnswerNo1(!profile?.is_admin && no1BestAnswerUsers.includes(session.user.id));
      }
    };

    fetchUserProfile();
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

  const handleNotificationClick = async (notification: Notification) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
    }

    if (notification.type === 'explanation_posted') {
      router.push(`/problems/${notification.related_entity_id}/explanations`);
    } else if (notification.type === 'user_deleted') {
      router.push(`/`);
    } else {
      router.push(`/maclath/questions/${notification.related_entity_id}`);
    }
    onNotificationsClose();
  };

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
    <Box as="nav" bg={isMaclathPage ? "#fffff7" : "blue.600"} color={isMaclathPage ? "blue.800" : "white"} px={6} py={4} boxShadow="sm" height="64px" borderBottom={isMaclathPage ? "1px solid" : "none"} borderColor={isMaclathPage ? "blue.200" : "transparent"}>
      <Flex align="center" height="100%">
        {isMaclathPage ? (
          <Flex align="center" mr={2} height="100%">
            <Image
              src="/Maclathロゴ.svg"
              alt="Maclath Logo"
              width={238}
              height={48}
              style={{ objectFit: 'contain' }}
            />
          </Flex>
        ) : (
          <Heading as={Link} href="/" size="md" color="white" _hover={{ textDecoration: "none", color: "blue.200" }} mr={2}>
            JMO Virtual Contest
          </Heading>
        )}
        <Spacer />
        <Flex gap={4} display={{ base: 'none', md: 'flex' }} alignItems="center">
          <ChakraLink as={Link} href="/" _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
            HOME
          </ChakraLink>
          <ChakraLink as={Link} href="/problems" _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
            問題一覧
          </ChakraLink>
          <ChakraLink as={Link} href="/contests" _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
            コンテスト一覧
          </ChakraLink>
          <Menu>
            <MenuButton as={ChakraLink} px={0} bg="none" _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200', textDecoration: 'none' }} _active={{ bg: 'none' }} _focus={{ boxShadow: 'none' }}>
              Community
            </MenuButton>
            <MenuList bg={isMaclathPage ? "white" : "blue.800"}>
              <MenuItem as={Link} href="/users" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"} onClick={onClose}>
                ユーザーリスト
              </MenuItem>
              <MenuItem as={Link} href="/maclath" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"} onClick={onClose}>
                Maclath
              </MenuItem>
            </MenuList>
          </Menu>
          <ChakraLink as={Link} href="/rules" _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
            ルール
          </ChakraLink>
          {session ? (
            <HStack spacing={4}>
              <Menu>
                <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme={isMaclathPage ? "blue" : "whiteAlpha"} variant="outline" color={isMaclathPage ? "blue.800" : "white"}>
                  Hi, {userId && username ? (
                    <ColoredUserName
                      userId={userId}
                      username={username}
                      isAdmin={isAdmin}
                      explanationCount={explanationCount}
                      bestAnswerCount={bestAnswerCount}
                      isExplanationNo1={isExplanationNo1}
                      isBestAnswerNo1={isBestAnswerNo1}
                      fontWeight="bold"
                      fontSize="inherit"
                      isProfileLink={true}
                    />
                  ) : (
                    <Text as="span" color={isAdmin ? "rgb(102, 0, 153)" : undefined}>{username || session?.user?.email}</Text>
                  )}
                </MenuButton>
                <MenuList bg={isMaclathPage ? "white" : "blue.800"}>
                  <MenuItem as={Link} href="/profile" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>マイページ</MenuItem>
                  <MenuItem onClick={handleSignOut} bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>ログアウト</MenuItem>
                </MenuList>
              </Menu>
              <Box position="relative">
                <IconButton
                  aria-label="通知"
                  icon={<FiBell size="20px" />}
                  variant="ghost"
                  color={isMaclathPage ? "blue.800" : "white"}
                  _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}
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
                  <MenuList bg={isMaclathPage ? "white" : "blue.800"}>
                    <MenuItem as={Link} href="/admin/problems" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>問題管理</MenuItem>
                    <MenuItem as={Link} href="/admin/contests" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>コンテスト管理</MenuItem>
                    <MenuItem as={Link} href="/admin/announcements" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>お知らせ管理</MenuItem>
                    <MenuItem as={Link} href="/admin/categories" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>カテゴリ管理</MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          ) : (
            <Button as={Link} href="/auth" size="sm" bg="white" color="blue.600" _hover={{ bg: 'blue.50', color: 'blue.800', borderColor: 'blue.200' }} borderWidth={1} borderColor="blue.200" variant="outline">
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
          colorScheme={isMaclathPage ? "blue" : "whiteAlpha"}
          ml={2}
        />
        <Drawer isOpen={isOpen} placement="right" onClose={() => { onClose(); setIsUserMenuOpen(false); }} finalFocusRef={btnRef}>
          <DrawerOverlay />
          <DrawerContent bg={isMaclathPage ? "#fffff7" : "blue.700"} color={isMaclathPage ? "blue.800" : "white"}>
            <DrawerCloseButton />
            <DrawerHeader>メニュー</DrawerHeader>
            <DrawerBody>
              <Stack spacing={4}>
                <ChakraLink as={Link} href="/" onClick={onClose} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
                  HOME
                </ChakraLink>
                <ChakraLink as={Link} href="/problems" onClick={onClose} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
                  問題一覧
                </ChakraLink>
                <ChakraLink as={Link} href="/contests" onClick={onClose} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
                  コンテスト一覧
                </ChakraLink>
                <Menu>
                  <MenuButton as={ChakraLink} px={0} bg="none" _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200', textDecoration: 'none' }} _active={{ bg: 'none' }} _focus={{ boxShadow: 'none' }}>
                    Community
                  </MenuButton>
                  <MenuList bg={isMaclathPage ? "white" : "blue.800"}>
                    <MenuItem as={Link} href="/users" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"} onClick={onClose}>
                      ユーザーリスト
                    </MenuItem>
                    <MenuItem as={Link} href="/maclath" bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"} onClick={onClose}>
                      Maclath
                    </MenuItem>
                  </MenuList>
                </Menu>
                <ChakraLink as={Link} href="/rules" onClick={onClose} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}>
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
                      _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}
                    >
                      <Text fontSize="lg" fontWeight="bold" color={isMaclathPage ? "blue.800" : "white"}>
                        Hi, {userId && username ? (
                          <ColoredUserName
                            userId={userId}
                            username={username}
                            isAdmin={isAdmin}
                            explanationCount={explanationCount}
                            bestAnswerCount={bestAnswerCount}
                            isExplanationNo1={isExplanationNo1}
                            isBestAnswerNo1={isBestAnswerNo1}
                            fontWeight="bold"
                            fontSize="inherit"
                            isProfileLink={true}
                          />
                        ) : (
                          <span style={{ color: isAdmin ? "rgb(102, 0, 153)" : (isMaclathPage ? "blue.800" : "white") }}>{username}</span>
                        )}
                      </Text>
                      <MdKeyboardArrowDown style={{ transform: `rotate(${isUserMenuOpen ? 180 : 0}deg)`, transition: 'transform 0.2s', color: isMaclathPage ? 'blue.800' : 'white' }} />
                    </Flex>
                    <Flex align="center" py={2} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }}
                      cursor="pointer"
                      onClick={() => { onNotificationsOpen(); onClose(); }}
                    >
                      <FiBell size="20px" style={{ color: isMaclathPage ? 'blue.800' : 'white' }} />
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
                         <ChakraLink as={Link} href="/profile" onClick={() => { onClose(); setIsUserMenuOpen(false); }} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }} color={isMaclathPage ? 'blue.800' : 'white'}>
                      マイページ
                    </ChakraLink>
                         <Button onClick={() => { onClose(); handleSignOut(); setIsUserMenuOpen(false); }} variant="ghost" color={isMaclathPage ? 'blue.800' : 'white'} _hover={{ color: isMaclathPage ? 'blue.600' : 'blue.200' }} w="full" justifyContent="flex-start" mt={2}>
                      ログアウト
                    </Button>
                    {isAdmin && (
                      <Menu>
                             <MenuButton as={Button} rightIcon={<MdKeyboardArrowDown />} size="sm" colorScheme={isMaclathPage ? "blue" : "teal"} variant="solid" w="full" justifyContent="flex-start" onClick={(e) => e.stopPropagation()}>
                          管理者メニュー
                        </MenuButton>
                        <MenuList bg={isMaclathPage ? "white" : "blue.800"}>
                               <MenuItem as={Link} href="/admin/problems" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>問題管理</MenuItem>
                               <MenuItem as={Link} href="/admin/contests" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>コンテスト管理</MenuItem>
                               <MenuItem as={Link} href="/admin/announcements" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>お知らせ管理</MenuItem>
                               <MenuItem as={Link} href="/admin/categories" onClick={() => { onClose(); setIsUserMenuOpen(false); }} bg={isMaclathPage ? "white" : "blue.800"} color={isMaclathPage ? "blue.800" : "white"}>カテゴリ管理</MenuItem>
                        </MenuList>
                      </Menu>
                    )}
                      </Stack>
                    </Collapse>
                  </>
                ) : (
                  <Button as={Link} href="/auth" size="sm" bg="white" color="blue.600" _hover={{ bg: 'blue.50', color: 'blue.800', borderColor: 'blue.200' }} borderWidth={1} borderColor="blue.200" variant="outline" onClick={onClose} w="full">
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
                      bg={notification.is_read ? "gray.700" : "purple.200"}
                      borderRadius="md"
                      _hover={{ bg: notification.is_read ? "gray.600" : "purple.300" }}
                      cursor="pointer"
                      onClick={() => handleNotificationClick(notification)}
                      display="flex"
                      alignItems="center"
                    >
                      {!notification.is_read && (
                        <span style={{ color: '#a259ff', marginRight: 8, fontSize: '1.2em' }}>●</span>
                      )}
                      <Box flex="1">
                        <Text fontWeight={notification.is_read ? "normal" : "bold"} color={notification.is_read ? "gray.200" : "purple.900"}>
                          {notification.message}
                        </Text>
                        <Text fontSize="xs" color={notification.is_read ? "gray.400" : "purple.700"}>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ja })}
                        </Text>
                      </Box>
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