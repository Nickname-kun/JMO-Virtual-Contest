import { ReactNode } from 'react'
import { Box, Flex, Link } from '@chakra-ui/react'
import NextLink from 'next/link'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box>
      <Flex as="nav" bg="teal.500" color="white" p={4} mb={8}>
        <NextLink href="/" passHref>
          <Link mr={4}>ホーム</Link>
        </NextLink>
        <NextLink href="/auth" passHref>
          <Link mr={4}>認証</Link>
        </NextLink>
        {/* 必要に応じて他のリンクも追加 */}
      </Flex>
      <Box maxW="800px" mx="auto">
        {children}
      </Box>
    </Box>
  )
} 