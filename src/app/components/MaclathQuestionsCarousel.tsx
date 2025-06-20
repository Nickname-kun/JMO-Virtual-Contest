"use client";
import { Box, Heading, Text, Flex, IconButton } from '@chakra-ui/react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function MaclathQuestionsCarousel({ questions }: { questions: any[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0); // -1: left, 1: right
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!questions || questions.length === 0) return;
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % questions.length);
    }, 5000); // 5秒ごとに自動切り替え
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions, isPaused]);

  if (!questions || questions.length === 0) {
    return <Text color="gray.700">現在、新しい質問はありません。</Text>;
  }
  const q = questions[index];

  // スライドアニメーションのバリアント
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      position: 'absolute' as const,
    }),
    center: {
      x: 0,
      opacity: 1,
      position: 'relative' as const,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      position: 'absolute' as const,
    }),
  };

  const handlePrev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };
  const handleNext = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <Box
      position="relative"
      w="full"
      minH="120px"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Flex align="center" justify="center">
        <IconButton
          aria-label="前の質問"
          icon={<FaChevronLeft />}
          onClick={handlePrev}
          variant="ghost"
          size="sm"
          position="absolute"
          left={0}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
        />
        <Box
          mx="auto"
          w={{ base: '100%', md: '80%' }}
          minH="120px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div
              key={q.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, type: 'tween' }}
              style={{ width: '100%' }}
            >
              <Box
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                p={6}
                borderWidth={1}
                w="100%"
                minH="120px"
                transition="box-shadow 0.2s"
              >
                <Heading as={Link} href={`/maclath/questions/${q.id}`} size="md" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                  {q.title}
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  {q.profiles?.username ? `投稿者: ${q.profiles.username}` : ''} {new Date(q.created_at).toLocaleString()}
                </Text>
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
        <IconButton
          aria-label="次の質問"
          icon={<FaChevronRight />}
          onClick={handleNext}
          variant="ghost"
          size="sm"
          position="absolute"
          right={0}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
        />
      </Flex>
      {/* ドットインジケーター */}
      <Flex justify="center" mt={2} gap={2}>
        {questions.map((_: any, i: number) => (
          <Box
            key={i}
            w={2}
            h={2}
            borderRadius="full"
            bg={i === index ? 'purple.500' : 'gray.300'}
            transition="background 0.2s"
          />
        ))}
      </Flex>
    </Box>
  );
} 