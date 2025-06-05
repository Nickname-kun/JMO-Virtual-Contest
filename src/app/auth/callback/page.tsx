import { Box, Text, Spinner, VStack } from '@chakra-ui/react';

export default function AuthCallbackPage() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      bgColor="gray.100"
    >
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="xl" color="gray.700">
          認証処理中です...
        </Text>
      </VStack>
    </Box>
  );
} 