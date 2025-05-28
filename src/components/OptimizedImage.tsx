"use client";

import { Box, Image, ImageProps } from "@chakra-ui/react";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/placeholder.png",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Box position="relative" overflow="hidden">
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
        transition="opacity 0.3s"
        opacity={isLoading ? 0 : 1}
        {...props}
      />
      {isLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="gray.100"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            width="40px"
            height="40px"
            border="4px solid"
            borderColor="gray.200"
            borderTopColor="blue.500"
            borderRadius="full"
            animation="spin 1s linear infinite"
            sx={{
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
} 