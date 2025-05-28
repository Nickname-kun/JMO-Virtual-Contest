import { Box, Spinner, Text, VStack } from "@chakra-ui/react";

export default function LoadingOverlay() {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.5)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      role="alert"
      aria-live="assertive"
      aria-busy="true"
    >
      <VStack spacing={4}>
        <Spinner size="xl" color="white" aria-label="読み込み中" />
        <Text color="white" fontSize="lg">
          読み込み中...
        </Text>
      </VStack>
    </Box>
  );
} 